(function(){
  const THEME_KEY='cs329a_theme';
  try{
    var saved=localStorage.getItem(THEME_KEY);
    if(saved) document.documentElement.setAttribute('data-theme', saved);
  }catch(e){}
  function applyTheme(t){document.documentElement.setAttribute('data-theme',t||'light');}
  function initTheme(){
    applyTheme(localStorage.getItem(THEME_KEY)||document.documentElement.getAttribute('data-theme')||'light');
    const btn=document.getElementById('themeToggle');
    if(btn) btn.onclick=()=>{
      const n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
      localStorage.setItem(THEME_KEY,n);applyTheme(n);
      if(window.CS329A_mermaidInit){CS329A_mermaidInit();try{mermaid.run({querySelector:'.mermaid'});}catch(e){}}
      if(window.CS329A_redrawGraph){try{CS329A_redrawGraph();}catch(e){}}
    };
  }
  function initSidebar(){
    const btn=document.getElementById('sidebarToggle');
    const sb=document.getElementById('sidebar');
    if(btn&&sb) btn.onclick=(e)=>{e.stopPropagation();sb.classList.toggle('open');};
    document.addEventListener('click',(e)=>{
      if(!sb||!sb.classList.contains('open')) return;
      if(sb.contains(e.target)||e.target===btn) return;
      sb.classList.remove('open');
    });
    const active=sb&&sb.querySelector('.side-link.active');
    if(active&&sb){
      const top=active.offsetTop-sb.clientHeight/2;
      sb.scrollTop=Math.max(0, top);
    }
  }
  function initSearchJump(){
    const form=document.getElementById('searchForm');
    const input=document.getElementById('globalSearch');
    if(form&&input){
      form.onsubmit=(e)=>{e.preventDefault();const q=input.value.trim(); if(!q) return; location.href=CS329A.siteRoot()+'search.html?q='+encodeURIComponent(q);};
    }
  }
  function lectureIdFromPath(){
    const m=(location.pathname||'').match(/\/(L\d{2})\.html$/i);
    return m?m[1].toUpperCase():'';
  }
  function rebuildLectureToc(){
    const toc=document.getElementById('pageToc');
    const host=document.getElementById('lectureBody');
    if(!toc||!host) return;
    const sections=[...host.querySelectorAll('details.section')];
    if(!sections.length) return;
    toc.innerHTML='<strong>本页目录</strong>';
    sections.forEach((d,idx)=>{
      const sum=d.querySelector('summary');
      if(!sum) return;
      if(!d.id) d.id='sec-'+idx;
      const raw=(sum.textContent||'').replace(/\s+/g,' ').trim();
      let label=raw.replace(/\s*·\s*幻灯\s*[\d–—-]+\s*$/,'').trim();
      if(label.length>28) label=label.slice(0,28)+'…';
      const a=document.createElement('a');
      a.href='#'+d.id; a.textContent=label; a.title=raw;
      toc.appendChild(a);
    });
  }
  function pagerHtml(id){
    const meta=window.SITE_META;
    if(!meta||!meta.order) return '';
    const order=meta.order;
    const i=order.indexOf(id);
    if(i<0) return '';
    const prev=i>0?order[i-1]:null;
    const next=i<order.length-1?order[i+1]:null;
    const label=(k)=>{const t=(meta.lectures[k]&&meta.lectures[k].title)||''; return t.length>18?t.slice(0,18)+'…':t;};
    return `<a class="pager-link" href="${prev?prev+'.html':'#'}" ${prev?'':'aria-disabled="true"'}>${prev?('← '+prev+' '+label(prev)):'到头了'}</a>`
      + `<a class="pager-link" href="${next?next+'.html':'#'}" ${next?'':'aria-disabled="true"'}>${next?(next+' '+label(next)+' →'):'到尾了'}</a>`;
  }
  function enhanceLecture(){
    const id=lectureIdFromPath();
    const host=document.getElementById('lectureBody');
    const main=document.querySelector('main.main');
    if(!id||!host||!main||!window.SITE_META) return;
    const info=SITE_META.lectures[id]||{};
    if(!main.querySelector('.crumbs')){
      const nav=document.createElement('nav');
      nav.className='crumbs';
      nav.setAttribute('aria-label','面包屑');
      nav.innerHTML='<a href="../index.html">首页</a><span class="sep">/</span><a href="../learning-path.html">学习路径</a><span class="sep">/</span><span>'+id+'</span>';
      main.insertBefore(nav, main.firstChild);
    }
    const hero=main.querySelector('.hero');
    if(hero && !hero.querySelector('.lecture-links')){
      const box=document.createElement('p');
      box.className='lecture-links';
      const bits=[];
      if(info.notion) bits.push('<a href="'+info.notion+'" target="_blank" rel="noopener">Notion 教案</a>');
      if(info.youtube) bits.push('<a href="'+info.youtube+'" target="_blank" rel="noopener">YouTube'+(info.video_part?(' Part '+info.video_part):'')+'</a>');
      if(info.bilibili) bits.push('<a href="'+info.bilibili+'" target="_blank" rel="noopener">Bilibili</a>');
      bits.push('<a href="../papers.html?lecture='+id+'">本讲论文</a>');
      bits.push('<a href="../homework.html">作业仓库</a>');
      bits.push('<a href="../assignments.html">Capstone</a>');
      box.innerHTML=bits.join(' · ');
      hero.appendChild(box);
    }
    if(!document.getElementById('lecturePager')){
      const p=document.createElement('nav');
      p.className='pager'; p.id='lecturePager'; p.setAttribute('aria-label','上一讲下一讲');
      p.innerHTML=pagerHtml(id);
      if(hero) hero.insertAdjacentElement('afterend', p);
      else main.appendChild(p);
    }
    if(!document.getElementById('lecturePagerEnd')){
      const p2=document.createElement('nav');
      p2.className='pager'; p2.id='lecturePagerEnd'; p2.setAttribute('aria-label','上一讲下一讲');
      p2.innerHTML=pagerHtml(id);
      main.appendChild(p2);
    }
    main.classList.add('with-rail');
    rebuildLectureToc();
  }
  function watchLecture(){
    const host=document.getElementById('lectureBody');
    if(!host) return;
    const kick=()=>{ if(host.childNodes.length) enhanceLecture(); };
    const obs=new MutationObserver(kick);
    obs.observe(host,{childList:true,subtree:true});
    kick();
    setTimeout(kick, 60);
    setTimeout(kick, 500);
  }
  function enhanceStatic(){
    if(document.getElementById('lectureBody')) return;
    const main=document.querySelector('main');
    if(!main||main.querySelector('.crumbs')) return;
    const path=location.pathname||'';
    if(/\/(index\.html)?$/.test(path)) return;
    const root=path.includes('/lectures/')?'../':'';
    const name=(document.title||'').split('·')[0].trim()||'本页';
    const nav=document.createElement('nav');
    nav.className='crumbs';
    nav.setAttribute('aria-label','面包屑');
    nav.innerHTML='<a href="'+root+'index.html">首页</a><span class="sep">/</span><span>'+name+'</span>';
    main.insertBefore(nav, main.firstChild);
  }
  window.CS329A={
    siteRoot(){const s=document.querySelector('script[src*="js/app.js"]');if(!s)return'';const src=s.getAttribute('src')||'';const i=src.lastIndexOf('js/app.js');return i>=0?src.slice(0,i):'';},
    progressKey:'cs329a_progress_v1',
    loadProgress(){try{return JSON.parse(localStorage.getItem(this.progressKey)||'{}');}catch(e){return {};}},
    saveProgress(p){localStorage.setItem(this.progressKey,JSON.stringify(p));},
    markLectureDone(id){const p=this.loadProgress();p.lectures=p.lectures||{};p.lectures[id]=p.lectures[id]||{};p.lectures[id].done=true;p.lectures[id].doneAt=Date.now();this.saveProgress(p);},
    saveQuiz(id,score,total){const p=this.loadProgress();p.quizzes=p.quizzes||{};p.quizzes[id]={score,total,at:Date.now()};this.saveProgress(p);},
    saveFlash(id,known){const p=this.loadProgress();p.flash=p.flash||{};p.flash[id]=known;this.saveProgress(p);},
    checklistKey:'cs329a_checklist_v1',
    loadChecklist(){try{return JSON.parse(localStorage.getItem(this.checklistKey)||'{}');}catch(e){return {};}},
    saveChecklist(c){localStorage.setItem(this.checklistKey,JSON.stringify(c));},
  };
  document.addEventListener('DOMContentLoaded',()=>{initTheme();initSidebar();initSearchJump();watchLecture();enhanceStatic();});
})();
