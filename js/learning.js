(function () {
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_){/* Reading remains available without storage. */}};
  const root=()=>CS329A.siteRoot();
  const done=id=>!!CS329A.loadProgress().lectures?.[id]?.done;
  let track='full';
  const href=id=>root()+'lectures/'+id+'.html?track='+track;
  const lessonLink=id=>`<a href="${href(id)}">${id} · ${esc(SITE_META.lectures[id].title)}</a>`;
  function trackButtons(){return `<div class="route-switch" role="group" aria-label="选择学习路线">${Object.entries(LEARNING.tracks).map(([key,t])=>`<button type="button" data-track="${key}" aria-pressed="${track===key}">${t.title}<small>${t.duration}</small></button>`).join('')}</div>`;}
  function chooseTrack(key){
    track=Object.hasOwn(LEARNING.tracks,key)?key:'full';write('cs329a_learning_track',track);
    const url=new URL(location.href);url.searchParams.set('track',track);history.replaceState(null,'',url);
    renderHome();renderPath();renderProgress();
  }
  function nextLesson(){return LEARNING.tracks[track].ids.find(id=>!done(id));}
  function continuation(){
    const t=LEARNING.tracks[track],id=nextLesson(),n=t.ids.filter(done).length;
    return `<div class="continue-study"><div><span class="eyebrow">YOUR NEXT STEP / 下一步</span><h2>${id?LEARNING.lessons[id][0]:'本路线已阅读完成'}</h2><p>${id?`${id} · ${esc(SITE_META.lectures[id].title)}`:'回到项目，用实验验证你的理解。'}</p><p class="muted">已标记阅读 ${n} / ${t.ids.length} 讲 · 自测与项目完成情况需分别检查</p><progress value="${n}" max="${t.ids.length}" aria-label="本路线阅读进度"></progress></div><a class="btn" href="${id?href(id):root()+'assignments.html'}">${id?'继续学习 →':'前往综合项目 →'}</a></div>`;
  }
  function renderHome(){
    const host=document.getElementById('learningHome');if(!host)return;
    const t=LEARNING.tracks[track];
    host.innerHTML=`${trackButtons()}<p class="route-intro">${t.intro}</p>${continuation()}<div class="section-heading"><div><span class="eyebrow">LEARN → EXPERIMENT → VERIFY</span><h2>每一步，都有一个可交付的结果</h2></div><a href="learning-path.html?track=${track}">展开完整路线 →</a></div><ol class="home-steps">${t.phases.map((p,i)=>`<li><span class="step-no">${String(i+1).padStart(2,'0')}</span><div><h3>${p.title}</h3><p>${p.output}</p><a href="learning-path.html?track=${track}#phase-${i}">${p.ids.join(' / ')} →</a></div></li>`).join('')}</ol><div class="source-strip"><b>先确认资料，再开始学习</b><p>9 讲视频教案 · 8 讲论文补读 · 3 次期中展示。路线、目标和实验均为本站自编学习设计。</p><a href="#course-reference">查看课表、录像与来源 ↓</a></div>`;
    bindTracks(host);
  }
  function bindTracks(host){host.querySelectorAll('[data-track]').forEach(b=>b.onclick=()=>chooseTrack(b.dataset.track));}
  function renderProgress(){
    const host=document.getElementById("learningProgress");if(!host)return;
    const t=LEARNING.tracks[track],c=CS329A.loadChecklist(),n=t.phases.filter((_,i)=>c[`route:${track}:${i}`]).length;
    host.innerHTML=`<h2>当前路线 · ${t.title}</h2>${continuation()}<p class="muted">阶段交付物自评：${n} / ${t.phases.length}。<a href="learning-path.html?track=${track}">回到路线检查交付物 →</a></p>`;
  }
  function renderPath(){
    const host=document.getElementById('learningPath');if(!host)return;
    const t=LEARNING.tracks[track],checks=CS329A.loadChecklist();
    host.innerHTML=`${trackButtons()}<p class="route-intro">${t.intro}</p><p class="muted">建议产出：${t.outcome}。节奏为本站建议，按自己的基础调整；完成标记只记录阅读，不代表掌握。</p>${continuation()}<nav class="phase-nav" aria-label="阶段导航">${t.phases.map((p,i)=>`<a href="#phase-${i}">${String(i+1).padStart(2,'0')} ${p.title}</a>`).join('')}</nav><div class="route-timeline">${t.phases.map((p,i)=>`<section class="route-phase" id="phase-${i}"><div class="phase-number">${String(i+1).padStart(2,'0')}</div><div class="phase-content"><header><span class="eyebrow">STAGE ${i+1} / ${t.phases.length}</span><h2>${p.title}</h2></header><ul class="lesson-list">${p.ids.map(id=>{const m=SITE_META.lectures[id],l=LEARNING.lessons[id];return `<li><div><span class="source-label">${LEARNING.source(id)}</span><h3>${lessonLink(id)}</h3><p>${l[1]}</p><small class="muted">先修：${l[2].length?l[2].map(x=>`<a href="${href(x)}">${x}</a>`).join(' · '):'Python / 概率基础 / LLM 使用经验'}</small></div><span class="read-state">${done(id)?'已阅读':'待学习'}</span></li>`;}).join('')}</ul><div class="phase-delivery"><b>阶段验收 · 自编</b><p>${p.output}</p><a href="${p.work}">${p.label} →</a><label class="check-row"><input type="checkbox" data-milestone="route:${track}:${i}" ${checks[`route:${track}:${i}`]?'checked':''}> 我已保留本阶段交付物与结果记录</label></div></div></section>`).join('')}</div><details class="section"><summary>可选：L10–L12 期中展示练习</summary><div class="body"><p>这三次为项目展示，不计入 17 个知识讲次。可按自身项目需要阅读本站自编模板。</p>${LEARNING.midterms.map(lessonLink).join('<br>')}</div></details><div class="source-strip"><b>本路线如何使用 Notion 教案</b><p>视频讲次：目标 → 章节讲解与时间戳 → 机制实验 → 自测。补读讲次：问题 → 主论文 → 方法与局限 → 对照实验。官方作业与自编示例分别标注。</p><a href="https://app.notion.com/p/40a9384c52318196b7eeffcbe5cd9d6c" target="_blank" rel="noopener">查看 Notion 总教案 →</a></div>`;
    bindTracks(host);
    host.querySelectorAll('[data-milestone]').forEach(cb=>cb.onchange=()=>{const c=CS329A.loadChecklist();c[cb.dataset.milestone]=cb.checked;CS329A.saveChecklist(c);});
  }
  function jumpTo(el){
    const parents=[];let p=el.parentElement;while(p){if(p.tagName==='DETAILS')parents.push(p);p=p.parentElement;}
    parents.forEach(p=>p.open=true);if(el.tagName==='DETAILS')el.open=true;el.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function enhanceLesson(){
    const id=location.pathname.match(/\/(L\d{2})\.html$/)?.[1],host=document.getElementById('lectureBody');
    if(!id||!host||!LEARNING.lessons[id])return;
    const l=LEARNING.lessons[id],m=SITE_META.lectures[id],main=document.querySelector('main.main');
    const box=document.createElement('section');box.className='study-guide';box.id='study-guide';
    box.innerHTML=`<span class="eyebrow">本讲学习指南 · 本站自编</span><h2>${l[0]}</h2><p>${l[1]}</p><div class="guide-meta"><span>${LEARNING.source(id)}</span><span>先修：${l[2].length?l[2].map(x=>`<a href="${href(x)}">${x}</a>`).join(' · '):'Python 与概率基础'}</span></div><nav class="study-actions" aria-label="本讲学习步骤"><button type="button" data-jump="read">01 读章节</button>${l[4]?`<a href="../learning-lab.html?lab=${l[4]}&track=${track}">02 做机制实验 ↗</a>`:l[3]?`<a href="../playground.html?ex=${l[3]}">02 运行示例 ↗</a>`:`<a href="../papers.html?lecture=${id}">02 读主论文 ↗</a>`}<button type="button" data-jump="quiz">03 做自测</button><button type="button" data-jump="practice">04 找实践任务</button></nav><p class="guide-note">${m.youtube?'视频教案来自课堂转写；模型名、数值和论断请结合原视频核对。':'本页为论文 / 公开材料补读；自编讲解与练习不代表嘉宾课堂原话。'}</p>`;
    const hero=main.querySelector('.hero');hero.insertAdjacentElement('afterend',box);
    box.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{
      const target=b.dataset.jump==='quiz'?document.getElementById('quizRoot'):b.dataset.jump==='practice'?[...host.querySelectorAll('details.section')].find(d=>/作业|实战|练习|项目/.test(d.querySelector('summary')?.textContent)):host;
      if(target)jumpTo(target);else{location.href='../assignments.html';}
    });
    const toc=document.getElementById('pageToc');
    if(toc)toc.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));if(target){e.preventDefault();jumpTo(target);history.replaceState(null,'',a.hash);}});
    const sections=[...host.querySelectorAll('details.section')];
    const firstChapter=sections.find(d=>/（一）|课堂脉络|论文精读/.test(d.querySelector('summary')?.textContent));
    sections.forEach((d,i)=>{d.open=i===0||d===firstChapter;});
    host.querySelectorAll('.slide-card').forEach(card=>{
      const transcript=[...card.children].filter(n=>n.tagName==='P'&&/^讲解\s*[:：]/.test(n.textContent.trim()));
      if(!transcript.length)return;
      const details=document.createElement('details');details.className='transcript';
      const summary=document.createElement('summary');summary.textContent='展开本页口播转写';details.appendChild(summary);
      transcript[0].before(details);transcript.forEach(n=>details.appendChild(n));
    });
    host.querySelectorAll('.inline-viz').forEach(widget=>{const caption=document.createElement('p');caption.className='source-caption';caption.textContent='本站自编机制示意；不是论文实测结果。请用真实作业验证观察。';widget.appendChild(caption);});
    const tools=document.createElement('div');tools.className='reading-tools';tools.innerHTML='<span class="muted">章节阅读</span><button type="button" data-open="false">专注阅读（收起章节）</button><button type="button" data-open="true">展开全部</button>';
    host.before(tools);
    tools.querySelectorAll('button').forEach(b=>b.onclick=()=>{host.querySelectorAll('details.section').forEach((d,i)=>d.open=b.dataset.open==='true'||i===0);});
    // Keep recommendation navigation consistent with the selected learning route.
    const t=LEARNING.tracks[track],i=t.ids.indexOf(id);
    if(i>=0){document.querySelectorAll('.pager').forEach(p=>p.innerHTML=`${i?`<a class="pager-link" href="${href(t.ids[i-1])}">← ${t.ids[i-1]} · ${LEARNING.lessons[t.ids[i-1]][0]}</a>`:`<a class="pager-link" href="../learning-path.html?track=${track}">← 选择学习路线</a>`}${i<t.ids.length-1?`<a class="pager-link" href="${href(t.ids[i+1])}">接着学 ${t.ids[i+1]} · ${LEARNING.lessons[t.ids[i+1]][0]} →</a>`:'<a class="pager-link" href="../assignments.html">去完成综合项目 →</a>'}`);}
    const mark=document.getElementById('markDone');if(mark){mark.textContent=done(id)?'已标记阅读完成':'标记本讲阅读完成';mark.onclick=()=>{CS329A.markLectureDone(id);const bar=document.getElementById('doneBar');if(bar)bar.style.width='100%';mark.textContent='已标记阅读完成';};}
    const note=document.createElement('p');note.className='muted';note.textContent='阅读、自测和项目是三种独立记录；读完后请用自测与交付物检验理解。';main.appendChild(note);
    if(location.hash){let target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch(_){}if(target)jumpTo(target);}
  }
  function renderLab(){
    const host=document.getElementById('learningLab');if(!host)return;
    const labs={coverage:['采样与验证','L02 / L03 / L15'],react:['工具反馈','L04 / L08 / L13'],grpo:['组相对优势','L06']};
    const requested=new URLSearchParams(location.search).get('lab');let lab=Object.hasOwn(labs,requested)?requested:'coverage';
    function draw(){
      host.innerHTML=`<div class="route-switch" role="group" aria-label="选择机制实验">${Object.entries(labs).map(([key,v])=>`<button data-lab="${key}" aria-pressed="${key===lab}">${v[0]}<small>${v[1]}</small></button>`).join('')}</div><div id="labContent"></div>`;
      host.querySelectorAll('[data-lab]').forEach(b=>b.onclick=()=>{lab=b.dataset.lab;const u=new URL(location.href);u.searchParams.set('lab',lab);history.replaceState(null,'',u);draw();});
      const body=document.getElementById('labContent');
      if(lab==='coverage')coverageLab(body);if(lab==='react')reactLab(body);if(lab==='grpo')grpoLab(body);
    }draw();
  }
  function prediction(body,question,options,answer,explain){
    const field=document.createElement('fieldset');field.className='prediction';field.innerHTML=`<legend>先预测 · ${question}</legend>${options.map((s,i)=>`<label><input type="radio" name="predict" value="${i}"> ${s}</label>`).join('')}<button class="btn secondary" type="button">检查预测</button><p class="prediction-result" role="status"></p>`;
    field.querySelector('button').onclick=()=>{const choice=field.querySelector('input:checked');field.querySelector('[role=status]').textContent=choice?(+choice.value===answer?'预测正确。':'再想一想。')+explain:'请先选择一个预测。';};body.appendChild(field);
  }
  function coverageLab(body){
    body.innerHTML='<h2>多采样，就一定选得更准吗？</h2><p>观察理想候选覆盖率与不完美选择器的差距，再用实际作业测量它。</p>';
    prediction(body,'验证器越弱，加大 k 能否保证最终正确？',['能，采样足够多就行','不能，覆盖与正确选择是两件事'],1,'覆盖只表示候选中存在正确答案；选择器可能仍然选错。');
    const panel=document.createElement('div');panel.className='lab-panel';panel.innerHTML=`<div class="lab-controls"><label for="prob">单次成功概率 p <output id="pVal"></output><input id="prob" type="range" min="0.05" max="0.9" step="0.05" value="0.2"></label><label for="samples">采样次数 k <output id="kVal"></output><input id="samples" type="range" min="1" max="32" step="1" value="8"></label><label for="selector">存在正确候选时，选对概率 q <output id="qVal"></output><input id="selector" type="range" min="0" max="1" step="0.05" value="0.7"></label><p class="muted">调用数示例：k 翻倍，生成调用数翻倍。真实成本还包含输出长度和验证调用。</p></div><div><svg id="coveragePlot" viewBox="0 0 640 320" role="img" aria-label="候选覆盖率与最终正确概率随采样次数变化"></svg><div class="chart-legend"><span>实线：理想候选覆盖率</span><span>虚线：选出正确答案概率</span></div><p id="coverageResult" role="status" class="lab-result"></p></div></div><p class="source-caption">自编机制示意，非论文实验数据。假设各次采样独立、p 固定；q 是“存在正确候选”条件下选对的概率，与 k 无关。coverage = 1 − (1 − p)<sup>k</sup>；最终正确概率 = q × coverage。真实任务不一定满足这些假设。</p><div class="phase-delivery"><b>带着结果去做作业</b><p>在实际样本上统计覆盖率、选择准确率与 token，用曲线检查独立同分布假设是否合理。</p><a href="homework.html#hw1">官方 HW1 / 本站复现入口 →</a> · <a href="lectures/L02.html">回到 L02 →</a></div>`;
    body.appendChild(panel);
    function update(){const p=+panel.querySelector('#prob').value,k=+panel.querySelector('#samples').value,q=+panel.querySelector('#selector').value;panel.querySelector('#pVal').textContent=p.toFixed(2);panel.querySelector('#kVal').textContent=k;panel.querySelector('#qVal').textContent=q.toFixed(2);
      const path=scale=>Array.from({length:32},(_,i)=>`${i?'L':'M'}${64+i*17},${260-LEARNING.coverage(p,i+1)*scale*220}`).join(' ');
      panel.querySelector('svg').innerHTML=`<title>采样次数与正确概率（自编独立采样模型）</title>${[0,.25,.5,.75,1].map(y=>`<line x1="64" x2="591" y1="${260-y*220}" y2="${260-y*220}" class="lab-grid"/><text x="55" y="${264-y*220}" text-anchor="end">${100*y}%</text>`).join('')}<path d="M64 40 V260 H591" class="lab-axis"/><path d="${path(1)}" class="lab-line"/><path d="${path(q)}" class="lab-line dashed"/>${[1,8,16,24,32].map(x=>`<text x="${64+(x-1)*17}" y="282" text-anchor="middle">${x}</text>`).join('')}<text x="315" y="310" text-anchor="middle">采样次数 k（次）</text><text x="14" y="150" transform="rotate(-90 14 150)" text-anchor="middle">正确概率（%）</text><circle cx="${64+(k-1)*17}" cy="${260-LEARNING.coverage(p,k)*220}" r="5" class="lab-point"/>`;
      panel.querySelector('#coverageResult').textContent=`k = ${k}：理想覆盖 ${(100*LEARNING.coverage(p,k)).toFixed(1)}% · 选对 ${(100*q*LEARNING.coverage(p,k)).toFixed(1)}% · 生成调用 ${k} 次。`;}
    panel.querySelectorAll('input').forEach(x=>x.oninput=update);update();
  }
  function reactLab(body){
    body.innerHTML='<h2>让工具结果改变下一步</h2><p>固定脚本演示：查找一个示例订单金额，第一次检索失败后修订参数。这里不调用模型或外部 API。</p>';
    prediction(body,'工具返回“未找到”后应做什么？',['直接编造一个合理金额','检查参数、修订动作；超出预算则停止'],1,'Observation 是下一步决策的输入，失败需要可恢复策略与预算。');
    const trace=[['Thought','需要订单 A17 的已确认金额，先检索。'],['Action','lookup_order({id: "17"})'],['Observation','未找到：ID 应包含前缀。'],['Thought','补全前缀后重试；最多允许 2 次检索。'],['Action','lookup_order({id: "A17"})'],['Observation','示例记录：confirmed_amount = 1200 CNY。'],['Answer','订单 A17 的已确认金额是 1200 元。来源：示例工具记录。']];let step=0;
    const panel=document.createElement('div');panel.className='trace-lab';panel.innerHTML='<ol class="trace-log" aria-live="polite"></ol><div class="toolbar"><button class="btn" id="traceNext">执行下一步</button><button class="btn secondary" id="traceReset">重置演示</button></div><p class="muted" id="traceState" role="status"></p><a href="playground.html?ex=react_loop.py">修改自编 Python ReAct 示例 →</a>';body.appendChild(panel);
    function update(){panel.querySelector('ol').innerHTML=trace.slice(0,step).map(([r,t],i)=>`<li><span class="step-no">${i+1}</span><div><b>${r}</b><p>${esc(t)}</p></div></li>`).join('');panel.querySelector('#traceNext').disabled=step===trace.length;panel.querySelector('#traceState').textContent=step===trace.length?'已停止：收到有效记录并给出带来源的答案。':`已执行 ${step} / ${trace.length} 步；点击观察下一个状态。`;}
    panel.querySelector('#traceNext').onclick=()=>{step++;update();};panel.querySelector('#traceReset').onclick=()=>{step=0;update();};update();
  }
  function grpoLab(body){
    body.innerHTML='<h2>同一组里的相对奖励</h2><p>调整四个候选的奖励，观察标准化优势的符号和大小。这一步还没有进行策略更新。</p>';
    prediction(body,'如果一组奖励全部相同，优势会怎样？',['全为 0，没有组内区分信号','全为正，继续强化全部候选'],0,'组内没有相对差异。示例对零方差显式返回 0。');
    const panel=document.createElement('div');panel.className='lab-panel';panel.innerHTML=`<div class="lab-controls">${[0,0,1,1].map((v,i)=>`<label>候选 ${i+1} 奖励 <output>${v}</output><input type="range" aria-label="候选 ${i+1} 奖励" min="0" max="1" step="0.1" value="${v}"></label>`).join('')}<button class="btn secondary" id="sameRewards">设为相同奖励</button></div><div><div class="advantage-bars" aria-label="四个候选的相对优势"></div><p class="lab-result" role="status"></p></div></div><p class="source-caption">自编公式示意：Aᵢ = (rᵢ − mean(r)) / std(r)，这里使用总体标准差；零方差时返回 0。真实 GRPO 训练还涉及采样、策略比率、裁剪等，不能用本演示证明模型能力提升。</p><a href="playground.html?ex=grpo_advantage.py">运行优势计算示例 →</a> · <a href="lectures/L06.html">回到 L06 →</a>`;body.appendChild(panel);
    function update(){const inputs=[...panel.querySelectorAll('input')],rs=inputs.map(x=>+x.value),a=LEARNING.advantages(rs);inputs.forEach(x=>x.previousElementSibling.textContent=(+x.value).toFixed(1));panel.querySelector('.advantage-bars').innerHTML=a.map((v,i)=>`<div class="advantage-row"><span>候选 ${i+1}</span><meter min="-2" max="2" value="${v}" aria-label="候选 ${i+1} 优势"></meter><b>${v.toFixed(2)}</b></div>`).join('');panel.querySelector('[role=status]').textContent=a.every(v=>v===0)?'全组同奖励：优势全部为 0，没有组内区分信号。':'正优势：相对组均值更好；负优势：相对组均值更差。';}
    panel.querySelectorAll('input').forEach(x=>x.oninput=update);panel.querySelector('#sameRewards').onclick=()=>{panel.querySelectorAll('input').forEach(x=>x.value=.5);update();};update();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const requested=new URLSearchParams(location.search).get('track')||read('cs329a_learning_track','full');track=Object.hasOwn(LEARNING.tracks,requested)?requested:'full';
    write("cs329a_learning_track",track);
    renderHome();renderPath();renderProgress();renderLab();enhanceLesson();
    document.querySelectorAll('.side-link').forEach(a=>{const id=a.getAttribute('href').match(/(L\d{2})\.html/)?.[1];if(id&&done(id))a.classList.add('is-read');});
    document.querySelectorAll('.nav').forEach(nav=>{const a=document.createElement('a');a.href=root()+'learning-lab.html';a.textContent='机制实验';if(document.getElementById('learningLab'))a.className='active';nav.appendChild(a);});
    document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname!==location.pathname||!u.hash)return;let target;try{target=document.getElementById(decodeURIComponent(u.hash.slice(1)));}catch(_){}if(target){e.preventDefault();jumpTo(target);history.replaceState(null,'',u);}});
    document.addEventListener('cs329a:progress',()=>{renderHome();renderPath();renderProgress();});
    window.addEventListener('storage',e=>{if(e.key===CS329A.progressKey){renderHome();renderPath();renderProgress();}});
  });
})();
