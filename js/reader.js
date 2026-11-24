(function () {
  'use strict';
  const data = window.COURSE_READER;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  if (!data) return;
  let currentTab = 'lecture';
  let gallery = [];
  let imageIndex = 0;
  let zoom = 1;
  let opener;
  function sourceLink(url, label) { return url ? `<a href="${escape(url)}" target="_blank" rel="noopener">${label} ↗</a>` : ''; }
  function dialog() {
    let box = document.getElementById('figureViewer');
    if (box) return box;
    box = document.createElement('dialog');
    box.id = 'figureViewer'; box.className = 'reader-dialog'; box.setAttribute('aria-label','图表阅读器');
    box.innerHTML = '<header><button data-action="prev" aria-label="上一张图">←</button><span id="figureCaption"></span><button data-action="next" aria-label="下一张图">→</button><button data-action="out" aria-label="缩小">−</button><button data-action="in" aria-label="放大">＋</button><button data-action="fit">适应窗口</button><a id="figureOriginal" target="_blank" rel="noopener">打开原图</a><button data-action="close" aria-label="关闭图表">关闭 ×</button></header><div class="image-viewport"><img alt=""></div><footer>← → 切换图表 · ＋ − 调整大小 · Esc 关闭。放大后可滚动查看完整图表。</footer>';
    document.body.appendChild(box);
    box.addEventListener('click', event => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action==='close') box.close();
      if (action==='next') show(imageIndex+1);
      if (action==='prev') show(imageIndex-1);
      if (action==='in') resize(Math.min(4,zoom+.5));
      if (action==='out') resize(Math.max(1,zoom-.5));
      if (action==='fit') resize(1);
      if (event.target===box) box.close();
    });
    box.addEventListener('keydown',event=>{
      if (event.key==='ArrowRight') {event.preventDefault();show(imageIndex+1);}
      if (event.key==='ArrowLeft') {event.preventDefault();show(imageIndex-1);}
      if (event.key==='+') resize(Math.min(4,zoom+.5));
      if (event.key==='-') resize(Math.max(1,zoom-.5));
    });
    box.addEventListener('close',()=>opener?.focus());
    return box;
  }
  function resize(value) {
    zoom=value;
    const image=dialog().querySelector('img');
    image.style.maxWidth=zoom===1?'100%':'none';
    image.style.maxHeight=zoom===1?'100%':'none';
    image.style.width=zoom===1?'auto':`${image.naturalWidth*zoom}px`;
  }
  function show(index) {
    if (!gallery.length) return;
    imageIndex=(index+gallery.length)%gallery.length;
    const target=gallery[imageIndex],box=dialog(),image=box.querySelector('img');
    image.src=target.dataset.full||target.src; image.alt=target.alt||'课程图表'; resize(1);
    box.querySelector('#figureCaption').textContent=`${imageIndex+1} / ${gallery.length} · ${image.alt}`;
    box.querySelector('#figureOriginal').href=image.src;
    box.querySelector('.image-viewport').scrollTo(0,0);
    if (!box.open) box.showModal();
  }
  function figures(host) {
    gallery=[...host.querySelectorAll('img')];
    gallery.forEach((image,index)=>{
      image.loading='lazy'; image.decoding='async';
      let button=image.closest('button');
      if (!button && !image.closest('a')) {
        const figure=document.createElement('figure');
        image.before(figure);figure.appendChild(image);
        button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='放大查看原图';figure.appendChild(button);
        if(image.alt){const caption=document.createElement('figcaption');caption.textContent=image.alt;figure.appendChild(caption);}
      }
      const trigger=button||image.closest('a');
      if(trigger) trigger.onclick=event=>{event.preventDefault();opener=trigger;show(index);};
      image.addEventListener('error',()=>{
        const note=document.createElement('p');note.className='source-note';
        note.textContent='此图片暂时无法载入，请使用本讲来源链接查看原文。';
        if(!image.dataset.failed){image.after(note);image.dataset.failed='true';}
      },{once:true});
    });
  }
  function render(tab) {
    currentTab=tab;
    document.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tab===tab)));
    const host=document.getElementById('readerBody');
    renderMarkdown(data[tab]||'',host);
    const children=[...host.children];let section;
    host.replaceChildren();
    children.forEach(child=>{
      if(!section||/^H[123]$/.test(child.tagName)) {section=document.createElement('section');section.id=`reading-${host.children.length}`;host.appendChild(section);}
      section.appendChild(child);
    });
    host.querySelectorAll('a').forEach(link=>{if(link.hostname!==location.hostname){link.target='_blank';link.rel='noopener';}});
    const select=document.getElementById('sectionJump');select.replaceChildren();
    [...host.children].forEach((section,index)=>{
      const title=section.querySelector('h1,h2,h3')?.textContent||'来源说明';
      const option=document.createElement('option');option.value=section.id;option.textContent=`${index+1}. ${title}`;select.appendChild(option);
    });
    figures(host);
    document.getElementById('readerSearch').value='';
    document.getElementById('readerCount').textContent=`${host.children.length} 个阅读段落 · ${gallery.length} 张图片`;
    const url=new URL(location.href);url.searchParams.set('view',tab);history.replaceState(null,'',url);
    if (location.hash) setTimeout(()=>document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(),80);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('readerSources').innerHTML=sourceLink(data.lectureNotion,'Notion 讲义')+sourceLink(data.papersNotion,'Notion 论文')+sourceLink(data.youtube,'课堂视频')+'<span>整理更新：2026-11-24</span>';
    document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>render(button.dataset.tab));
    document.getElementById('sectionJump').onchange=event=>document.getElementById(event.target.value)?.scrollIntoView({behavior:'smooth'});
    document.getElementById('readerSearch').oninput=event=>{
      const query=event.target.value.trim().toLowerCase();let count=0;
      document.querySelectorAll('#readerBody>section').forEach(section=>{section.hidden=!!query&&!section.textContent.toLowerCase().includes(query);if(!section.hidden)count++;});
      document.getElementById('readerCount').textContent=`显示 ${count} 个段落`;
    };
    document.getElementById('openLab').onclick=()=>{
      const lab=document.getElementById('conceptLab');lab.hidden=!lab.hidden;
      if(!lab.hidden){if(!lab.dataset.ready){ConceptLab.mount(lab,data);lab.dataset.ready='true';}lab.scrollIntoView({behavior:'smooth'});}
      document.getElementById('openLab').setAttribute('aria-expanded',String(!lab.hidden));
    };
    const course=document.body.dataset.course;
    const namespace=course==='cmu'?'CMU11768':course.toUpperCase();
    const progress=window[namespace];
    const updateDone=()=>{const done=progress?.loadProgress()?.lectures?.[data.id]?.done;document.getElementById('readerDoneStatus').textContent=done?'已记录阅读完成；掌握程度请通过练习验证。':'';};
    document.getElementById('readerDone').onclick=()=>{progress?.markLectureDone(data.id);updateDone();};updateDone();
    const order=SITE_META.order,index=order.indexOf(data.id),pager=document.getElementById('readerPager');
    [order[index-1],order[index+1]].forEach((id,side)=>{if(id){const link=document.createElement('a');link.href=id+'.html';link.textContent=(side?'下一讲 → ':'← 上一讲 ')+id;pager.appendChild(link);}});
    render(new URL(location.href).searchParams.get('view')==='papers'?'papers':'lecture');
  });
})();
