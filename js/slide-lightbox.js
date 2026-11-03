(function(){
  function ensureBox(){
    let box=document.getElementById('slideLightbox');
    if(box) return box;
    box=document.createElement('div');
    box.id='slideLightbox';
    box.className='slide-lightbox';
    box.innerHTML='<button type="button" class="lb-close" aria-label="关闭">×</button><img alt="幻灯放大"/>';
    document.body.appendChild(box);
    const img=box.querySelector('img');
    const close=()=>{box.classList.remove('open');img.removeAttribute('src');};
    box.querySelector('.lb-close').onclick=close;
    box.addEventListener('click',e=>{if(e.target===box) close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape') close();});
    return box;
  }
  function bind(){
    document.querySelectorAll('.slide-thumb-btn').forEach(btn=>{
      if(btn.dataset.lbBound) return;
      btn.dataset.lbBound='1';
      btn.addEventListener('click',()=>{
        const box=ensureBox();
        const img=box.querySelector('img');
        img.src=btn.getAttribute('data-full')||btn.querySelector('img')?.src;
        box.classList.add('open');
      });
    });
  }
  window.CS329A_bindSlideLightbox=bind;
  document.addEventListener('DOMContentLoaded',bind);
})();
