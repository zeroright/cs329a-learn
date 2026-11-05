# CS329A 自学教学网站

纯静态站点：用浏览器打开 `index.html`，或在仓库根目录起一个静态服务器。讲次正文在 `data/lectures/L01.js` … `L20.js`，每个讲次页只加载自己的那一篇。

推荐：

```bash
cd cs329a-learn
python3 -m http.server 8765
```

然后访问 http://127.0.0.1:8765/

## 学习体验

- 首页选择系统学习 / 核心速览 / 产品与交付，路线页显示先修与阶段成果。
- `learning-lab.html` 提供采样与验证、工具反馈、GRPO 优势三个自编交互实验，无需 API。
- 讲次页通过学习指南进入阅读、实验、自测和实践；阅读进度与阶段交付物分别记录在浏览器中。
- 改动依据、来源差异和验证范围见 [学习体验改进记录](docs/learning-experience.md)。
- 运行检查：`node --test tests/learning.test.cjs`（仅需 Node 内置模块）。

- 官方作业与课表来源：https://cs329a.stanford.edu/
- 自编练习/自测/闪卡/Capstone 均标注「自编」
- Pyodide 代码运行需能访问 jsDelivr CDN（本地 server 模式）


## 幻灯配图来源与版权

本站讲次页中的幻灯缩略图来自 **Stanford CS329A** 公开课程录像的清洗截帧（v5 去重 + web 压缩，约 ≤1024px WebP），仅供个人学习与复习。

- 版权归原作者 / 授课方（Stanford CS329A）。
- 每张配图附信用语「Stanford CS329A 课程录像截图 · 版权归原作者」，并链回对应视频时间戳。
- 请勿二次分发为商业素材；如需正式课件请以官方渠道为准。
