(function(){
  let pyodide=null, loading=null;
  async function ensurePyodide(statusEl){
    if(pyodide) return pyodide;
    if(loading) return loading;
    statusEl.textContent='正在加载 Pyodide（需网络；首次较慢）…';
    loading=(async()=>{
      // Prefer CDN; file:// may block — show clear message
      const cdn='https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
      await new Promise((resolve,reject)=>{
        const s=document.createElement('script');
        s.src=cdn; s.onload=resolve; s.onerror=()=>reject(new Error('无法加载 Pyodide CDN'));
        document.head.appendChild(s);
      });
      pyodide=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'});
      statusEl.textContent='Pyodide 就绪';
      return pyodide;
    })();
    try{return await loading;}catch(e){statusEl.textContent='加载失败：'+e.message+'。请用本地 http.server 打开并确保可访问 CDN。';throw e;}
  }
  async function runPython(code, outEl, statusEl){
    outEl.textContent='';
    const py=await ensurePyodide(statusEl);
    try{
      await py.runPythonAsync(`
import sys
from io import StringIO
_buf=StringIO()
sys.stdout=_buf
sys.stderr=_buf
`);
      await py.runPythonAsync(code);
      const text=py.runPython('_buf.getvalue()');
      outEl.textContent=text||'(无 stdout；运行完成)';
      statusEl.textContent='运行完成';
    }catch(e){
      outEl.textContent=String(e);
      statusEl.textContent='运行出错';
    }
  }
  window.Playground={ensurePyodide,runPython};
})();
