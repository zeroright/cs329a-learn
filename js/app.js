(function(){
  const THEME_KEY='cs329a_theme';
  function applyTheme(t){document.documentElement.setAttribute('data-theme',t||'light');}
  function initTheme(){
    applyTheme(localStorage.getItem(THEME_KEY)||'light');
    const btn=document.getElementById('themeToggle');
    if(btn) btn.onclick=()=>{const n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';localStorage.setItem(THEME_KEY,n);applyTheme(n);};
  }
  function initSidebar(){
    const btn=document.getElementById('sidebarToggle');
    const sb=document.getElementById('sidebar');
    if(btn&&sb) btn.onclick=()=>sb.classList.toggle('open');
  }
  function initSearchJump(){
    const form=document.getElementById('searchForm');
    const input=document.getElementById('globalSearch');
    if(form&&input){
      form.onsubmit=(e)=>{e.preventDefault();const q=input.value.trim(); if(!q) return; location.href=CS329A.siteRoot()+'search.html?q='+encodeURIComponent(q);};
    }
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
  document.addEventListener('DOMContentLoaded',()=>{initTheme();initSidebar();initSearchJump();});
})();
