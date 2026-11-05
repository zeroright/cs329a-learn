(function(){
  'use strict';
  function bindChecks(host){const saved=CS329A.loadChecklist();host.querySelectorAll('input[data-k]').forEach(cb=>{cb.checked=!!saved[cb.dataset.k];cb.onchange=()=>{const next=CS329A.loadChecklist();next[cb.dataset.k]=cb.checked;CS329A.saveChecklist(next);};});}
  document.addEventListener('DOMContentLoaded',()=>{
    const table=document.getElementById('officialTasks');
    if(table){table.innerHTML='<thead><tr><th scope="col">官方任务</th><th scope="col">权重</th><th scope="col">要求 / 原课程时间</th><th scope="col">自评</th></tr></thead><tbody>'+SITE_META.official.map(h=>`<tr><td>${/^hw/.test(h.id)?`<a href="#${h.id}">${h.title} →</a>`:h.title}</td><td>${h.weight}</td><td>${h.topics}</td><td><input type="checkbox" data-k="off:${h.id}" aria-label="${h.title} 已完成"></td></tr>`).join('')+'</tbody>';bindChecks(table);}
    const host=document.getElementById('capRoot');
    if(host){host.innerHTML=SITE_META.capstones.map((c,i)=>`<details class="section capstone-project" id="${c.id}" name="capstone"${i===0?' open':''}><summary>${c.id} · ${c.title}</summary><div class="body"><p><b>目标</b>：${c.goal}</p><p><b>相关讲次</b>：${c.lectures.map(id=>`<a href="lectures/${id}.html">${id}</a>`).join(' · ')}</p><p><b>基准</b>：${(c.benchmarks||[]).join('、')}</p><h3>里程碑与交付物</h3><ol class="milestone-list">${c.milestones.map((m,i)=>`<li><label><input type="checkbox" data-k="cap:${c.id}:m${i}"> ${m}</label></li>`).join('')}</ol><p><b>算力</b>：${c.compute}</p><p><b>评分</b>：${c.rubric}</p><p><b>B2B 延伸</b>：${c.b2b}</p></div></details>`).join('');bindChecks(host);}
  });
})();
