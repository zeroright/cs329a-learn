(function(){
  function mountQuiz(root, lectureId, data){
    if(!root||!data) return;
    root.innerHTML='';
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="toolbar"><button class="btn" id="quizSubmit">提交自测</button><button class="btn secondary" id="quizReveal">显示全部答案</button><span class="muted" id="quizScore"></span></div>`;
    root.appendChild(wrap);
    const state={revealed:false};
    (data.mc||[]).forEach((item,i)=>{
      const div=document.createElement('div');
      div.className='quiz-q'; div.dataset.idx=i;
      div.innerHTML=`<div><span class="badge self">自编</span> <strong>Q${i+1}.</strong> ${item.q}</div><div class="choices"></div><div class="explain muted" style="display:none;margin-top:8px"></div>`;
      const ch=div.querySelector('.choices');
      item.choices.forEach((c,ci)=>{
        const id=`q${i}_${ci}`;
        const lab=document.createElement('label');
        lab.innerHTML=`<input type="radio" name="q${i}" value="${ci}"> ${c}`;
        ch.appendChild(lab);
      });
      div.querySelector('.explain').textContent='解析：'+item.explain;
      root.appendChild(div);
    });
    (data.sa||[]).forEach((item,i)=>{
      const div=document.createElement('div');
      div.className='quiz-q sa';
      div.innerHTML=`<div><span class="badge self">自编·简答</span> <strong>S${i+1}.</strong> ${item.q}</div>
        <textarea rows="3" style="width:100%;margin-top:8px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--text);padding:8px" placeholder="先作答，再点显示答案"></textarea>
        <div class="toolbar"><button class="btn secondary sa-hint">提示</button><button class="btn secondary sa-ans">显示参考答案</button></div>
        <div class="hint muted" style="display:none">提示：${item.hint||''}</div>
        <div class="answer muted" style="display:none;margin-top:6px"><strong>参考答案：</strong>${item.answer}</div>`;
      div.querySelector('.sa-hint').onclick=()=>div.querySelector('.hint').style.display='block';
      div.querySelector('.sa-ans').onclick=()=>div.querySelector('.answer').style.display='block';
      root.appendChild(div);
    });
    function grade(showAll){
      let score=0; const total=(data.mc||[]).length;
      root.querySelectorAll('.quiz-q:not(.sa)').forEach((div,i)=>{
        const item=data.mc[i];
        const sel=div.querySelector('input:checked');
        const explain=div.querySelector('.explain');
        div.classList.remove('correct','wrong');
        if(sel){
          const v=+sel.value;
          if(v===item.answer){score++; div.classList.add('correct');}
          else div.classList.add('wrong');
        }else if(showAll) div.classList.add('wrong');
        if(showAll||sel) explain.style.display='block';
      });
      document.getElementById('quizScore').textContent=`得分 ${score}/${total}`;
      if(window.CS329A) CS329A.saveQuiz(lectureId,score,total);
    }
    document.getElementById('quizSubmit').onclick=()=>grade(false);
    document.getElementById('quizReveal').onclick=()=>grade(true);
  }
  window.mountQuiz=mountQuiz;
})();
