/* Shared navigation and layout. Each destination has one place in its own navigation level. */
(function(){
  'use strict';
  const primary=[['index.html','学习总览'],['learning-path.html','学习路径'],['index.html#videos','课程目录'],['homework.html','实践中心'],['progress.html','学习进度']];
  const practice=[['homework.html','官方作业'],['assignments.html','综合项目'],['learning-lab.html','机制实验'],['playground.html','代码运行'],['code-compare.html','源码对照']];
  const resources=[['papers.html','论文库'],['glossary.html','术语表'],['search.html','全文搜索']];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.CS329A_SHELL={primary,practice,resources};
  function init(){
    const root=CS329A.siteRoot(),file=location.pathname.split('/').pop()||'index.html',lecture=/^L\d{2}\.html$/.test(file);
    const inPractice=practice.some(([p])=>p===file),inResources=resources.some(([p])=>p===file);
    const top=document.querySelector('.topbar');
    function link([p,label],active){return `<a href="${root+p}"${active?' class="active" aria-current="page"':''}>${label}</a>`;}
    if(top){
      top.innerHTML=`${lecture?'<button class="iconbtn mobile-toggle" id="sidebarToggle" type="button" aria-controls="sidebar" aria-expanded="false" aria-label="打开讲次目录">☰</button>':''}<a class="brand" href="${root}index.html">CS329A <span>自学站</span></a><nav class="nav" aria-label="全站导航">${primary.map((entry,i)=>link(entry,i===0?file==='index.html'&&!location.hash:i===2?lecture||(file==='index.html'&&!!location.hash):i===3?inPractice:entry[0]===file)).join('')}</nav><details class="resource-menu"${inResources?' data-active="true"':''}><summary>资源</summary><nav aria-label="参考资源">${resources.map(entry=>link(entry,entry[0]===file)).join('')}</nav></details><button class="iconbtn" id="themeToggle" type="button" aria-label="切换明暗主题" title="切换明暗主题">◐</button>`;
    }
    const layout=document.querySelector('.layout'),main=document.querySelector('main');
    if(main&&!main.id)main.id='mainContent';
    if(lecture&&layout&&window.SITE_META){
      const sb=document.createElement('aside');sb.id='sidebar';sb.className='sidebar';sb.setAttribute('aria-label','课表讲次');
      sb.innerHTML='<h3>课表讲次 · L01–L20</h3>'+SITE_META.order.map(id=>`<a class="side-link${file===id+'.html'?' active':''}" href="${root}lectures/${id}.html"${file===id+'.html'?' aria-current="page"':''}><span class="lecture-code">${id}</span><span>${esc(SITE_META.lectures[id].title)}</span></a>`).join('');
      layout.prepend(sb);
    }else if(layout){layout.classList.add('single-column');}
    if(inPractice&&main){
      const nav=document.createElement('nav');nav.className='practice-nav';nav.setAttribute('aria-label','实践中心');nav.innerHTML=practice.map(entry=>link(entry,entry[0]===file)).join('');main.prepend(nav);
    }
    const footer=document.createElement('footer');footer.className='footer site-footer';footer.innerHTML=`<span>Stanford CS329A · Autumn 2025 · 本站自编路线与练习单独标注</span><a href="${root}README.md">内容来源与版权</a>`;document.body.appendChild(footer);
    const menu=document.querySelector('.resource-menu');
    document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target))menu.open=false;});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary').focus();}});
  }
  // app.js reads this entry point before binding theme/sidebar controls.
  window.CS329A_initShell=init;
})();
