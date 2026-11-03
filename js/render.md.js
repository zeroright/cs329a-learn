(function(){
  function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function transformNotionish(md){
    // callout blocks
    md=md.replace(/<callout[^>]*>\s*([\s\S]*?)\s*<\/callout>/gi,(_,body)=>{
      const lines=body.trim().split(/\n/);
      const title=lines[0]||'';
      const rest=lines.slice(1).join('\n');
      return `\n\n<div class="callout"><strong>${escapeHtml(title)}</strong>\n\n${rest}\n</div>\n\n`;
    });
    md=md.replace(/<quote>\s*([\s\S]*?)\s*<\/quote>/gi,(_,body)=>`\n\n> ${body.trim().replace(/\n/g,'\n> ')}\n\n`);
    md=md.replace(/<table-of-contents\s*\/>/gi,'');
    // path mentions to relative playground
    md=md.replace(/`\/workspace\/cs329a\/practice\/examples\/([^`]+)`/g,'[`$1`](../playground.html?ex=$1)');
    return md;
  }
  function renderMarkdown(md, el){
    if(!window.marked){el.textContent=md;return;}
    marked.setOptions({gfm:true,breaks:false});
    const html=marked.parse(transformNotionish(md));
    el.innerHTML=html;
    // mermaid
    el.querySelectorAll('code.language-mermaid, pre > code.language-mermaid').forEach((code,i)=>{
      const pre=code.closest('pre')||code;
      const div=document.createElement('div');
      div.className='mermaid';
      div.textContent=code.textContent;
      pre.replaceWith(div);
    });
    if(window.mermaid){try{mermaid.run({querySelector:'.mermaid'});}catch(e){console.warn(e);}}
    if(window.renderMathInElement){
      renderMathInElement(el,{delimiters:[
        {left:'$$',right:'$$',display:true},
        {left:'$',right:'$',display:false},
        {left:'\\(',right:'\\)',display:false},
        {left:'\\[',right:'\\]',display:true}
      ],throwOnError:false});
    }
    // build toc
    const toc=document.getElementById('pageToc');
    if(toc){
      toc.innerHTML='<strong>本页目录</strong>';
      el.querySelectorAll('h2').forEach((h,idx)=>{
        const raw=(h.textContent||'').trim();
        if(/学习路径|视频|本页测验|小结/.test(raw) && !/（[一二三四五六七八九十]）/.test(raw)) return;
        if(!h.id) h.id='sec-'+idx;
        let label=raw.replace(/\s*·\s*幻灯\s*[\d–—-]+\s*$/,'').trim();
        label=label.replace(/^（([一二三四五六七八九十]+)）\s*/,'$1 · ');
        if(label.length>18) label=label.slice(0,18)+'…';
        const a=document.createElement('a');
        a.href='#'+h.id; a.textContent=label; a.title=raw;
        toc.appendChild(a);
      });
    }
  }
  window.renderMarkdown=renderMarkdown;
})();
