
(function(){
  function $(id){return document.getElementById(id)}
  function bindRange(id, vid){const el=$(id),v=$(vid); const u=()=>{v.textContent=Number(el.value).toFixed(el.step<1?2:0);}; el.addEventListener('input',()=>{u();drawAll();}); u(); return el;}
  const pPass=bindRange('pPass','pPassV'), kMax=bindRange('kMax','kMaxV'), alpha=bindRange('alpha','alphaV');
  const bonN=bindRange('bonN','bonNV'), bonBase=bindRange('bonBase','bonBaseV'), bonV=bindRange('bonV','bonVV');
  const mctsB=bindRange('mctsB','mctsBV'), mctsD=bindRange('mctsD','mctsDV'), mctsS=bindRange('mctsS','mctsSV');

  function passAtK(p,k){ return 1-Math.pow(1-p,k); }
  function drawPass(){
    const c=$('cPass'), ctx=c.getContext('2d');
    ctx.clearRect(0,0,c.width,c.height);
    const W=c.width,H=c.height,pad=40;
    ctx.strokeStyle='#888';ctx.beginPath();ctx.moveTo(pad,H-pad);ctx.lineTo(W-pad,H-pad);ctx.lineTo(W-pad,pad);ctx.stroke();
    const p=+pPass.value, K=+kMax.value, a=+alpha.value;
    ctx.beginPath();
    for(let i=1;i<=K;i++){
      const x=pad+(W-2*pad)*Math.log(i)/Math.log(K||2);
      const y=H-pad-(H-2*pad)*passAtK(p,i);
      i===1?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.stroke();
    // coverage power-law sketch (normalized)
    ctx.beginPath();
    for(let i=1;i<=K;i++){
      const cov=Math.pow(i,-a);
      const x=pad+(W-2*pad)*Math.log(i)/Math.log(K||2);
      const y=H-pad-(H-2*pad)*Math.min(1,cov/Math.pow(1,-a));
      i===1?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle='#f59e0b';ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
    $('passNote').textContent=`pass@${K} ≈ ${passAtK(p,K).toFixed(3)}（蓝）；橙虚线为覆盖率幂律示意 N^(-α)，非经验拟合。`;
  }

  function drawBon(){
    const c=$('cBon'), ctx=c.getContext('2d');
    ctx.clearRect(0,0,c.width,c.height);
    const N=+bonN.value, base=+bonBase.value, v=+bonV.value;
    const W=c.width,H=c.height,pad=40;
    ctx.strokeStyle='#888';ctx.beginPath();ctx.moveTo(pad,H-pad);ctx.lineTo(W-pad,H-pad);ctx.lineTo(W-pad,pad);ctx.stroke();
    ctx.beginPath();
    for(let n=1;n<=N;n++){
      // toy: oracle BoN ≈ 1-(1-base)^n; noisy verifier mixes toward random
      const oracle=1-Math.pow(1-base,n);
      const score=oracle*v + (1-v)*(1/Math.max(2,n)); // weak prior
      const x=pad+(W-2*pad)*(n-1)/Math.max(1,N-1);
      const y=H-pad-(H-2*pad)*score;
      n===1?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle='#10b981';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#aaa';ctx.font='12px sans-serif';
    ctx.fillText('示意：verifier 精度越高，曲线越接近 oracle Best-of-N', pad, 24);
  }

  let sim=0;
  function drawMcts(){
    const svg=$('mctsSvg'); while(svg.firstChild) svg.removeChild(svg.firstChild);
    const B=+mctsB.value, D=+mctsD.value; sim=Math.min(sim, +mctsS.value);
    const NS='http://www.w3.org/2000/svg';
    function node(x,y,r,fill,label){
      const c=document.createElementNS(NS,'circle'); c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',r);c.setAttribute('fill',fill);svg.appendChild(c);
      const t=document.createElementNS(NS,'text'); t.setAttribute('x',x);t.setAttribute('y',y+4);t.setAttribute('text-anchor','middle');t.setAttribute('fill','#fff');t.setAttribute('font-size','10');t.textContent=label;svg.appendChild(t);
    }
    function edge(x1,y1,x2,y2){const l=document.createElementNS(NS,'line');l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);l.setAttribute('stroke','#666');svg.appendChild(l);}
    // build full tree coords
    const levels=[[{x:320,y:40,id:'0',visits:0}]];
    let idc=1;
    for(let d=0;d<D;d++){
      const next=[];
      const parents=levels[d];
      const nChild=parents.length*B;
      parents.forEach((p,pi)=>{
        for(let b=0;b<B;b++){
          const idx=pi*B+b;
          const x=40+ (560)*(idx+0.5)/nChild;
          const y=40+(d+1)*70;
          edge(p.x,p.y,x,y);
          next.push({x,y,id:String(idc++),visits:0,parent:p});
        }
      });
      levels.push(next);
    }
    // simulate naive UCT-ish visits
    const leaves=levels[levels.length-1];
    for(let s=0;s<sim;s++){
      const pick=leaves[s % leaves.length];
      let cur=pick; while(cur){cur.visits=(cur.visits||0)+1; cur=cur.parent;}
    }
    levels.flat().forEach(n=>{
      const heat=Math.min(1,(n.visits||0)/Math.max(1,sim));
      const col=`rgb(${Math.floor(40+80*heat)},${Math.floor(80+140*heat)},${Math.floor(200-80*heat)})`;
      node(n.x,n.y,14+6*heat,col,String(n.visits||0));
    });
    $('mctsNote').textContent=`已模拟 ${sim} 次；圆内数字=访问次数（教学示意，非完整 UCT）。`;
  }

  const reactSteps=[
    {role:'Thought', text:'需要查清 pass@k 的无偏估计公式。'},
    {role:'Action', text:'search("Chen et al pass@k unbiased estimator")'},
    {role:'Observation', text:'找到 HumanEval 论文中的组合公式。'},
    {role:'Thought', text:'用代码验证小样本无偏性。'},
    {role:'Action', text:'run_python(pass_at_k(n=10,c=3,k=5))'},
    {role:'Observation', text:'得到约 0.9167，与手算一致。'},
    {role:'Answer', text:'给出公式与实现链接。'},
  ];
  let ri=0;
  function drawReact(){
    const log=$('reactLog'); log.innerHTML='';
    for(let i=0;i<ri;i++){
      const s=reactSteps[i];
      const li=document.createElement('li');
      li.textContent=`[${s.role}] ${s.text}`;
      log.appendChild(li);
    }
    $('reactState').textContent=`步骤 ${ri}/${reactSteps.length}`;
  }

  $('mctsStep').onclick=()=>{sim=Math.min(+mctsS.value, sim+1); drawMcts();};
  $('mctsReset').onclick=()=>{sim=0; drawMcts();};
  $('reactNext').onclick=()=>{ri=Math.min(reactSteps.length, ri+1); drawReact();};
  $('reactReset').onclick=()=>{ri=0; drawReact();};

  function drawAll(){ drawPass(); drawBon(); drawMcts(); }
  drawAll(); drawReact();
})();
