(function () {
  'use strict';
  const coverage=(probability,count,selector)=>({coverage:1-Math.pow(1-probability,count),selected:selector*(1-Math.pow(1-probability,count))});
  const advantages=rewards=>{const mean=rewards.reduce((total,value)=>total+value,0)/rewards.length;const std=Math.sqrt(rewards.reduce((total,value)=>total+(value-mean)**2,0)/rewards.length);return rewards.map(value=>std?(value-mean)/std:0);};
  const precision=(base,recall,falsePositive)=>base*recall+(1-base)*falsePositive?base*recall/(base*recall+(1-base)*falsePositive):0;
  const types={sampling:'采样覆盖与答案选择',context:'上下文预算与压缩',loop:'ReAct 工具反馈循环',grpo:'GRPO 组内相对优势',evaluation:'低基率下的评测与误报'};
  function mount(host,data) {
    const title=data.title;
    let selected=/RL|强化|训练/.test(title)?'grpo':/Context|记忆|Memory|上下文/.test(title)?'context':/评估|评测|Evaluation|Safety|安全|Judge/.test(title)?'evaluation':/缩放|搜索|推理/.test(title)?'sampling':'loop';
    host.innerHTML='<h2>动手改变一个条件</h2><p>先预测结果，再调整参数，最后回到论文检查假设。</p><label>概念 <select id="labType">'+Object.entries(types).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')+'</select></label><div id="labExperiment"></div>';
    host.querySelector('select').value=selected;
    host.querySelector('select').onchange=event=>{selected=event.target.value;draw();};
    function range(label,name,min,max,step,value) {return `<label>${label} <output data-value="${name}"></output><input aria-label="${label}" name="${name}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;}
    function draw() {
      const root=host.querySelector('#labExperiment');
      const notes={sampling:'自编机制示意：各次采样独立、单次正确率固定；q 是存在正确候选时选择器选对的条件概率。不是论文实测数据。',context:'自编 token 预算模型；压缩比例不代表信息保真度。把硬约束计入固定保留区，图中只计算容量，不预测任务成功率。',loop:'自编状态机示例，不调用外部模型或执行工具。通过模拟失败观察为什么必须读取 Observation。',grpo:'自编结果奖励示例。用总体标准差计算 A=(r−均值)/标准差；零方差统一显示 0，不代表真实训练的全部损失函数。',evaluation:'自编期望计数：固定 10,000 次决策，计算精确率＝真阳性/(真阳性+假阳性)。假设阈值对应的召回和误报率固定。'};
      if(selected==='loop') {
        root.innerHTML='<label><input type="checkbox" id="failTool">模拟第一次工具失败</label><div class="lab-flow">'+['思考','行动','观察','验证 / 结束'].map((value,index)=>`<span class="lab-step" data-step="${index}">${value}</span>`).join('')+'</div><p class="lab-result" role="status"></p><button id="nextStep" type="button">下一步</button> <button id="resetStep" type="button">重置</button><p class="lab-note">'+notes.loop+'</p>';
        let step=0,round=0;
        const refresh=()=>{root.querySelectorAll('.lab-step').forEach((node,index)=>node.classList.toggle('active',index===step));root.querySelector('[role=status]').textContent=[round?'根据错误调整查询条件。':'目标：核查一个事实。先制定查询。','生成工具调用请求。',root.querySelector('#failTool').checked&&!round?'工具返回错误：没有获得证据，不能宣布完成。':'工具返回可引用的证据。',root.querySelector('#failTool').checked&&!round?'验证未通过：下一步回到思考并重试。':'验证通过：使用证据回答，任务结束。'][step];root.querySelector('#nextStep').disabled=step===3&&(!root.querySelector('#failTool').checked||round>0);};
        root.querySelector('#nextStep').onclick=()=>{if(step===3){round++;step=0;}else step++;refresh();};root.querySelector('#resetStep').onclick=()=>{step=0;round=0;refresh();};root.querySelector('#failTool').onchange=()=>{step=0;round=0;refresh();};refresh();return;
      }
      const controls={sampling:range('单次正确率 p','p',0,1,.01,.2)+range('候选数量 k','k',1,64,1,8)+range('选择器选对概率 q','q',0,1,.01,.7),context:range('上下文窗口（token）','budget',1000,32000,1000,8000)+range('每轮历史（token）','turn',100,2000,100,800)+range('保留轮数','rounds',1,40,1,8)+range('历史压缩保留比例','ratio',.1,1,.1,.5),grpo:'<label>四个候选的奖励（逗号分隔）<input id="rewards" value="0, 0, 1, 1" aria-label="四个候选的奖励"></label><button type="button" id="allEqual">试试全部答对</button>',evaluation:range('不安全行为比例','base',.001,.2,.001,.01)+range('检测召回率','recall',0,1,.01,.9)+range('对安全行为的误报率','falsePositive',0,.2,.001,.01)};
      root.innerHTML='<div class="lab-layout"><div>'+controls[selected]+'</div><div class="lab-result" role="status"></div></div><p class="lab-note">'+notes[selected]+'</p>';
      const calculate=()=>{
        const values={};root.querySelectorAll('input[type=range]').forEach(input=>{values[input.name]=Number(input.value);root.querySelector(`[data-value="${input.name}"]`).textContent=input.value;});
        const output=root.querySelector('[role=status]');
        const bar=(label,value,extra='')=>`<div>${label} <b>${(value*100).toFixed(1)}%</b><div class="lab-bar ${extra}" style="width:${Math.max(0,Math.min(100,value*100))}%"></div></div>`;
        if(selected==='sampling'){const result=coverage(values.p,values.k,values.q);output.innerHTML='<div class="lab-bars">'+bar('候选覆盖率',result.coverage)+bar('最终选对概率',result.selected,'alt')+`</div><p>1 − (1 − ${values.p})^${values.k}</p><p>增加候选不能消除选择器造成的差距。</p>`;}
        if(selected==='context'){const used=1000+values.turn*values.rounds*values.ratio;output.innerHTML=bar('窗口占用',used/values.budget)+`<p>固定保留 1,000 + 历史 ${Math.round(used-1000)} = ${Math.round(used)} token</p><p>${used>values.budget?'超出窗口，需要减少历史或进一步压缩。':'容量允许；仍需核查压缩是否丢失关键信息。'}</p>`;}
        if(selected==='grpo'){const rewards=root.querySelector('#rewards').value.split(',').map(value=>Number(value.trim()));if(rewards.length!==4||rewards.some(value=>!Number.isFinite(value))){output.textContent='请输入四个有限数字，用英文逗号分隔。';return;}const result=advantages(rewards);output.innerHTML=result.map((value,index)=>`<p>候选 ${index+1}：r=${rewards[index]} → A=<b>${value.toFixed(3)}</b></p>`).join('')+'<p>奖励相同时没有组内相对差异，优势为零。</p>';}
        if(selected==='evaluation'){const tp=10000*values.base*values.recall,fp=10000*(1-values.base)*values.falsePositive;output.innerHTML=bar('告警精确率',precision(values.base,values.recall,values.falsePositive))+`<p>真告警 ${tp.toFixed(1)}；误告警 ${fp.toFixed(1)}</p><p>高召回率并不保证每一条告警可信，必须同时看事件的基率。</p>`;}
      };
      root.querySelectorAll('input').forEach(input=>input.addEventListener('input',calculate));
      const equal=root.querySelector('#allEqual');if(equal)equal.onclick=()=>{root.querySelector('#rewards').value='1, 1, 1, 1';calculate();};calculate();
    }
    draw();
  }
  window.ConceptLab={mount,coverage,advantages,precision};
})();
