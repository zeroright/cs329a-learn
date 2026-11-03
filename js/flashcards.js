(function(){
  function mountFlashcards(root, lectureId, cards){
    if(!root||!cards||!cards.length){root.innerHTML='<p class="muted">暂无闪卡</p>';return;}
    let i=0; const known= (window.CS329A && (CS329A.loadProgress().flash||{})) || {};
    root.innerHTML=`<div class="toolbar"><span id="flashMeta"></span>
      <button class="btn secondary" id="flashPrev">上一张</button>
      <button class="btn" id="flashFlip">翻转</button>
      <button class="btn secondary" id="flashNext">下一张</button>
      <button class="btn ok" id="flashKnow">认识</button>
      <button class="btn warn" id="flashUnknown">不熟</button></div>
      <div class="flash" id="flashCard"><div class="flash-inner"><div class="flash-face flash-front"></div><div class="flash-face flash-back"></div></div></div>
      <p class="muted">间隔重复（轻量）：不熟卡片会优先再次出现。进度存 localStorage。</p>`;
    const cardEl=document.getElementById('flashCard');
    const front=cardEl.querySelector('.flash-front');
    const back=cardEl.querySelector('.flash-back');
    function order(){
      return cards.map((c,idx)=>({c,idx,k:known[lectureId+':'+idx]})).sort((a,b)=>((a.k===true)-(b.k===true))||((a.k===false?0:1)-(b.k===false?0:1)));
    }
    let queue=order();
    function show(){
      if(!queue.length) queue=order();
      i=((i%queue.length)+queue.length)%queue.length;
      const item=queue[i];
      cardEl.classList.remove('flipped');
      front.innerHTML=`<div><div class="badge">${item.c.tag||'概念'}</div><h3 style="margin:10px 0 0">${item.c.front}</h3></div>`;
      back.innerHTML=`<div>${item.c.back}</div>`;
      document.getElementById('flashMeta').textContent=`${i+1}/${queue.length} · 认识 ${Object.values(known).filter(v=>v===true).length}`;
    }
    document.getElementById('flashFlip').onclick=()=>cardEl.classList.toggle('flipped');
    cardEl.onclick=()=>cardEl.classList.toggle('flipped');
    document.getElementById('flashNext').onclick=()=>{i++;show();};
    document.getElementById('flashPrev').onclick=()=>{i--;show();};
    function mark(v){
      const item=queue[i]; const key=lectureId+':'+item.idx; known[key]=v;
      if(window.CS329A){const p=CS329A.loadProgress();p.flash=p.flash||{};p.flash[key]=v;CS329A.saveProgress(p);}
      if(v===true){queue.splice(i,1); if(i>=queue.length)i=0;} else {i++;}
      show();
    }
    document.getElementById('flashKnow').onclick=()=>mark(true);
    document.getElementById('flashUnknown').onclick=()=>mark(false);
    show();
  }
  window.mountFlashcards=mountFlashcards;
})();
