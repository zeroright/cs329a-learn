/*! CS329A inline lecture visualizations (v9b). Vanilla JS + Canvas/SVG. Lazy-init on scroll. */
(function(){
  'use strict';
  const NS='http://www.w3.org/2000/svg';

  function cssVar(name, fallback){
    try{const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim();return v||fallback;}catch(e){return fallback;}
  }
  function colors(){
    return {
      brand: cssVar('--brand','#2563eb'),
      brand2: cssVar('--brand2','#7c3aed'),
      ok: cssVar('--ok','#059669'),
      warn: cssVar('--warn','#d97706'),
      bad: cssVar('--bad','#dc2626'),
      muted: cssVar('--muted','#5c6578'),
      text: cssVar('--text','#1a1d26'),
      border: cssVar('--border','#e2e6ef'),
      bg: cssVar('--bg','#f6f7fb'),
      bg2: cssVar('--bg2','#fff'),
    };
  }
  function el(tag, attrs, kids){
    const n=document.createElement(tag);
    if(attrs) for(const k in attrs){
      if(k==='className') n.className=attrs[k];
      else if(k==='text') n.textContent=attrs[k];
      else if(k==='html') n.innerHTML=attrs[k];
      else if(k.startsWith('on')&&typeof attrs[k]==='function') n.addEventListener(k.slice(2).toLowerCase(),attrs[k]);
      else n.setAttribute(k,attrs[k]);
    }
    (kids||[]).forEach(c=>{ if(c!=null) n.appendChild(typeof c==='string'?document.createTextNode(c):c); });
    return n;
  }
  function svgEl(tag, attrs){
    const n=document.createElementNS(NS,tag);
    if(attrs) for(const k in attrs) n.setAttribute(k,attrs[k]);
    return n;
  }
  function cardShell(title, how, tag){
    const root=el('div',{className:'inline-viz','data-iv-ready':'0'});
    const head=el('div',{className:'iv-head'},[
      el('h3',{className:'iv-title',text:title}),
      tag?el('span',{className:'iv-tag',text:tag}):null
    ]);
    const howEl=el('p',{className:'iv-how',text:how});
    const body=el('div',{className:'iv-body'});
    const controls=el('div',{className:'iv-controls'});
    const stage=el('div',{className:'iv-stage'});
    body.appendChild(controls); body.appendChild(stage);
    root.appendChild(head); root.appendChild(howEl); root.appendChild(body);
    return {root,controls,stage};
  }
  function rangeControl(controls, label, min, max, step, value, onInput){
    const val=el('span',{className:'iv-val',text:fmt(value,step)});
    const input=el('input',{type:'range',min:String(min),max:String(max),step:String(step),value:String(value)});
    const lab=el('label',{},[document.createTextNode(label), val, input]);
    input.addEventListener('input',()=>{val.textContent=fmt(+input.value,step); onInput(+input.value);});
    controls.appendChild(lab);
    return {input,val,get:()=>+input.value,set:(v)=>{input.value=String(v);val.textContent=fmt(v,step);}};
  }
  function fmt(v,step){
    if(step<1){const d=String(step).split('.')[1]?.length||2; return Number(v).toFixed(d);}
    return String(Math.round(v));
  }
  function btnRow(controls, buttons){
    const row=el('div',{className:'iv-btns'});
    buttons.forEach(([label,fn])=>{
      const b=el('button',{type:'button',text:label});
      b.addEventListener('click',fn);
      row.appendChild(b);
    });
    controls.appendChild(row);
    return row;
  }
  function note(stage, text){
    let n=stage.querySelector('.iv-note');
    if(!n){n=el('p',{className:'iv-note'}); stage.appendChild(n);}
    n.textContent=text;
    return n;
  }
  function metrics(stage, items){
    let m=stage.querySelector('.iv-metric');
    if(!m){m=el('div',{className:'iv-metric'}); stage.appendChild(m);}
    m.innerHTML='';
    items.forEach(([k,v])=>m.appendChild(el('span',{text:`${k}: ${v}`})));
    return m;
  }
  function clearStage(stage){
    [...stage.children].forEach(c=>{ if(!c.classList.contains('iv-note') && !c.classList.contains('iv-metric')) c.remove(); });
  }
  function canvas(stage, w, h){
    clearStage(stage);
    const c=el('canvas',{width:String(w),height:String(h)});
    c.style.maxWidth='100%';
    stage.insertBefore(c, stage.querySelector('.iv-note')||null);
    return c;
  }
  function svgStage(stage, w, h){
    clearStage(stage);
    const s=svgEl('svg',{viewBox:`0 0 ${w} ${h}`,width:String(w),height:String(h)});
    stage.insertBefore(s, stage.querySelector('.iv-note')||null);
    return s;
  }
  function axis(ctx, W, H, pad){
    const C=colors();
    ctx.strokeStyle=C.muted; ctx.lineWidth=1; ctx.beginPath();
    ctx.moveTo(pad,H-pad); ctx.lineTo(W-pad,H-pad); ctx.lineTo(W-pad,pad); ctx.stroke();
  }
  function linePath(ctx, pts, color, width){
    if(!pts.length) return;
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.strokeStyle=color; ctx.lineWidth=width||2; ctx.stroke();
  }

  function niceTicks(min, max, count){
    if(!(max>min)) return [min];
    const span=max-min, step0=span/Math.max(1,count);
    const mag=Math.pow(10, Math.floor(Math.log10(Math.abs(step0)||1e-9)));
    const norm=step0/mag;
    const step=(norm<1.5?1:norm<3?2:norm<7?5:10)*mag;
    const start=Math.ceil(min/step-1e-12)*step, ticks=[];
    for(let v=start; v<=max+step*1e-9; v+=step) ticks.push(+v.toPrecision(12));
    if(!ticks.length) ticks.push(min,max);
    return ticks;
  }
  function mapX(x, xMin, xMax, left, right, log){
    if(log){
      const a=Math.log(Math.max(xMin,1e-12)), b=Math.log(Math.max(xMax,1e-12));
      return left + (right-left)*(Math.log(Math.max(x,1e-12))-a)/(b-a||1);
    }
    return left + (right-left)*(x-xMin)/(xMax-xMin||1);
  }
  function mapY(y, yMin, yMax, top, bottom){
    return bottom - (bottom-top)*(y-yMin)/(yMax-yMin||1);
  }
  function roundRect(ctx,x,y,w,h,r){
    const rr=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);
    ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
  }
  /** Full line chart: axes, ticks, titles, legend, optional marker. */
  function drawLineChart(ctx, opts){
    const C=colors();
    const W=ctx.canvas.width, H=ctx.canvas.height;
    const pad={l:54, r:16, t:28, b:46};
    const left=pad.l, right=W-pad.r, top=pad.t, bottom=H-pad.b;
    const xMin=opts.xMin, xMax=opts.xMax, yMin=opts.yMin??0, yMax=opts.yMax??1;
    const logX=!!opts.logX;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=C.bg; ctx.fillRect(left, top, right-left, bottom-top);
    ctx.font='11px system-ui,sans-serif';
    ctx.fillStyle=C.muted; ctx.strokeStyle=C.border; ctx.lineWidth=1;
    const yTicks=niceTicks(yMin, yMax, opts.yTicks||4);
    yTicks.forEach(v=>{
      const y=mapY(v,yMin,yMax,top,bottom);
      ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(right,y); ctx.stroke();
      ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText(opts.yFormat?opts.yFormat(v):(Math.abs(yMax)<=2?v.toFixed(2):String(Math.round(v))), left-6, y);
    });
    let xTicks;
    if(opts.xTicks){ xTicks=opts.xTicks; }
    else if(logX){
      xTicks=[];
      const span=Math.log10(Math.max(xMax,1e-12))-Math.log10(Math.max(xMin,1e-12));
      if(span>=2.5){
        const p0=Math.ceil(Math.log10(Math.max(xMin,1e-12))-1e-12);
        const p1=Math.floor(Math.log10(Math.max(xMax,1e-12))+1e-12);
        for(let p=p0;p<=p1;p++) xTicks.push(Math.pow(10,p));
      } else {
        let p=1; while(p<xMin) p*=2;
        for(; p<=xMax*1.001; p*=2) xTicks.push(p);
      }
      if(!xTicks.length || xTicks[0]>xMin*1.001) xTicks.unshift(xMin);
      if(xTicks[xTicks.length-1]<xMax*0.999) xTicks.push(xMax);
    } else {
      xTicks=niceTicks(xMin,xMax,opts.xTickCount||5);
    }
    xTicks.forEach(v=>{
      const x=mapX(v,xMin,xMax,left,right,logX);
      ctx.beginPath(); ctx.moveTo(x,top); ctx.lineTo(x,bottom); ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText(opts.xFormat?opts.xFormat(v):String(v), x, bottom+6);
    });
    ctx.strokeStyle=C.muted; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(left,top); ctx.lineTo(left,bottom); ctx.lineTo(right,bottom); ctx.stroke();
    ctx.fillStyle=C.text; ctx.font='12px system-ui,sans-serif';
    ctx.save(); ctx.translate(14,(top+bottom)/2); ctx.rotate(-Math.PI/2);
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(opts.yTitle||'',0,0); ctx.restore();
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillText(opts.xTitle||'', (left+right)/2, H-4);
    (opts.series||[]).forEach(s=>{
      const pts=s.pts||[]; if(pts.length<1) return;
      ctx.beginPath();
      pts.forEach((p,i)=>{
        const x=mapX(p[0],xMin,xMax,left,right,logX);
        const y=mapY(p[1],yMin,yMax,top,bottom);
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      });
      ctx.strokeStyle=s.color||C.brand; ctx.lineWidth=s.width||2.4;
      if(s.dash) ctx.setLineDash(s.dash); else ctx.setLineDash([]);
      ctx.stroke(); ctx.setLineDash([]);
    });
    if(opts.marker){
      const m=opts.marker;
      const x=mapX(m.x,xMin,xMax,left,right,logX);
      const y=mapY(m.y,yMin,yMax,top,bottom);
      ctx.strokeStyle=m.color||C.brand2; ctx.setLineDash([4,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x,top); ctx.lineTo(x,bottom); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=m.color||C.brand2;
      ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=C.bg2; ctx.lineWidth=1.5; ctx.stroke();
      if(m.label){
        ctx.font='11px system-ui,sans-serif';
        const lw=ctx.measureText(m.label).width;
        let lx=x+8, ly=y-10; if(lx+lw+8>right) lx=x-lw-12;
        if(ly<top+14) ly=y+18;
        ctx.fillStyle=C.bg2; ctx.strokeStyle=C.border;
        ctx.beginPath(); roundRect(ctx, lx-4, ly-11, lw+8, 16, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle=C.text; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(m.label, lx, ly-3);
      }
    }
    if(opts.legend && opts.legend.length){
      let lx=left+8, ly=top+12;
      ctx.font='11px system-ui,sans-serif';
      opts.legend.forEach(item=>{
        ctx.strokeStyle=item.color; ctx.lineWidth=2.2;
        if(item.dash) ctx.setLineDash(item.dash); else ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx+16,ly); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=C.text; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(item.label, lx+20, ly);
        lx += 28 + ctx.measureText(item.label).width;
        if(lx > right-60){ lx=left+8; ly+=14; }
      });
    }
  }
  // —— math helpers ——
  function passAtK(p,k){ return 1-Math.pow(1-p,k); }
  function binomPMF(n,k,p){
    if(k<0||k>n) return 0;
    let logC=0;
    for(let i=1;i<=k;i++) logC += Math.log(n-k+i)-Math.log(i);
    return Math.exp(logC + k*Math.log(p) + (n-k)*Math.log(1-p));
  }
  function majorityAcc(n,p){
    // P(correct votes > n/2); ties count as fail for even n
    let s=0; const need=Math.floor(n/2)+1;
    for(let k=need;k<=n;k++) s+=binomPMF(n,k,p);
    return Math.min(1,Math.max(0,s));
  }
  function mean(arr){return arr.reduce((a,b)=>a+b,0)/Math.max(1,arr.length);}
  function std(arr){const m=mean(arr); return Math.sqrt(mean(arr.map(x=>(x-m)*(x-m))));}

  // —— widgets ——
  const W={};

  W.passAtK=function(mount){
    const {root,controls,stage}=cardShell(
      'pass@k 覆盖率','怎么看：拖动单次成功率 p 与当前采样数 k。蓝线为 1−(1−p)^k（对数横轴）。','公式 · L02'
    );
    const pC=rangeControl(controls,'单次成功率 p',0.01,0.5,0.01,0.12,draw);
    const kC=rangeControl(controls,'当前 k',1,256,1,64,draw);
    btnRow(controls,[['k=1',()=>{kC.set(1);draw();}],['k=16',()=>{kC.set(16);draw();}],['k=64',()=>{kC.set(64);draw();}],['k=256',()=>{kC.set(256);draw();}]]);
    function draw(){
      const c=canvas(stage,760,300); const ctx=c.getContext('2d'); const C=colors();
      const p=pC.get(),k=kC.get();
      const pts=[];
      for(let i=0;i<=80;i++){
        const kk=Math.pow(256,i/80); pts.push([kk, passAtK(p,kk)]);
      }
      const cur=passAtK(p,k);
      drawLineChart(ctx,{
        xMin:1,xMax:256,yMin:0,yMax:1,logX:true,
        xTitle:'采样数 k（对数）', yTitle:'覆盖率',
        yFormat:v=>(v*100).toFixed(0)+'%',
        series:[{pts,color:C.brand,width:2.6}],
        legend:[{label:`pass@k = 1−(1−p)^k  (p=${p.toFixed(2)})`,color:C.brand}],
        marker:{x:k,y:cur,color:C.brand2,label:`k=${k} → ${(cur*100).toFixed(1)}%`}
      });
      metrics(stage,[['pass@'+k, cur.toFixed(3)],['p',p.toFixed(2)]]);
      note(stage,'蓝线：pass@k=1−(1−p)^k。竖线+圆点标记当前 k。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.majorityVote=function(mount){
    const {root,controls,stage}=cardShell(
      '多数投票准确率','怎么看：N 条独立采样、各自正确率 p，多数票正确的概率。对比 pass@N（至少一个对）。','Self-Consistency'
    );
    const pC=rangeControl(controls,'单条正确率 p',0.3,0.9,0.01,0.65,draw);
    const nC=rangeControl(controls,'采样数 N（奇数）',1,31,2,11,draw);
    function draw(){
      const c=canvas(stage,760,300); const ctx=c.getContext('2d'); const C=colors();
      const p=pC.get(); let nCur=nC.get()|0; if(nCur%2===0) nCur+=1;
      const xs=[], maj=[], pas=[];
      for(let n=1;n<=31;n+=2){ xs.push(n); maj.push(majorityAcc(n,p)); pas.push(passAtK(p,n)); }
      const acc=majorityAcc(nCur,p);
      drawLineChart(ctx,{
        xMin:1,xMax:31,yMin:0,yMax:1,xTicks:xs,
        xTitle:'采样数 N（奇数）', yTitle:'正确率',
        yFormat:v=>(v*100).toFixed(0)+'%',
        series:[
          {pts:xs.map((x,i)=>[x,pas[i]]),color:C.brand,width:2.2},
          {pts:xs.map((x,i)=>[x,maj[i]]),color:C.ok,width:2.6}
        ],
        legend:[{label:'pass@N',color:C.brand},{label:'majority@N',color:C.ok}],
        marker:{x:nCur,y:acc,color:C.brand2,label:`N=${nCur} → ${(acc*100).toFixed(1)}%`}
      });
      metrics(stage,[['N',String(nCur)],['多数票',acc.toFixed(3)],['pass@N',passAtK(p,nCur).toFixed(3)]]);
      note(stage,'横轴采样数，纵轴正确率。p>0.5 时多数票随 N 上升；p<0.5 时下降。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.bonVerifier=function(mount){
    const {root,controls,stage}=cardShell(
      'Best-of-N × Verifier','怎么看：oracle 曲线是 1−(1−base)^N；verifier 越准，绿线越贴近 oracle。','L03'
    );
    const nC=rangeControl(controls,'候选数 N',1,64,1,16,draw);
    const bC=rangeControl(controls,'真正确率 base',0.05,0.6,0.01,0.2,draw);
    const vC=rangeControl(controls,'Verifier 精度',0.5,1,0.01,0.85,draw);
    function draw(){
      const c=canvas(stage,760,300); const ctx=c.getContext('2d'); const C=colors();
      const N=nC.get(),base=bC.get(),v=vC.get();
      const oracle=[], noisy=[];
      for(let n=1;n<=Math.max(N,2);n++){
        const o=passAtK(base,n);
        const score=o*v+(1-v)*(1/Math.max(2,n));
        oracle.push([n,o]); noisy.push([n,score]);
      }
      const oN=passAtK(base,N), sN=oN*v+(1-v)/Math.max(2,N);
      drawLineChart(ctx,{
        xMin:1,xMax:Math.max(N,2),yMin:0,yMax:1,
        xTitle:'候选数 N', yTitle:'选中正确率',
        yFormat:v=>(v*100).toFixed(0)+'%',
        series:[
          {pts:oracle,color:C.muted,width:1.8,dash:[4,3]},
          {pts:noisy,color:C.ok,width:2.6}
        ],
        legend:[{label:'oracle = pass@N',color:C.muted,dash:[4,3]},{label:'带噪 verifier',color:C.ok}],
        marker:{x:N,y:sN,color:C.brand2,label:`N=${N} → ${(sN*100).toFixed(1)}%`}
      });
      metrics(stage,[['oracle@'+N, oN.toFixed(3)],['混估', sN.toFixed(3)]]);
      note(stage,'灰虚线=完美排序 oracle；绿线=带噪 verifier 示意（非特定论文拟合）。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.ormPrm=function(mount){
    const {root,controls,stage}=cardShell(
      'ORM vs PRM 逐步打分','怎么看：点「步进」看推理轨迹。ORM 只在终点打分；PRM 给每一步打分，便于剪枝错误中间步。默认停在首次错误步。','L03'
    );
    const steps=[
      {t:'读题 / 设未知数', ok:true, prm:0.92},
      {t:'列方程', ok:true, prm:0.88},
      {t:'移项（引入符号错）', ok:false, prm:0.35},
      {t:'求解', ok:false, prm:0.28},
      {t:'作答', ok:false, prm:0.22},
    ];
    let i=3; // show through first error
    btnRow(controls,[['步进 +1',()=>{i=Math.min(steps.length,i+1);draw();}],['跳到错误步',()=>{i=3;draw();}],['重置',()=>{i=1;draw();}]]);
    function draw(){
      const s=svgStage(stage,640,220);
      const C=colors();
      steps.forEach((st,idx)=>{
        const x=40+idx*118, y=70;
        const active=idx<i;
        const fill= !active? C.border : (st.ok?C.ok:C.bad);
        const r=svgEl('rect',{x:x,y:y,width:100,height:56,rx:10,fill:fill,opacity:active?0.9:0.35});
        s.appendChild(r);
        const lab=svgEl('text',{x:x+50,y:y+24,'text-anchor':'middle',fill:'#fff','font-size':'11','font-family':'system-ui'});
        lab.textContent='步 '+(idx+1); s.appendChild(lab);
        const lab2=svgEl('text',{x:x+50,y:y+42,'text-anchor':'middle',fill:'#fff','font-size':'10','font-family':'system-ui'});
        lab2.textContent=active?('PRM '+st.prm.toFixed(2)):'…'; s.appendChild(lab2);
        if(idx<steps.length-1){
          const line=svgEl('line',{x1:x+100,y1:y+28,x2:x+118,y2:y+28,stroke:C.muted,'stroke-width':'2'});
          s.appendChild(line);
        }
      });
      // ORM score box
      const orm=i===0? '—' : (i<steps.length? '未出结果' : (steps.every(x=>x.ok)?'1.00':'0.00'));
      const box=svgEl('rect',{x:200,y:150,width:240,height:44,rx:8,fill:C.bg2,stroke:C.border});
      s.appendChild(box);
      const tx=svgEl('text',{x:320,y:178,'text-anchor':'middle',fill:C.text,'font-size':'13','font-family':'system-ui'});
      tx.textContent='ORM 终局分：'+orm+' ｜ 已展开 '+i+'/'+steps.length;
      s.appendChild(tx);
      note(stage,'示意数据：第 3 步出错后 PRM 分数骤降；ORM 要等整条轨迹结束才给 0/1。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.verifierThreshold=function(mount){
    const {root,controls,stage}=cardShell(
      'Verifier 阈值 ↔ 精确率/召回','怎么看：阈值升高 → 精确率↑、召回↓。红/绿为错误/正确分数分布（示意）。','示意数据'
    );
    const thrC=rangeControl(controls,'判定阈值 τ',0.05,0.95,0.01,0.55,draw);
    function dens(x,mean,w){const z=(x-mean)/w; return Math.exp(-0.5*z*z);}
    function draw(){
      const c=canvas(stage,760,300); const ctx=c.getContext('2d'); const C=colors();
      const tau=thrC.get();
      const neg=[],pos=[];
      for(let i=0;i<=100;i++){
        const x=i/100;
        neg.push([x, 0.85*dens(x,0.35,0.14)]);
        pos.push([x, 0.85*dens(x,0.72,0.12)]);
      }
      let tp=0,fp=0,fn=0;
      for(let i=0;i<=500;i++){
        const x=i/500;
        const pPos=dens(x,0.72,0.12), pNeg=dens(x,0.35,0.14);
        if(x>=tau){tp+=pPos; fp+=pNeg;} else {fn+=pPos;}
      }
      const prec=tp/(tp+fp||1), rec=tp/(tp+fn||1);
      drawLineChart(ctx,{
        xMin:0,xMax:1,yMin:0,yMax:1,
        xTitle:'Verifier 分数', yTitle:'密度（示意）',
        yFormat:v=>v.toFixed(1),
        series:[
          {pts:neg,color:C.bad,width:2.2},
          {pts:pos,color:C.ok,width:2.2}
        ],
        legend:[{label:'错误轨迹',color:C.bad},{label:'正确轨迹',color:C.ok}],
        marker:{x:tau,y:0.85*dens(tau,0.72,0.12),color:C.brand2,label:`τ=${tau.toFixed(2)}`}
      });
      metrics(stage,[['精确率',prec.toFixed(2)],['召回',rec.toFixed(2)],['F1',(2*prec*rec/(prec+rec||1)).toFixed(2)]]);
      note(stage,'红=错误、绿=正确分数分布（示意高斯）。竖线为阈值 τ。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.reactStepper=function(mount){
    const {root,controls,stage}=cardShell(
      'ReAct：Thought → Action → Observation','怎么看：逐步展开智能体循环。Thought 规划，Action 调工具，Observation 回灌，再决定下一步或作答。','L04'
    );
    const steps=[
      {role:'Thought', text:'需要查清 pass@k 的无偏估计公式。'},
      {role:'Action', text:'search("Chen et al pass@k unbiased estimator")'},
      {role:'Observation', text:'找到 HumanEval 论文中的组合公式。'},
      {role:'Thought', text:'用代码验证小样本无偏性。'},
      {role:'Action', text:'run_python(pass_at_k(n=10,c=3,k=5))'},
      {role:'Observation', text:'得到约 0.9167，与手算一致。'},
      {role:'Answer', text:'给出公式与实现链接。'},
    ];
    let i=2;
    btnRow(controls,[['下一步',()=>{i=Math.min(steps.length,i+1);draw();}],['重置',()=>{i=2;draw();}]]);
    function draw(){
      clearStage(stage);
      const ol=el('ol',{className:'iv-log'});
      for(let k=0;k<i;k++){
        const s=steps[k];
        ol.appendChild(el('li',{className:'role-'+s.role,text:`[${s.role}] ${s.text}`}));
      }
      stage.insertBefore(ol, stage.querySelector('.iv-note')||null);
      metrics(stage,[['步骤',`${i}/${steps.length}`]]);
      note(stage,'示例轨迹（示意），对应本讲 ReAct 工具调用闭环。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.toolCompound=function(mount){
    const {root,controls,stage}=cardShell(
      '多步工具调用成功率','怎么看：每步独立成功率 s，走完 T 步的联合成功约为 s^T。','L04'
    );
    const sC=rangeControl(controls,'单步成功 s',0.5,0.99,0.01,0.9,draw);
    const tC=rangeControl(controls,'步数 T',1,20,1,8,draw);
    function draw(){
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const s=sC.get(),T=tC.get();
      const pts=[];
      for(let t=1;t<=20;t++) pts.push([t, Math.pow(s,t)]);
      const cur=Math.pow(s,T);
      drawLineChart(ctx,{
        xMin:1,xMax:20,yMin:0,yMax:1,
        xTitle:'步数 T', yTitle:'联合成功率 s^T',
        yFormat:v=>(v*100).toFixed(0)+'%',
        series:[{pts,color:C.brand,width:2.6}],
        legend:[{label:`s=${s.toFixed(2)}`,color:C.brand}],
        marker:{x:T,y:cur,color:C.brand2,label:`T=${T} → ${(cur*100).toFixed(1)}%`}
      });
      metrics(stage,[['联合成功',cur.toFixed(3)],['失败率',(1-cur).toFixed(3)]]);
      note(stage,'理想独立假设下的乘积模型；真实系统有相关失败与重试。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.mctsTree=function(mount){
    const {root,controls,stage}=cardShell(
      '迷你 MCTS 搜索树','怎么看：选择→扩展→模拟→回传。节点显示 N（访问）与 Q（均值价值）；高亮为最近路径。','L05'
    );
    const bC=rangeControl(controls,'分支宽度',2,4,1,3,()=>{rebuild(); runSims(6);});
    const dC=rangeControl(controls,'深度',1,3,1,2,()=>{rebuild(); runSims(6);});
    let nodes=[], selectedPath=[], sim=0, autoTimer=null;
    function q(n){return n.N? n.W/n.N : 0;}
    function uct(n, parentN){
      if(n.N===0) return 1e9;
      return q(n) + 1.4 * n.prior * Math.sqrt(Math.log(parentN+1)/(n.N));
    }
    function rebuild(){
      if(autoTimer){clearInterval(autoTimer);autoTimer=null;}
      const B=bC.get(), D=dC.get();
      nodes=[{id:0,p:-1,ch:[],N:0,W:0,prior:1,label:'根',depth:0}];
      function grow(id, depth){
        if(depth>=D) return;
        const n=nodes[id];
        for(let b=0;b<B;b++){
          const child={id:nodes.length,p:id,ch:[],N:0,W:0,prior:1/B,label:String.fromCharCode(65+(nodes.length-1)%26),depth:depth+1};
          nodes.push(child); n.ch.push(child.id); grow(child.id, depth+1);
        }
      }
      grow(0,0); selectedPath=[0]; sim=0;
    }
    function oneSim(){
      let cur=0; const path=[0];
      while(nodes[cur].ch.length){
        let best=nodes[cur].ch[0], bestU=-1e9;
        nodes[cur].ch.forEach(cid=>{
          const u=uct(nodes[cid], nodes[cur].N);
          if(u>bestU){bestU=u;best=cid;}
        });
        cur=best; path.push(cur);
        if(nodes[cur].N===0) break;
      }
      // leaf value (deterministic hash)
      const u=Math.sin((cur+1+sim)*12.9898)*43758.5453; const r=u-Math.floor(u);
      const v=0.25+r*0.7;
      for(let i=path.length-1;i>=0;i--){ const n=nodes[path[i]]; n.N+=1; n.W+=v; }
      selectedPath=path; sim++;
    }
    function layout(){
      const byD={};
      nodes.forEach(n=>{ (byD[n.depth]=byD[n.depth]||[]).push(n.id); });
      const W=760, H=40+Object.keys(byD).length*78;
      Object.keys(byD).forEach(d=>{
        const ids=byD[d];
        ids.forEach((id,i)=>{
          nodes[id].x=70+(W-100)*(i+1)/(ids.length+1);
          nodes[id].y=36+Number(d)*78;
        });
      });
      return {W,H:Math.max(280,H)};
    }
    function draw(){
      const {W,H}=layout();
      const s=svgStage(stage,W,H);
      const C=colors();
      nodes.forEach(n=>{
        n.ch.forEach(cid=>{
          const c=nodes[cid];
          const on=selectedPath.includes(n.id)&&selectedPath.includes(cid);
          s.appendChild(svgEl('line',{x1:n.x,y1:n.y,x2:c.x,y2:c.y,stroke:on?C.brand2:C.border,'stroke-width':on?3:1.4}));
        });
      });
      nodes.forEach(n=>{
        const on=selectedPath.includes(n.id);
        s.appendChild(svgEl('circle',{cx:n.x,cy:n.y,r:22,fill:on?C.brand:C.bg2,stroke:on?C.brand2:C.border,'stroke-width':on?2.5:1.4}));
        const t1=svgEl('text',{x:n.x,y:n.y-4,'text-anchor':'middle','font-size':'11',fill:on?'#fff':C.text,'font-family':'system-ui,sans-serif'});
        t1.textContent=n.label; s.appendChild(t1);
        const t2=svgEl('text',{x:n.x,y:n.y+10,'text-anchor':'middle','font-size':'9',fill:on?'#e0e7ff':C.muted,'font-family':'system-ui,sans-serif'});
        t2.textContent=`N=${n.N}`; s.appendChild(t2);
        const t3=svgEl('text',{x:n.x,y:n.y+38,'text-anchor':'middle','font-size':'10',fill:C.text,'font-family':'system-ui,sans-serif'});
        t3.textContent=`Q=${q(n).toFixed(2)}`; s.appendChild(t3);
      });
      metrics(stage,[['模拟',String(sim)],['节点',String(nodes.length)],['路径',selectedPath.map(i=>nodes[i].label).join('→')]]);
      note(stage,'UCT≈Q+c·P·√(ln N_p/N)。加载时已预跑若干模拟；可自动播放继续。');
    }
    function runSims(k){ for(let i=0;i<k;i++) oneSim(); draw(); }
    btnRow(controls,[
      ['+1 次模拟',()=>{oneSim();draw();}],
      ['+5 次',()=>runSims(5)],
      ['自动播放',()=>{
        if(autoTimer){clearInterval(autoTimer);autoTimer=null;return;}
        autoTimer=setInterval(()=>{oneSim();draw(); if(sim>=30){clearInterval(autoTimer);autoTimer=null;}},400);
      }],
      ['重置并预跑',()=>{rebuild(); runSims(6);}]
    ]);
    rebuild(); runSims(6);
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.beamSearch=function(mount){
    const {root,controls,stage}=cardShell(
      'Beam Search 宽度','怎么看：beam 越大保留候选越多，覆盖更好但算力近似线性涨。对比贪心（beam=1）。','L05'
    );
    const bC=rangeControl(controls,'Beam 宽度 B',1,8,1,4,draw);
    const dC=rangeControl(controls,'深度 D',2,6,1,4,draw);
    function draw(){
      const B=bC.get(),D=dC.get();
      const s=svgStage(stage,640,260);
      const C=colors();
      // show nodes kept per layer = min(B, branching^depth) with branching=3 assumed
      const branch=3;
      for(let d=0;d<=D;d++){
        const keep=Math.min(B, Math.pow(branch,d));
        const y=30+d*36;
        for(let i=0;i<keep;i++){
          const x=40+i*((560)/Math.max(1,keep));
          s.appendChild(svgEl('circle',{cx:x+10,cy:y,r:10,fill:d===0?C.brand:C.brand2}));
        }
        const lab=svgEl('text',{x:600,y:y+4,'text-anchor':'end',fill:C.muted,'font-size':'11','font-family':'system-ui'});
        lab.textContent=`d=${d} 保留 ${keep}`; s.appendChild(lab);
      }
      const nodes=Array.from({length:D+1},(_,d)=>Math.min(B,Math.pow(branch,d))).reduce((a,b)=>a+b,0);
      metrics(stage,[['约展开节点',String(nodes)],['相对贪心算力', (nodes/(D+1)).toFixed(1)+'×']]);
      note(stage,'示意：每层分支因子 3，仅保留得分最高的 B 个（未画真实打分）。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.starLoop=function(mount, opts){
    opts=opts||{};
    const {root,controls,stage}=cardShell(
      opts.title||'STaR 自举循环',
      opts.how||'怎么看：生成推理 → 按最终答案过滤 → 用正确轨迹微调 → 再生成。点步进看环路。',
      opts.tag||'L06'
    );
    const phases=opts.phases||['生成带推理轨迹','过滤：答案正确者保留','SFT 微调策略','评估 / 提高温度再采样'];
    let i=2;
    btnRow(controls,[['下一步',()=>{i=Math.min(phases.length,i+1);draw();}],['重置',()=>{i=2;draw();}]]);
    function draw(){
      const s=svgStage(stage,640,240);
      const C=colors();
      const cx=320,cy=120,R=78;
      phases.forEach((p,idx)=>{
        const ang=-Math.PI/2+idx*(Math.PI*2/phases.length);
        const x=cx+R*Math.cos(ang), y=cy+R*Math.sin(ang);
        const on=idx<i;
        s.appendChild(svgEl('circle',{cx:x,cy:y,r:28,fill:on?C.brand:C.border,opacity:on?1:0.5}));
        const t=svgEl('text',{x:x,y:y+4,'text-anchor':'middle',fill:on?'#fff':C.muted,'font-size':'10','font-family':'system-ui'});
        t.textContent=String(idx+1); s.appendChild(t);
        const lab=svgEl('text',{x:x,y:y+48,'text-anchor':'middle',fill:C.text,'font-size':'11','font-family':'system-ui'});
        lab.textContent=p.slice(0,8)+(p.length>8?'…':''); s.appendChild(lab);
      });
      // arrows as arc hint
      s.appendChild(svgEl('circle',{cx:cx,cy:cy,r:R,fill:'none',stroke:C.muted,'stroke-width':'1.5','stroke-dasharray':'4 4'}));
      note(stage, i===0?'点击下一步开始 STaR 循环。':`当前：${phases[i-1]}（${i}/${phases.length}）`);
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.grpoAdvantage=function(mount){
    const {root,controls,stage}=cardShell(
      'GRPO 组内相对优势','怎么看：同一 prompt 下采样一组奖励 r，优势 A=(r−μ)/σ。正负柱相对 A=0 基线，高度 ∝ |A|。','L06'
    );
    const rs=[];
    for(let i=0;i<4;i++){
      rs.push(rangeControl(controls,`样本 ${i+1} 奖励 r`,0,1,0.01, [0.2,0.55,0.8,0.35][i], draw));
    }
    function draw(){
      const rewards=rs.map(r=>r.get());
      const mu=mean(rewards), sg=std(rewards)||1e-6;
      const adv=rewards.map(r=>(r-mu)/sg);
      const c=canvas(stage,760,300); const ctx=c.getContext('2d'); const C=colors();
      const Wd=c.width,H=c.height, pad={l:54,r:16,t:28,b:44};
      const left=pad.l,right=Wd-pad.r,top=pad.t,bottom=H-pad.b;
      const aMax=Math.max(1.2, ...adv.map(Math.abs))*1.15;
      const zeroY=mapY(0,-aMax,aMax,top,bottom);
      ctx.clearRect(0,0,Wd,H);
      ctx.fillStyle=C.bg; ctx.fillRect(left,top,right-left,bottom-top);
      ctx.strokeStyle=C.border; ctx.fillStyle=C.muted; ctx.font='11px system-ui,sans-serif';
      niceTicks(-aMax,aMax,4).forEach(v=>{
        const y=mapY(v,-aMax,aMax,top,bottom);
        ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
        ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(v.toFixed(1),left-6,y);
      });
      // A=0 baseline
      ctx.strokeStyle=C.text; ctx.lineWidth=1.8;
      ctx.beginPath();ctx.moveTo(left,zeroY);ctx.lineTo(right,zeroY);ctx.stroke();
      ctx.fillStyle=C.text; ctx.font='10px system-ui,sans-serif';
      ctx.textAlign='left'; ctx.textBaseline='bottom'; ctx.fillText('A=0', left+4, zeroY-3);
      const G=adv.length, gap=(right-left)/G;
      adv.forEach((a,i)=>{
        const x=left+gap*i+gap*0.18, bw=gap*0.64;
        const y2=mapY(a,-aMax,aMax,top,bottom);
        const topB=Math.min(zeroY,y2), h=Math.max(2,Math.abs(y2-zeroY));
        ctx.fillStyle=a>=0?C.ok:C.bad;
        ctx.fillRect(x,topB,bw,h);
        ctx.fillStyle=C.text; ctx.font='10px system-ui,sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('r'+(i+1), x+bw/2, bottom+6);
        ctx.textBaseline=a>=0?'bottom':'top';
        ctx.fillText(a.toFixed(2), x+bw/2, a>=0?topB-3:topB+h+3);
      });
      ctx.strokeStyle=C.muted; ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,bottom);ctx.lineTo(right,bottom);ctx.stroke();
      ctx.fillStyle=C.text; ctx.font='12px system-ui,sans-serif';
      ctx.save();ctx.translate(14,(top+bottom)/2);ctx.rotate(-Math.PI/2);
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('优势 A=(r−μ)/σ',0,0);ctx.restore();
      ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('组内样本',(left+right)/2,H-2);
      ctx.font='11px system-ui,sans-serif';
      ctx.fillStyle=C.ok;ctx.fillRect(left+8,top+6,12,10);
      ctx.fillStyle=C.text;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('A>0',left+24,top+11);
      ctx.fillStyle=C.bad;ctx.fillRect(left+70,top+6,12,10);
      ctx.fillText('A<0',left+86,top+11);
      metrics(stage,[['μ',mu.toFixed(3)],['σ',sg.toFixed(3)],['ΣA',adv.reduce((s,a)=>s+a,0).toFixed(3)]]);
      note(stage,'正优势在零线上方、负优势在下方；高度按 |A| 缩放。公式 A_i=(r_i−μ)/σ。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.evoLoop=function(mount){
    const {root,controls,stage}=cardShell(
      'AlphaEvolve 进化环','怎么看：种群候选 → 评估 → 选择精英 → 变异/交叉。拖动代数看适应度上升（示意）。','L07'
    );
    const gC=rangeControl(controls,'进化代数 G',0,40,1,12,draw);
    const mutC=rangeControl(controls,'变异强度',0.05,0.5,0.01,0.18,draw);
    function draw(){
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const G=gC.get(), mut=mutC.get();
      const pts=[];
      for(let g=0;g<=40;g++){
        const f=1-Math.exp(-g/(8+22*mut))*(0.6+0.15*mut);
        pts.push([g,f]);
      }
      const fNow=1-Math.exp(-G/(8+22*mut))*(0.6+0.15*mut);
      drawLineChart(ctx,{
        xMin:0,xMax:40,yMin:0,yMax:1,
        xTitle:'进化代数 G', yTitle:'适应度（示意）',
        yFormat:v=>v.toFixed(1),
        series:[{pts,color:C.brand2,width:2.6}],
        legend:[{label:'最优适应度',color:C.brand2}],
        marker:{x:G,y:fNow,color:C.ok,label:`G=${G} → ${fNow.toFixed(3)}`}
      });
      metrics(stage,[['代数',String(G)],['适应度',fNow.toFixed(3)]]);
      note(stage,'示意数据：非 AlphaEvolve 真实 run。论文亮点含 4×4 复数矩阵乘 48 次。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.adasBars=function(mount){
    const {root,controls,stage}=cardShell(
      'ADAS 元搜索收益（已核实）','怎么看：Meta Agent Search 相对强基线的提升。数字来自 ADAS 论文 Table 1（已核对）。','已核实 · L07'
    );
    rangeControl(controls,'仅展示用（无参数）',0,1,1,0,()=>{});
    controls.querySelector('label')?.remove();
    function draw(){
      clearStage(stage);
      // verified numbers
      const rows=[
        ['DROP F1','79.4','65.8'],
        ['MGSM','53.4','39.0'],
        ['MMLU','69.6','65.9'],
        ['Science','34.6','31.6'],
      ];
      const wrap=el('div',{className:'iv-bars'});
      const C=colors();
      rows.forEach(([name,a,b])=>{
        const va=+a, vb=+b, max=90;
        const col=el('div',{className:'iv-bar'});
        const i1=el('i'); i1.style.height=(va/max*150)+'px'; i1.style.background=C.brand; i1.title='ADAS '+a;
        const i2=el('i'); i2.style.height=(vb/max*150)+'px'; i2.style.background=C.muted; i2.style.maxWidth='28px';
        const pair=el('div',{style:'display:flex;gap:3px;align-items:flex-end;height:150px'});
        pair.appendChild(i1); pair.appendChild(i2);
        col.appendChild(pair);
        col.appendChild(el('b',{text:name}));
        col.appendChild(el('b',{text:`${a} vs ${b}`}));
        wrap.appendChild(col);
      });
      stage.insertBefore(wrap, stage.querySelector('.iv-note')||null);
      note(stage,'蓝=Meta Agent Search，灰=论文表中对应强基线（Role Assignment / Debate / COT-SC / Self-Refine）。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.alphacodePipeline=function(mount){
    const {root,controls,stage}=cardShell(
      'AlphaCode 采样—过滤—聚类','怎么看：大规模采样 → 单测过滤 → 按行为聚类 → 提交代表。拖动采样数看通过过滤的量级（示意）。','L08'
    );
    const nC=rangeControl(controls,'采样数（对数）',2,5,0.1,4,draw); // 10^x
    const pC=rangeControl(controls,'单测通过率',0.001,0.05,0.001,0.01,draw);
    function draw(){
      const N=Math.round(Math.pow(10,nC.get()));
      const p=pC.get();
      const passed=Math.max(0,Math.round(N*p));
      const clusters=Math.max(1,Math.round(Math.sqrt(passed)));
      clearStage(stage);
      const s=svgStage(stage,640,200);
      const C=colors();
      const stages=[['采样',String(N)],['单测过滤',String(passed)],['聚类',String(clusters)],['提交','≤10']];
      stages.forEach((st,i)=>{
        const x=40+i*150;
        s.appendChild(svgEl('rect',{x:x,y:60,width:120,height:64,rx:10,fill:C.bg2,stroke:C.brand,'stroke-width':'2'}));
        const t1=svgEl('text',{x:x+60,y:88,'text-anchor':'middle',fill:C.text,'font-size':'13','font-family':'system-ui'});
        t1.textContent=st[0]; s.appendChild(t1);
        const t2=svgEl('text',{x:x+60,y:108,'text-anchor':'middle',fill:C.brand,'font-size':'12','font-family':'system-ui'});
        t2.textContent=st[1]; s.appendChild(t2);
        if(i<stages.length-1){
          s.appendChild(svgEl('line',{x1:x+120,y1:92,x2:x+150,y2:92,stroke:C.muted,'stroke-width':'2'}));
        }
      });
      note(stage,'数量为示意乘积模型；真实 AlphaCode 还依赖聚类多样性与竞赛提交限额。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.rlhfPipeline=function(mount){
    const {root,controls,stage}=cardShell(
      'SFT → 奖励模型 → RLHF','怎么看：后训练三段式。步进查看每阶段输入/输出。InstructGPT：175B 相对 GPT-3 偏好胜率 85±3%（已核实）。','已核实 · L09'
    );
    const phases=[
      {t:'SFT',d:'示范数据上监督微调，学会按指令格式回答'},
      {t:'RM',d:'人类偏好对上训练奖励模型，给回答打分'},
      {t:'RLHF',d:'用 RM 作奖励，PPO 等优化策略；控制 KL'},
      {t:'部署',d:'对齐后的策略上线；持续收集新偏好'},
    ];
    let i=2;
    btnRow(controls,[['下一步',()=>{i=Math.min(phases.length,i+1);draw();}],['重置',()=>{i=2;draw();}]]);
    function draw(){
      const s=svgStage(stage,640,220);
      const C=colors();
      phases.forEach((p,idx)=>{
        const x=30+idx*155;
        const on=idx<i;
        s.appendChild(svgEl('rect',{x:x,y:50,width:140,height:70,rx:12,fill:on?C.brand:C.border,opacity:on?0.95:0.45}));
        const t=svgEl('text',{x:x+70,y:90,'text-anchor':'middle',fill:on?'#fff':C.muted,'font-size':'14','font-family':'system-ui','font-weight':'700'});
        t.textContent=p.t; s.appendChild(t);
        if(idx<phases.length-1) s.appendChild(svgEl('line',{x1:x+140,y1:85,x2:x+155,y2:85,stroke:C.muted,'stroke-width':'2'}));
      });
      note(stage, i===0?'点击下一步。': phases[i-1].d + ' ｜ 偏好胜率 85±3%；幻觉 21% vs GPT-3 的 41%（InstructGPT）。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.instructPref=function(mount){
    const {root,controls,stage}=cardShell(
      'InstructGPT 偏好与幻觉（已核实）','怎么看：左条偏好胜率，右条幻觉率对比。数字来自 InstructGPT 论文摘要。','已核实 · L09'
    );
    controls.appendChild(el('p',{className:'iv-how',text:'无自由参数 — 展示已核实指标。',style:'margin:0'}));
    function draw(){
      clearStage(stage);
      const wrap=el('div',{className:'iv-bars'});
      const C=colors();
      const items=[['偏好胜率',85,100,C.brand,'85±3%'],['幻觉 InstructGPT',21,50,C.ok,'21%'],['幻觉 GPT-3',41,50,C.bad,'41%']];
      items.forEach(([name,v,max,col,lab])=>{
        const bar=el('div',{className:'iv-bar'});
        const iel=el('i'); iel.style.height=(v/max*150)+'px'; iel.style.background=col;
        bar.appendChild(iel); bar.appendChild(el('b',{text:lab})); bar.appendChild(el('b',{text:name}));
        wrap.appendChild(bar);
      });
      stage.insertBefore(wrap, stage.querySelector('.iv-note')||null);
      note(stage,'175B InstructGPT 输出相对 175B GPT-3 的人类偏好胜率；闭域幻觉率对比。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.midtermRubric=function(mount, opts){
    opts=opts||{};
    const {root,controls,stage}=cardShell(
      opts.title||'期中展示时间线','怎么看：按课表节点推进选题→方法→实验→展示。可用于自检材料是否齐全。','期中'
    );
    const items=opts.items||['选题与问题定义','相关工作与基线','方法与系统图','实验与消融','演讲与答辩'];
    let i=1;
    btnRow(controls,[['推进',()=>{i=Math.min(items.length,i+1);draw();}],['重置',()=>{i=1;draw();}]]);
    function draw(){
      clearStage(stage);
      const ol=el('ol',{className:'iv-log'});
      items.forEach((t,idx)=>{
        const li=el('li',{text:(idx<i?'✓ ':'○ ')+t});
        if(idx<i) li.style.borderLeft='3px solid var(--ok)';
        ol.appendChild(li);
      });
      stage.insertBefore(ol, stage.querySelector('.iv-note')||null);
      note(stage,`进度 ${i}/${items.length}（公开课表节点示意，非评分细则原文）。`);
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.sweLoop=function(mount){
    const {root,controls,stage}=cardShell(
      'SE 智能体：定位 → 编辑 → 测试','怎么看：软件工程智能体典型闭环。失败则回定位或缩小补丁。','L13'
    );
    const steps=['读取 issue / 复现','检索相关文件','生成补丁','运行测试','分析失败并迭代'];
    let i=2;
    btnRow(controls,[['下一步',()=>{i=Math.min(steps.length,i+1);draw();}],['重置',()=>{i=2;draw();}]]);
    function draw(){
      const s=svgStage(stage,640,210);
      const C=colors();
      steps.forEach((t,idx)=>{
        const x=20+idx*125;
        const on=idx<i;
        s.appendChild(svgEl('rect',{x:x,y:70,width:115,height:50,rx:10,fill:on?C.ok:C.border,opacity:on?0.9:0.4}));
        const tx=svgEl('text',{x:x+57,y:100,'text-anchor':'middle',fill:on?'#fff':C.muted,'font-size':'11','font-family':'system-ui'});
        tx.textContent=t.slice(0,8); s.appendChild(tx);
        if(idx<steps.length-1) s.appendChild(svgEl('line',{x1:x+115,y1:95,x2:x+125,y2:95,stroke:C.muted,'stroke-width':'2'}));
      });
      // feedback arrow
      if(i>=4){
        s.appendChild(svgEl('path',{d:'M 580 130 C 400 180, 200 180, 80 130',fill:'none',stroke:C.warn,'stroke-width':'2','stroke-dasharray':'5 4'}));
        const lab=svgEl('text',{x:320,y:175,'text-anchor':'middle',fill:C.warn,'font-size':'12','font-family':'system-ui'});
        lab.textContent='测试失败 → 回定位/改补丁'; s.appendChild(lab);
      }
      note(stage,'对应 CodeMonkeys / SWE-bench 类流程的教学示意。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.resolveAttempts=function(mount){
    const {root,controls,stage}=cardShell(
      '多次尝试解析率','怎么看：随尝试次数上升的累计解决率（示意饱和曲线）。','L13'
    );
    const nC=rangeControl(controls,'尝试次数',1,40,1,12,draw);
    const pC=rangeControl(controls,'单次成功 p',0.05,0.4,0.01,0.15,draw);
    function draw(){
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const N=nC.get(),p=pC.get();
      const pts=[];
      for(let n=1;n<=40;n++) pts.push([n, 1-Math.pow(1-p,n)]);
      const cur=1-Math.pow(1-p,N);
      drawLineChart(ctx,{
        xMin:1,xMax:40,yMin:0,yMax:1,
        xTitle:'尝试次数', yTitle:'累计解决率',
        yFormat:v=>(v*100).toFixed(0)+'%',
        series:[{pts,color:C.brand,width:2.6}],
        legend:[{label:`1−(1−p)^n, p=${p.toFixed(2)}`,color:C.brand}],
        marker:{x:N,y:cur,color:C.brand2,label:`n=${N} → ${(cur*100).toFixed(1)}%`}
      });
      metrics(stage,[['n',String(N)],['解决率',cur.toFixed(3)]]);
      note(stage,'与 pass@k 同型：更多尝试换覆盖，边际递减。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.memoryTiers=function(mount){
    const {root,controls,stage}=cardShell(
      'MemGPT 分层记忆','怎么看：核心上下文有限，溢出到召回/归档。拖动「压力」看换页。','L14'
    );
    const loadC=rangeControl(controls,'上下文压力',0,1,0.01,0.35,draw);
    function draw(){
      const load=loadC.get();
      const s=svgStage(stage,640,240);
      const C=colors();
      const tiers=[
        {y:40,h:50,label:'核心上下文（工作记忆）',fill:C.brand,w:120+load*360},
        {y:110,h:40,label:'召回记忆（检索）',fill:C.brand2,w:200+load*200},
        {y:170,h:40,label:'归档 / 外部存储',fill:C.ok,w:280+load*120},
      ];
      tiers.forEach(t=>{
        s.appendChild(svgEl('rect',{x:40,y:t.y,width:Math.min(560,t.w),height:t.h,rx:10,fill:t.fill,opacity:0.85}));
        const tx=svgEl('text',{x:56,y:t.y+t.h/2+4,fill:'#fff','font-size':'12','font-family':'system-ui'});
        tx.textContent=t.label; s.appendChild(tx);
      });
      note(stage, load>0.7?'压力高：更多内容换出到召回/归档，需显式检索。':'压力适中：核心窗口可容纳主要工作集。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.contextTradeoff=function(mount){
    const {root,controls,stage}=cardShell(
      '上下文长度权衡','怎么看：更长上下文提高覆盖，但延迟/费用上升；检索压缩可折中。','L14'
    );
    const L=rangeControl(controls,'上下文 token（k）',1,128,1,32,draw);
    function draw(){
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const cur=L.get();
      const full=[], ret=[];
      for(let t=1;t<=128;t++){
        full.push([t, Math.min(0.98, 0.35+0.5*(1-Math.exp(-t/40)))]);
        ret.push([t, Math.min(0.95, 0.45+0.4*(1-Math.exp(-t/25))) - 0.05*Math.log10(Math.max(2,t))]);
      }
      const yFull=Math.min(0.98, 0.35+0.5*(1-Math.exp(-cur/40)));
      drawLineChart(ctx,{
        xMin:1,xMax:128,yMin:0,yMax:1,
        xTitle:'上下文长度（k tokens）', yTitle:'任务分数（示意）',
        yFormat:v=>(v*100).toFixed(0)+'%',
        series:[
          {pts:full,color:C.bad,width:2.2},
          {pts:ret,color:C.ok,width:2.4,dash:[5,4]}
        ],
        legend:[{label:'全量塞入',color:C.bad},{label:'检索/压缩',color:C.ok,dash:[5,4]}],
        marker:{x:cur,y:yFull,color:C.brand2,label:`${cur}k`}
      });
      metrics(stage,[['长度',cur+'k'],['全量分',yFull.toFixed(2)]]);
      note(stage,'示意：全量上下文边际收益递减；检索路线在中等长度更具性价比。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.selfConsistency=function(mount){
    const {root,controls,stage}=cardShell(
      'Self-Consistency 投票动画','怎么看：点「抽样」生成一条推理答案；柱高=票数。最终取众数。加载时已预抽若干票。','L15'
    );
    const pC=rangeControl(controls,'真答案倾向 p',0.4,0.9,0.01,0.62,()=>{});
    let counts={A:0,B:0,C:0};
    let total=0;
    function sampleOne(){
      const p=pC.get(); const r=Math.random();
      const pick=r<p?'A':(r<p+(1-p)*0.6?'B':'C');
      counts[pick]++; total++;
    }
    btnRow(controls,[
      ['抽样 +1',()=>{sampleOne(); draw();}],
      ['抽样 +5',()=>{for(let k=0;k<5;k++) sampleOne(); draw();}],
      ['重置并预抽',()=>{counts={A:0,B:0,C:0}; total=0; for(let k=0;k<9;k++) sampleOne(); draw();}]
    ]);
    function draw(){
      clearStage(stage);
      const wrap=el('div',{className:'iv-bars'});
      const C=colors();
      const max=Math.max(1,counts.A,counts.B,counts.C);
      [['A','正确(示意)',C.ok],['B','干扰1',C.warn],['C','干扰2',C.bad]].forEach(([k,lab,col])=>{
        const bar=el('div',{className:'iv-bar'});
        const iel=el('i'); iel.style.height=(counts[k]/max*150)+'px'; iel.style.background=col;
        bar.appendChild(iel); bar.appendChild(el('b',{text:String(counts[k])})); bar.appendChild(el('b',{text:lab}));
        wrap.appendChild(bar);
      });
      stage.insertBefore(wrap, stage.querySelector('.iv-note')||null);
      const winner=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
      metrics(stage,[['样本',String(total)],['当前众数', total?winner[0]:'—']]);
      note(stage,'示意三类答案；真答案先验由滑条 p 控制。多数票即 Self-Consistency 解码。');
    }
    for(let k=0;k<9;k++) sampleOne();
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.leastToMost=function(mount){
    const {root,controls,stage}=cardShell(
      'Least-to-Most 分解','怎么看：先把难题拆成子问题，由易到难求解。论文：更长 last-letter 上 ≥99% vs CoT 16%（已核实）。','已核实 · L15'
    );
    const steps=[
      '原问题：长列表 last-letter 拼接',
      '子问题1：取第1个词尾字母',
      '子问题2：拼接前两个尾字母',
      '… 递推到全长',
      '合并得到最终串'
    ];
    let i=2;
    btnRow(controls,[['下一步',()=>{i=Math.min(steps.length,i+1);draw();}],['重置',()=>{i=2;draw();}]]);
    function draw(){
      clearStage(stage);
      const ol=el('ol',{className:'iv-log'});
      for(let k=0;k<i;k++) ol.appendChild(el('li',{className:'role-Thought',text:steps[k]}));
      stage.insertBefore(ol, stage.querySelector('.iv-note')||null);
      metrics(stage,[['LtM ≥99%','已核实'],['CoT 16%','已核实']]);
      note(stage,'code-davinci-002、更长列表、14 exemplars（Least-to-Most 论文 Table 4）。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.imoScore=function(mount){
    const {root,controls,stage}=cardShell(
      'IMO 分数：银 → 金','怎么看：对比 DeepMind 公开成绩。银牌 28/42（2024），金牌 35/42（Deep Think 2025）。','已核实 · L16'
    );
    controls.appendChild(el('p',{style:'margin:0;font-size:12px;color:var(--muted)',text:'展示已核实公开成绩。'}));
    function draw(){
      clearStage(stage);
      const wrap=el('div',{className:'iv-bars'});
      const C=colors();
      [['银牌 2024',28,42,C.muted],['金牌 Deep Think',35,42,C.ok],['满分',42,42,C.brand2]].forEach(([lab,v,max,col])=>{
        const bar=el('div',{className:'iv-bar'});
        const iel=el('i'); iel.style.height=(v/max*150)+'px'; iel.style.background=col;
        bar.appendChild(iel); bar.appendChild(el('b',{text:`${v}/${max}`})); bar.appendChild(el('b',{text:lab}));
        wrap.appendChild(bar);
      });
      stage.insertBefore(wrap, stage.querySelector('.iv-note')||null);
      note(stage,'来源：DeepMind 官方博文（银 2024-07-25；金 2025-07-21）。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.ag2Solve=function(mount){
    const {root,controls,stage}=cardShell(
      'AlphaGeometry2 几何求解率','怎么看：AG1→AG2 在 IMO 几何题上的求解率与语言覆盖（已核实）。','已核实 · L16'
    );
    const mode=rangeControl(controls,'对比项',0,1,1,0,draw);
    // 0 = solve rate, 1 = language coverage — use buttons instead
    controls.querySelector('label')?.remove();
    let which=0;
    btnRow(controls,[['求解率 54%→84%',()=>{which=0;draw();}],['语言覆盖 66%→88%',()=>{which=1;draw();}]]);
    function draw(){
      clearStage(stage);
      const wrap=el('div',{className:'iv-bars'});
      const C=colors();
      const pair=which===0?[['AG1',54],['AG2',84]]:[['AG1',66],['AG2',88]];
      pair.forEach(([lab,v])=>{
        const bar=el('div',{className:'iv-bar'});
        const iel=el('i'); iel.style.height=(v/100*150)+'px'; iel.style.background=lab==='AG2'?C.ok:C.muted;
        bar.appendChild(iel); bar.appendChild(el('b',{text:v+'%'})); bar.appendChild(el('b',{text:lab}));
        wrap.appendChild(bar);
      });
      stage.insertBefore(wrap, stage.querySelector('.iv-note')||null);
      note(stage,'AG2 论文摘要：2000–2024 全部几何题求解率；语言覆盖同步提升。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.horizonDecay=function(mount){
    const {root,controls,stage}=cardShell(
      '长程任务成功率衰减','怎么看：逐步失败率 ε 下，完成 n 步的成功约为 (1−ε)^n。','L17'
    );
    const eC=rangeControl(controls,'逐步失败率 ε',0.01,0.25,0.01,0.08,draw);
    const nC=rangeControl(controls,'步数 / 时长单位',1,60,1,20,draw);
    function draw(){
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const eps=eC.get(),N=nC.get();
      const pts=[];
      for(let n=1;n<=60;n++) pts.push([n, Math.pow(1-eps,n)]);
      const cur=Math.pow(1-eps,N);
      drawLineChart(ctx,{
        xMin:1,xMax:60,yMin:0,yMax:1,
        xTitle:'步数 n', yTitle:'成功率 (1−ε)^n',
        yFormat:v=>(v*100).toFixed(0)+'%',
        series:[{pts,color:C.warn,width:2.6}],
        legend:[{label:`ε=${eps.toFixed(2)}`,color:C.warn}],
        marker:{x:N,y:cur,color:C.brand2,label:`n=${N} → ${(cur*100).toFixed(1)}%`}
      });
      metrics(stage,[['(1-ε)^n', cur.toFixed(3)],['n',String(N)]]);
      note(stage,'与 METR / 长时评测的「时间视野」直觉一致；独立失败假设示意。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.reliabilityCompound=function(mount){
    const {root,controls,stage}=cardShell(
      '可靠性复利','怎么看：把单步可靠做到 0.99 还是 0.999，在百步任务上差距巨大。','L17'
    );
    const rC=rangeControl(controls,'单步可靠 r',0.9,0.999,0.001,0.99,draw);
    const nC=rangeControl(controls,'步数',5,200,1,50,draw);
    function draw(){
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const r=rC.get(),N=nC.get();
      const mk=rr=>{const pts=[]; for(let n=1;n<=200;n++) pts.push([n,Math.pow(rr,n)]); return pts;};
      drawLineChart(ctx,{
        xMin:1,xMax:200,yMin:0,yMax:1,
        xTitle:'步数 n', yTitle:'成功率 r^n',
        yFormat:v=>(v*100).toFixed(0)+'%',
        series:[
          {pts:mk(0.99),color:C.bad,width:1.8},
          {pts:mk(0.999),color:C.ok,width:1.8},
          {pts:mk(r),color:C.brand,width:2.8}
        ],
        legend:[{label:'r=0.99',color:C.bad},{label:'r=0.999',color:C.ok},{label:`当前 r=${r.toFixed(3)}`,color:C.brand}],
        marker:{x:N,y:Math.pow(r,N),color:C.brand2,label:`n=${N} → ${Math.pow(r,N).toFixed(3)}`}
      });
      metrics(stage,[['当前 r^n', Math.pow(r,N).toFixed(4)]]);
      note(stage,'红=0.99，绿=0.999，蓝=你选的 r。示意独立乘积。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.decisionTransformer=function(mount){
    const {root,controls,stage}=cardShell(
      'Decision Transformer 回报条件','怎么看：提高目标回报 R̂，生成动作序列偏向高回报轨迹（示意）。','L18'
    );
    const rC=rangeControl(controls,'目标回报 R̂',0,1,0.01,0.7,draw);
    function draw(){
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const R=rC.get();
      const pts=[];
      for(let t=0;t<=40;t++){
        const q=R*0.85 + 0.1*Math.sin(t/3) + (1-R)*0.02;
        pts.push([t, Math.min(1,Math.max(0,q))]);
      }
      const y0=R*0.85;
      drawLineChart(ctx,{
        xMin:0,xMax:40,yMin:0,yMax:1,
        xTitle:'时间步 t', yTitle:'动作质量（示意）',
        yFormat:v=>v.toFixed(1),
        series:[{pts,color:C.brand2,width:2.6}],
        legend:[{label:`条件于 R̂=${R.toFixed(2)}`,color:C.brand2}],
        marker:{x:20,y:R*0.85+0.1*Math.sin(20/3),color:C.ok,label:`R̂=${R.toFixed(2)}`}
      });
      metrics(stage,[['目标 R̂',R.toFixed(2)]]);
      note(stage,'示意：条件在回报上的序列建模；非真实 DT 训练曲线。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.algoDistill=function(mount){
    const {root,controls,stage}=cardShell(
      'Algorithm Distillation 少样本改进','怎么看：上下文里看到更多学习历史，下游任务提升更快（示意）。','L18'
    );
    const kC=rangeControl(controls,'上下文 episode 数',0,20,1,6,draw);
    function draw(){
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const K=kC.get();
      const pts=[];
      for(let k=0;k<=20;k++) pts.push([k, 1-Math.exp(-(k+1)/4)*0.75]);
      const acc=1-Math.exp(-(K+1)/4)*0.75;
      drawLineChart(ctx,{
        xMin:0,xMax:20,yMin:0,yMax:1,
        xTitle:'上下文 episode 数', yTitle:'示意准确率',
        yFormat:v=>(v*100).toFixed(0)+'%',
        series:[{pts,color:C.ok,width:2.6}],
        legend:[{label:'in-context 学习曲线',color:C.ok}],
        marker:{x:K,y:acc,color:C.brand2,label:`K=${K} → ${(acc*100).toFixed(1)}%`}
      });
      metrics(stage,[['示意准确率',acc.toFixed(3)]]);
      note(stage,'示意数据：更多 in-context RL 历史 → 更快适应。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.vlaPipeline=function(mount){
    const {root,controls,stage}=cardShell(
      'Vision-Language-Action 管线','怎么看：视觉编码 → 语言条件 → 动作词元/轨迹。步进查看信息流。','L19'
    );
    const steps=['图像 / 状态观察','多模态编码','语言指令条件','动作词元解码','机器人执行'];
    let i=1;
    btnRow(controls,[['下一步',()=>{i=Math.min(steps.length,i+1);draw();}],['重置',()=>{i=1;draw();}]]);
    function draw(){
      const s=svgStage(stage,640,200);
      const C=colors();
      steps.forEach((t,idx)=>{
        const x=15+idx*125;
        const on=idx<i;
        s.appendChild(svgEl('rect',{x:x,y:70,width:118,height:50,rx:10,fill:on?C.brand2:C.border,opacity:on?0.95:0.4}));
        const tx=svgEl('text',{x:x+59,y:100,'text-anchor':'middle',fill:on?'#fff':C.muted,'font-size':'11','font-family':'system-ui'});
        tx.textContent=t.slice(0,8); s.appendChild(tx);
        if(idx<steps.length-1) s.appendChild(svgEl('line',{x1:x+118,y1:95,x2:x+125,y2:95,stroke:C.muted,'stroke-width':'2'}));
      });
      note(stage,'对应 PaLM-E / RT-2 / VLA 教学主干（示意）。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.actionChunk=function(mount){
    const {root,controls,stage}=cardShell(
      '动作分块频率','怎么看：高频动作更跟手但序列更长；低频分块更稳、更短。','示意 · L19'
    );
    const hz=rangeControl(controls,'控制频率 (Hz)',1,50,1,10,draw);
    const sec=rangeControl(controls,'任务时长 (s)',1,30,1,8,draw);
    function draw(){
      const n=hz.get()*sec.get();
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const S=sec.get();
      const pts=[];
      for(let h=1;h<=50;h++) pts.push([h, Math.min(1,(h*S)/1500)]);
      const y=Math.min(1,n/1500);
      drawLineChart(ctx,{
        xMin:1,xMax:50,yMin:0,yMax:1,
        xTitle:'控制频率 (Hz)', yTitle:'相对序列长度',
        yFormat:v=>v.toFixed(1),
        series:[{pts,color:C.brand,width:2.6}],
        legend:[{label:`时长 ${S}s`,color:C.brand}],
        marker:{x:hz.get(),y:y,color:C.brand2,label:`${n} 步`}
      });
      metrics(stage,[['动作步数',String(n)],['相对序列长',y.toFixed(3)]]);
      note(stage,'示意：步数≈频率×时长；真实 VLA 还有动作词元离散化与开环分块。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.scalingLaw=function(mount){
    const {root,controls,stage}=cardShell(
      '缩放定律：损失随算力下降','怎么看：拖动训练算力（对数），测试损失沿幂律下降。','L01'
    );
    const cC=rangeControl(controls,'log10 训练算力',1,6,0.1,3.5,draw);
    function draw(){
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const pts=[];
      for(let i=0;i<=60;i++){
        const logc=1+i*(5/60);
        const loss=2.2*Math.pow(10,-0.18*logc);
        pts.push([Math.pow(10,logc), loss]);
      }
      const logc=cC.get();
      const loss=2.2*Math.pow(10,-0.18*logc);
      drawLineChart(ctx,{
        xMin:10,xMax:1e6,yMin:0,yMax:2.4,logX:true,
        xTitle:'训练算力（对数示意）', yTitle:'测试损失',
        xFormat:v=>'1e'+Math.round(Math.log10(v)),
        yFormat:v=>v.toFixed(1),
        series:[{pts,color:C.brand,width:2.6}],
        legend:[{label:'L ∝ C^(−α) 示意',color:C.brand}],
        marker:{x:Math.pow(10,logc),y:loss,color:C.brand2,label:`L=${loss.toFixed(3)}`}
      });
      metrics(stage,[['log10 算力',logc.toFixed(1)],['示意损失',loss.toFixed(3)]]);
      note(stage,'示意幂律，非 Kaplan/Chinchilla 拟合系数。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.computeMix=function(mount){
    const {root,controls,stage}=cardShell(
      '算力分配：预训练 / 后训练 / 测试时','怎么看：三轴预算此消彼长。课程主线是：在强基座之上把测试时与编排用好。','L01'
    );
    const pre=rangeControl(controls,'预训练',0,100,1,70,sync);
    const post=rangeControl(controls,'后训练',0,100,1,15,sync);
    const test=rangeControl(controls,'测试时',0,100,1,15,sync);
    function sync(){draw();}
    function draw(){
      let a=pre.get(),b=post.get(),c=test.get(); const s=a+b+c||1; a/=s;b/=s;c/=s;
      clearStage(stage);
      const wrap=el('div',{className:'iv-bars'});
      const C=colors();
      [['预训练',a,C.brand],['后训练',b,C.brand2],['测试时',c,C.ok]].forEach(([lab,v,col])=>{
        const bar=el('div',{className:'iv-bar'});
        const iel=el('i'); iel.style.height=(v*150)+'px'; iel.style.background=col;
        bar.appendChild(iel); bar.appendChild(el('b',{text:(v*100).toFixed(0)+'%'})); bar.appendChild(el('b',{text:lab}));
        wrap.appendChild(bar);
      });
      stage.insertBefore(wrap, stage.querySelector('.iv-note')||null);
      note(stage,'比例已归一化。示意预算分配，便于讨论「把算力花在哪」。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.agentStack=function(mount){
    const {root,controls,stage}=cardShell(
      '四层计算地图','怎么看：预训练 → 后训练 → 测试时算力 → 智能体编排。步进点亮层级。','L01'
    );
    const layers=['预训练（数据·参数·算力）','后训练（指令·偏好）','测试时（采样·搜索·推理）','编排（工具·验证·停止）'];
    let i=2;
    btnRow(controls,[['点亮下一层',()=>{i=Math.min(layers.length,i+1);draw();}],['重置',()=>{i=2;draw();}]]);
    function draw(){
      const s=svgStage(stage,640,230);
      const C=colors();
      const cols=[C.brand,C.brand2,C.ok,C.warn];
      layers.forEach((lab,idx)=>{
        const y=30+idx*48;
        const on=idx<i;
        s.appendChild(svgEl('rect',{x:80,y:y,width:480,height:40,rx:10,fill:on?cols[idx]:C.border,opacity:on?0.9:0.35}));
        const t=svgEl('text',{x:320,y:y+26,'text-anchor':'middle',fill:on?'#fff':C.muted,'font-size':'13','font-family':'system-ui'});
        t.textContent=lab; s.appendChild(t);
      });
      note(stage,i===0?'从底层点亮到编排层。':'当前点亮至：'+layers[i-1]);
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.courseMap=function(mount){
    const {root,controls,stage}=cardShell(
      '课程能力地图','怎么看：点选阶段，回顾本课覆盖的能力轴。','L20'
    );
    const axes=[
      ['TTC','测试时算力'],['Verify','稳健验证'],['Tools','工具反馈'],
      ['Search','搜索规划'],['RL','训练缩放'],['Evolve','开放进化'],
      ['SE','软件工程'],['Memory','记忆'],['Eval','长程评测']
    ];
    let sel=0;
    btnRow(controls, axes.map((a,idx)=>[a[0],()=>{sel=idx;draw();}]));
    function draw(){
      const s=svgStage(stage,640,240);
      const C=colors();
      axes.forEach((a,idx)=>{
        const ang=-Math.PI/2+idx*(Math.PI*2/axes.length);
        const x=320+90*Math.cos(ang), y=120+78*Math.sin(ang);
        const on=idx===sel;
        s.appendChild(svgEl('circle',{cx:x,cy:y,r:on?22:16,fill:on?C.brand:C.border}));
        const t=svgEl('text',{x:x,y:y+4,'text-anchor':'middle',fill:on?'#fff':C.muted,'font-size':'9','font-family':'system-ui'});
        t.textContent=a[0]; s.appendChild(t);
      });
      note(stage,'当前：'+axes[sel][1]+' — 回看对应讲次并把作业落到可复现实验。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.openAxes=function(mount){
    const {root,controls,stage}=cardShell(
      '开放研究轴','怎么看：拖动三条轴，组成你的后续研究方向画像（示意）。','L20'
    );
    const a=rangeControl(controls,'可靠验证',0,10,1,7,draw);
    const b=rangeControl(controls,'长期记忆',0,10,1,5,draw);
    const c=rangeControl(controls,'开放进化',0,10,1,6,draw);
    function draw(){
      const s=svgStage(stage,640,260);
      const C=colors();
      const vals=[a.get(),b.get(),c.get()];
      const labels=['可靠验证','长期记忆','开放进化'];
      const cx=320,cy=130,R=90;
      for(let i=0;i<3;i++){
        const ang=-Math.PI/2+i*(Math.PI*2/3);
        const x=cx+R*Math.cos(ang), y=cy+R*Math.sin(ang);
        s.appendChild(svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:C.muted,'stroke-width':'1'}));
        const lab=svgEl('text',{x:x,y:y+(i===0?-8:14),'text-anchor':'middle',fill:C.text,'font-size':'12','font-family':'system-ui'});
        lab.textContent=labels[i]; s.appendChild(lab);
      }
      const pts=vals.map((v,i)=>{
        const ang=-Math.PI/2+i*(Math.PI*2/3);
        return [cx+(R*v/10)*Math.cos(ang), cy+(R*v/10)*Math.sin(ang)];
      });
      const path=pts.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' ')+' Z';
      s.appendChild(svgEl('path',{d:path,fill:C.brand,opacity:'0.35',stroke:C.brand,'stroke-width':'2'}));
      note(stage,'自画像示意，便于规划毕业项目/后续阅读，不代表评分。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.rlefLoop=function(mount){
    const {root,controls,stage}=cardShell(
      '代码执行反馈环（RLEF）','怎么看：生成代码 → 执行 → 用报错/测试作奖励或提示 → 再生成。','L04'
    );
    const steps=['生成候选代码','沙箱执行','解析 stdout/err/测试','构造反馈 / 奖励','更新策略或重写'];
    let i=2;
    btnRow(controls,[['下一步',()=>{i=Math.min(steps.length,i+1);draw();}],['重置',()=>{i=2;draw();}]]);
    function draw(){
      clearStage(stage);
      const ol=el('ol',{className:'iv-log'});
      for(let k=0;k<i;k++) ol.appendChild(el('li',{className:k%2?'role-Observation':'role-Action',text:steps[k]}));
      stage.insertBefore(ol, stage.querySelector('.iv-note')||null);
      note(stage,'执行反馈把「可运行性」变成可优化信号，是工具学习的关键。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.searchCoverage=function(mount){
    const {root,controls,stage}=cardShell(
      '搜索覆盖 vs 预算','怎么看：扩大搜索预算提高覆盖，但收益递减。','L07/L08'
    );
    const bC=rangeControl(controls,'搜索预算（对数）',1,6,0.1,3.5,draw);
    const aC=rangeControl(controls,'难度 α',0.2,1.2,0.05,0.55,draw);
    function draw(){
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const B=Math.pow(10,bC.get()), a=aC.get();
      const pts=[];
      for(let i=0;i<=60;i++){
        const logb=1+i*5/60; const b=Math.pow(10,logb);
        pts.push([b, 1-Math.pow(b,-a)]);
      }
      const cov=1-Math.pow(B,-a);
      drawLineChart(ctx,{
        xMin:10,xMax:1e6,yMin:0,yMax:1,logX:true,
        xTitle:'搜索预算（对数）', yTitle:'覆盖率',
        xFormat:v=>'1e'+Math.round(Math.log10(v)),
        yFormat:v=>(v*100).toFixed(0)+'%',
        series:[{pts,color:C.brand,width:2.6}],
        legend:[{label:`1−B^(−α), α=${a.toFixed(2)}`,color:C.brand}],
        marker:{x:B,y:cov,color:C.brand2,label:`${(cov*100).toFixed(1)}%`}
      });
      metrics(stage,[['预算','1e'+bC.get().toFixed(1)],['覆盖',cov.toFixed(3)]]);
      note(stage,'示意幂律覆盖；对应 AlphaCode / AlphaEvolve 量级直觉。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.patchFunnel=function(mount){
    const {root,controls,stage}=cardShell(
      '补丁漏斗','怎么看：从候选补丁到最终合并，层层过滤。拖动每层通过率。','L13'
    );
    const gC=rangeControl(controls,'生成候选',10,200,5,80,draw);
    const tC=rangeControl(controls,'测试通过率',0.05,0.6,0.01,0.25,draw);
    const rC=rangeControl(controls,'评审通过率',0.2,0.9,0.01,0.5,draw);
    function draw(){
      const g=gC.get(), t=Math.round(g*tC.get()), r=Math.round(t*rC.get());
      const s=svgStage(stage,640,220);
      const C=colors();
      const layers=[['候选',g,560],['测试通过',t,360],['评审/合并',r,200]];
      layers.forEach((L,i)=>{
        const y=30+i*60; const w=L[2]; const x=(640-w)/2;
        s.appendChild(svgEl('rect',{x:x,y:y,width:w,height:44,rx:10,fill:i===2?C.ok:C.brand,opacity:0.85-i*0.15}));
        const tx=svgEl('text',{x:320,y:y+28,'text-anchor':'middle',fill:'#fff','font-size':'13','font-family':'system-ui'});
        tx.textContent=`${L[0]} · ${L[1]}`; s.appendChild(tx);
      });
      note(stage,'示意漏斗，便于理解 SE 智能体为何要「多采样 + 强测试」。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.geoSearchLoop=function(mount){
    const {root,controls,stage}=cardShell(
      '几何：神经引导 + 符号演绎','怎么看：AlphaGeometry 类系统在建议构造与符号引擎之间交替。','L16'
    );
    const steps=['读题 / 形式化','符号引擎推演','卡住 → 神经建议辅助线','写入新构造','再推演直至证毕或超时'];
    let i=2;
    btnRow(controls,[['下一步',()=>{i=Math.min(steps.length,i+1);draw();}],['重置',()=>{i=2;draw();}]]);
    function draw(){
      clearStage(stage);
      const ol=el('ol',{className:'iv-log'});
      for(let k=0;k<i;k++) ol.appendChild(el('li',{className:k===2?'role-Action':'role-Thought',text:steps[k]}));
      stage.insertBefore(ol, stage.querySelector('.iv-note')||null);
      note(stage,'教学示意；AG2 求解率与语言覆盖见上方已核实图。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  W.cacheBlend=function(mount){
    const {root,controls,stage}=cardShell(
      'CacheBlend 命中权衡','怎么看：提高前缀命中率可降低预填延迟（示意线性权衡）。','L14'
    );
    const hC=rangeControl(controls,'前缀命中率',0,1,0.01,0.55,draw);
    function draw(){
      const h=hC.get();
      const latency=1-0.7*h;
      const c=canvas(stage,760,280); const ctx=c.getContext('2d'); const C=colors();
      const pts=[];
      for(let i=0;i<=100;i++){ const x=i/100; pts.push([x,1-0.7*x]); }
      drawLineChart(ctx,{
        xMin:0,xMax:1,yMin:0,yMax:1,
        xTitle:'前缀命中率', yTitle:'相对预填延迟',
        yFormat:v=>v.toFixed(1),
        series:[{pts,color:C.ok,width:2.6}],
        legend:[{label:'延迟 ≈ 1−0.7·命中率',color:C.ok}],
        marker:{x:h,y:latency,color:C.brand2,label:`延迟 ${latency.toFixed(2)}`}
      });
      metrics(stage,[['命中率',(h*100).toFixed(0)+'%'],['相对预填延迟',latency.toFixed(2)]]);
      note(stage,'示意权衡；具体数字依赖实现与前缀分布。');
    }
    root._ivDraw=draw; mount.appendChild(root); return root;
  };

  // —— per-lecture injection plan ——
  // match: RegExp on details>summary text; where: 'append'|'after-first-figure'
  const PLAN={
    L01:[
      {match:/预训练缩放|学习路径|导言/, widget:'scalingLaw'},
      {match:/预训练缩放/, widget:'computeMix'},
      {match:/后训练对齐|从LLM到智能体|智能体工作流/, widget:'agentStack'},
    ],
    L02:[
      {match:/测试时算力与采样|学习路径|导言/, widget:'passAtK'},
      {match:/测试时算力与采样/, widget:'majorityVote'},
      {match:/搜索验证与编排/, widget:'bonVerifier'},
      {match:/Snell|测试时算力最优缩放/, widget:'bonVerifier'},
      {match:/Laws|幂律/, widget:'passAtK'},
    ],
    L03:[
      {match:/为何需要稳健验证|学习路径|导言/, widget:'bonVerifier'},
      {match:/逐步验证|PRM/, widget:'ormPrm'},
      {match:/自动标注|Weaver|弱监督/, widget:'verifierThreshold'},
    ],
    L04:[
      {match:/工具调用|ReAct循环|学习路径|导言/, widget:'reactStepper'},
      {match:/代码反馈|RLEF/, widget:'rlefLoop'},
      {match:/ReAct优劣|执行反馈/, widget:'toolCompound'},
    ],
    L05:[
      {match:/多步规划|搜索树|学习路径|导言/, widget:'mctsTree'},
      {match:/并行反思|落地/, widget:'beamSearch'},
      {match:/SWiRL|SPRINT/, widget:'toolCompound'},
      {match:/ADaPT/, widget:'beamSearch'},
      {match:/AB-MCTS|Wider or Deeper/, widget:'mctsTree'},
    ],
    L06:[
      {match:/STaR|学习路径|导言/, widget:'starLoop'},
      {match:/GRPO|优缺点/, widget:'grpoAdvantage'},
      {match:/DAPO|过长惩罚/, widget:'reliabilityCompound'},
    ],
    L07:[
      {match:/开放式进化总览|导言/, widget:'evoLoop'},
      {match:/ADAS/, widget:'adasBars'},
      {match:/AI Scientist/, widget:'starLoop', opts:{title:'AI Scientist 科研闭环',tag:'L07',how:'怎么看：选题 → 实验 → 写稿 → 审稿反馈。步进查看（示意）。',phases:['提出想法 / 假设','跑实验与作图','撰写论文草稿','自动审稿与修订']}},
      {match:/AlphaEvolve/, widget:'searchCoverage'},
    ],
    L08:[
      {match:/程序搜索|AlphaCode ·|学习路径|导言/, widget:'alphacodePipeline'},
      {match:/AlphaCode评测|AlphaCode2/, widget:'searchCoverage'},
      {match:/Search-o1/, widget:'beamSearch'},
    ],
    L09:[
      {match:/信号迁移|导言|学习路径/, widget:'instructPref'},
      {match:/SFT与RLHF/, widget:'rlhfPipeline'},
      {match:/RLVR|Agent/, widget:'toolCompound'},
    ],
    L10:[{match:/导言|学习路径|期中|展示/, widget:'midtermRubric', opts:{title:'期中展示清单（一）'}}],
    L11:[{match:/导言|学习路径|期中|展示/, widget:'midtermRubric', opts:{title:'期中展示清单（二）'}}],
    L12:[{match:/导言|学习路径|期中|展示/, widget:'midtermRubric', opts:{title:'期中展示清单（三）'}}],
    L13:[
      {match:/SE智能体|导言|学习路径/, widget:'sweLoop'},
      {match:/CodeMonkeys/, widget:'resolveAttempts'},
      {match:/KernelBench|ASI/, widget:'patchFunnel'},
    ],
    L14:[
      {match:/记忆形态|导言|学习路径/, widget:'memoryTiers'},
      {match:/Cartridges/, widget:'contextTradeoff'},
      {match:/CacheBlend/, widget:'cacheBlend'},
    ],
    L15:[
      {match:/推理范式|导言|学习路径/, widget:'selfConsistency'},
      {match:/Least-to-Most/, widget:'leastToMost'},
      {match:/一致性与收束/, widget:'majorityVote'},
    ],
    L16:[
      {match:/数学推理|导言|学习路径/, widget:'imoScore'},
      {match:/AlphaGeometry/, widget:'ag2Solve'},
      {match:/AlphaProof|Deep Think/, widget:'geoSearchLoop'},
    ],
    L17:[
      {match:/评测困境|学习路径|导言/, widget:'horizonDecay'},
      {match:/长程任务|GDPval/, widget:'reliabilityCompound'},
      {match:/失败模式|职业偏好|三维评测/, widget:'majorityVote'},
    ],
    L18:[
      {match:/Decision Transformer|导言|学习路径|自治/, widget:'decisionTransformer'},
      {match:/Algorithm Distillation|可靠性/, widget:'algoDistill'},
    ],
    L19:[
      {match:/具身|导言|学习路径/, widget:'vlaPipeline'},
      {match:/PaLM-E|RT-2|对照/, widget:'actionChunk'},
    ],
    L20:[
      {match:/开放问题|学习路径|导言/, widget:'courseMap'},
      {match:/课程回顾|自提任务/, widget:'openAxes'},
    ],
  };

  function findSections(host){
    const details=[...host.querySelectorAll('details.section')];
    const closeReads=[...host.querySelectorAll('h2')].filter(h=>/论文精读|close-read/i.test(h.textContent)).map(h=>({isCloseRead:true,summary:h.textContent.trim(),body:h}));
    return [...details,...closeReads];
  }
  function sectionBody(sec){
    if(sec.isCloseRead) return sec.body;
    return sec.querySelector('.body') || sec;
  }
  function sectionTitle(sec){
    if(sec.isCloseRead) return sec.summary;
    return (sec.querySelector('summary')?.textContent||'').trim();
  }

  function inject(lectureId, host){
    if(!host) return;
    const plan=PLAN[lectureId]||[];
    if(!plan.length) return;
    const sections=findSections(host);
    const used=new Set();
    const mounted=[];
    plan.forEach(item=>{
      const key=item.widget+(item.opts?JSON.stringify(item.opts):'');
      // allow same widget type twice if different sections; block exact duplicate mount keys per section
      let target=null;
      for(const d of sections){
        const title=sectionTitle(d);
        if(item.match.test(title)){
          const idMark=title+'::'+item.widget;
          if(used.has(idMark) && !item.onceExtra) continue;
          used.add(idMark);
          target=sectionBody(d);
          break;
        }
      }
      if(!target){
        // fallback: first section body
        if(sections[0]) target=sectionBody(sections[0]);
      }
      if(!target) return;
      const isCloseRead=target.isCloseRead||target.tagName==='H2';
      // avoid duplicate identical widget already in this body
      if(!isCloseRead && target.querySelector(`[data-iv-widget="${item.widget}"]`) && !item.onceExtra){
        if(item.widget==='grpoAdvantage' && item.onceExtra) return;
        return;
      }
      const holder=el('div',{'data-iv-widget':item.widget});
      if(isCloseRead){
        target.insertAdjacentElement('afterend', holder);
      } else {
        // place after first figure if any, else append
        const fig=target.querySelector('.authored-figure, .figure-row, figure');
        if(fig && fig.parentNode===target){
          fig.insertAdjacentElement('afterend', holder);
        } else {
          // after first paragraph
          const p=target.querySelector('p');
          if(p) p.insertAdjacentElement('afterend', holder);
          else target.appendChild(holder);
        }
      }
      const fn=W[item.widget];
      if(!fn){console.warn('missing widget',item.widget);return;}
      const card=fn(holder, item.opts||{});
      card.setAttribute('data-iv-widget', item.widget);
      mounted.push(card);
    });
    lazyWatch(mounted);
    // theme redraw
    const btn=document.getElementById('themeToggle');
    if(btn && !btn._ivHooked){
      btn._ivHooked=true;
      btn.addEventListener('click',()=>setTimeout(()=>{
        document.querySelectorAll('.inline-viz').forEach(n=>{ if(n._ivDraw && n.getAttribute('data-iv-ready')==='1') try{n._ivDraw();}catch(e){} });
      },30));
    }
  }

  function lazyWatch(nodes){
    if(!nodes.length) return;
    if(!('IntersectionObserver' in window)){
      nodes.forEach(n=>{ n.setAttribute('data-iv-ready','1'); try{n._ivDraw&&n._ivDraw();}catch(e){} });
      return;
    }
    const io=new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          const n=en.target;
          if(n.getAttribute('data-iv-ready')==='1') return;
          n.setAttribute('data-iv-ready','1');
          try{n._ivDraw&&n._ivDraw();}catch(e){console.warn(e);}
          io.unobserve(n);
        }
      });
    },{rootMargin:'80px',threshold:0.05});
    nodes.forEach(n=>io.observe(n));
  }

  window.CS329A_VIZ={widgets:W, plan:PLAN, inject, colors};
})();


