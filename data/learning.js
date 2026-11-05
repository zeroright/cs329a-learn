/* Editorial learning routes derived from the Notion teaching plan, not Stanford requirements. */
(function () {
  const lessons = {
    L01: ['建立自我改进坐标系', '用自己的例子区分预训练、后训练、推理时算力与 Agent。', [], 'pass_at_k.py'],
    L02: ['把采样预算用对地方', '解释候选覆盖率为什么不等于最终答案准确率。', ['L01'], 'majority_best_of_n.py', 'coverage'],
    L03: ['为答案设计可信验证', '对比结果验证和过程验证，并列出验证器的误判。', ['L02'], 'pass_at_k.py', 'coverage'],
    L04: ['搭出工具反馈闭环', '追踪 Thought → Action → Observation，并设计停止条件。', ['L03'], 'react_loop.py', 'react'],
    L05: ['让多步规划可检查', '比较线性推理与树搜索，记录预算和失败路径。', ['L04'], 'mcts_lats_toy.py'],
    L06: ['读懂组相对优势', '手算一组奖励的优势，区分优势计算与真实策略训练。', ['L03', 'L04'], 'grpo_advantage.py', 'grpo'],
    L07: ['设计可检验的自我改进', '写出候选生成、评估、保留的循环与消融实验。', ['L05', 'L06']],
    L08: ['构建可追溯的深度研究', '将问题分解、检索、融合、精炼连接到引用检查。', ['L04', 'L05'], 'react_loop.py', 'react'],
    L09: ['理解后训练信号', '区分 SFT、偏好反馈和可验证奖励的适用任务。', ['L06']],
    L10: ['确定研究问题', '提交假设、基线、数据与评测计划（自编展示练习）。', ['L03']],
    L11: ['复核实验设计', '说明变量控制、预算与失败样本（自编展示练习）。', ['L10']],
    L12: ['完成期中复盘', '展示阶段结果与下一步实验（自编展示练习）。', ['L11']],
    L13: ['实现软件工程反馈环', '解释定位、编辑、测试如何闭环，并保留失败日志。', ['L04', 'L05'], 'swe_patch_loop.py', 'react'],
    L14: ['管理工作与归档记忆', '比较无记忆基线和检索记忆的准确率、token 成本。', ['L04'], 'memgpt_memory.py'],
    L15: ['比较推理策略', '对同一任务比较 CoT、由易到难与自洽采样。', ['L02', 'L03'], 'majority_best_of_n.py', 'coverage'],
    L16: ['理解形式验证的作用', '区分候选生成与形式验证，并解释可验证领域的边界。', ['L03', 'L15']],
    L17: ['评测完整任务而非单步', '定义成功率、人工介入、耗时与成本，检查长任务失败。', ['L04', 'L05']],
    L18: ['区分序列建模与策略学习', '比较 Decision Transformer 与 Algorithm Distillation 的输入与学习信号。', ['L06']],
    L19: ['理解具身模型的动作接口', '说明感知、语言与动作如何连接，并列出评测约束。', ['L04']],
    L20: ['把开放问题变成实验', '提出可证伪假设，完成基线、消融和诚实的结果报告。', ['L17']]
  };
  const phases = [
    {title:'建立坐标系', ids:['L01'], output:'画出四种改进方式，并解释各自改变什么。', work:'playground.html?ex=pass_at_k.py', label:'运行 pass@k 示例'},
    {title:'采样与验证', ids:['L02','L03','L15'], output:'提交预算—准确率对比与验证器误判案例。', work:'homework.html#hw1', label:'官方 HW1 / 本站复现入口'},
    {title:'工具与多步规划', ids:['L04','L05','L13'], output:'保留生成、执行、验证与修订日志。', work:'homework.html#hw2', label:'官方 HW2 / 本站复现入口'},
    {title:'研究、记忆与评测', ids:['L08','L14','L17'], output:'完成引用检查，报告成功率、步数与成本。', work:'homework.html#hw3', label:'官方 HW3 / 本站复现入口'},
    {title:'训练与自我改进', ids:['L06','L07','L09','L18'], output:'手算优势，写出奖励设计与训练消融方案。', work:'playground.html?ex=grpo_advantage.py', label:'运行自编 GRPO 优势示例'},
    {title:'前沿与研究项目', ids:['L16','L19','L20'], output:'提交一个可复现项目：假设、基线、消融、失败分析。', work:'assignments.html', label:'选择自编 C1–C4 项目'}
  ];
  const tracks = {
    full:{title:'系统学习', duration:'8 周参考节奏', intro:'适合有 Python 基础、希望从机制走向复现的学习者。覆盖 17 个知识讲次；期中展示另列为可选练习。', ids:phases.flatMap(p=>p.ids), outcome:'官方 HW1–HW3 + 一个自编综合项目', phases},
    quick:{title:'核心速览', duration:'2 周参考节奏', intro:'先建立采样、验证、工具与评测四个支点，跑通小型示例后再决定深入方向。', ids:['L01','L02','L03','L04','L05','L08','L17'], outcome:'一条可运行的工具工作流 + 一份评测记录', phases:[
      {title:'理解与选答案',ids:['L01','L02','L03'],output:'区分采样覆盖率与选择准确率。',work:'learning-lab.html?lab=coverage',label:'做采样与验证实验'},
      {title:'行动与反馈',ids:['L04','L05','L08'],output:'运行并解释一个 ReAct / 检索工作流。',work:'playground.html?ex=react_loop.py',label:'运行自编 ReAct 示例'},
      {title:'检验是否有用',ids:['L17'],output:'用 10 个任务报告成功率、引用与成本。',work:'assignments.html',label:'查看自编 C4 项目'}]},
    pm:{title:'产品与交付',duration:'按项目推进',intro:'适合 AI 产品经理与解决方案团队。重点是工作流、验证、成本与验收；训练讲次可按需补读。',ids:['L01','L02','L03','L04','L08','L13','L14','L17','L20'],outcome:'一页方案 + 评测集 + 验收标准与成本上限',phases:[
      {title:'定义价值与边界',ids:['L01','L02','L03'],output:'写出用户任务、失败代价与可检查的成功条件。',work:'learning-lab.html?lab=coverage',label:'理解验证器与预算'},
      {title:'设计交付工作流',ids:['L04','L08','L13','L14'],output:'画出工具接口、记忆、人工介入与停止条件。',work:'homework.html#hw3',label:'参考官方 HW3 工作流'},
      {title:'验收与迭代',ids:['L17','L20'],output:'提交评测样本、验收指标与成本预算。',work:'assignments.html',label:'选择自编业务延伸项目'}]}
  };
  window.LEARNING = {lessons,tracks,midterms:['L10','L11','L12'],
    source(id){return this.midterms.includes(id)?'期中展示 · 自编练习':SITE_META.lectures[id].youtube?'视频教案 · YT / B站':'论文 / 公开材料补读';},
    coverage(p,k){return 1-Math.pow(1-p,k);},
    advantages(rewards){const mean=rewards.reduce((a,b)=>a+b,0)/rewards.length; const sd=Math.sqrt(rewards.reduce((s,r)=>s+(r-mean)**2,0)/rewards.length);return rewards.map(r=>sd?(r-mean)/sd:0);}
  };
})();
