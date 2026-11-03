(function(){
  function drawKnowledgeGraph(svg, nodes, edges, base='lectures/'){
    if(!svg) return;
    const W=svg.clientWidth||900, H=svg.clientHeight||460;
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    svg.innerHTML='';
    // layout: course order along a snake
    const n=nodes.length; const cols=6; const gapX=W/(cols+0.5); const gapY=H/4.2;
    const pos={};
    nodes.forEach((node,i)=>{
      const row=Math.floor(i/cols), col=i%cols;
      const x=(row%2===0?col+1:cols-col)*gapX;
      const y=40+row*gapY+30;
      pos[node.id]={x,y,node};
    });
    edges.forEach(e=>{
      const a=pos[e[0]], b=pos[e[1]]; if(!a||!b) return;
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',a.x); line.setAttribute('y1',a.y);
      line.setAttribute('x2',b.x); line.setAttribute('y2',b.y);
      line.setAttribute('stroke', e[2]==='dash' ? '#94a3b8' : '#60a5fa');
      line.setAttribute('stroke-width','2');
      if(e[2]==='dash') line.setAttribute('stroke-dasharray','6 6');
      svg.appendChild(line);
    });
    Object.values(pos).forEach(({x,y,node})=>{
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      g.style.cursor='pointer';
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',22);
      c.setAttribute('fill', node.source==='bilibili'?'#dbeafe':'#ede9fe');
      c.setAttribute('stroke', node.source==='bilibili'?'#2563eb':'#7c3aed');
      c.setAttribute('stroke-width','2');
      const t=document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x',x); t.setAttribute('y',y+5); t.setAttribute('text-anchor','middle');
      t.setAttribute('font-size','11'); t.setAttribute('font-weight','700'); t.textContent=node.id;
      const label=document.createElementNS('http://www.w3.org/2000/svg','text');
      label.setAttribute('x',x); label.setAttribute('y',y+38); label.setAttribute('text-anchor','middle');
      label.setAttribute('font-size','10'); label.setAttribute('fill','#64748b');
      label.textContent=(node.lecture||'') ;
      g.appendChild(c); g.appendChild(t); g.appendChild(label);
      g.onclick=()=>{location.href=base+node.id+'.html';};
      svg.appendChild(g);
    });
  }
  window.drawKnowledgeGraph=drawKnowledgeGraph;
})();
