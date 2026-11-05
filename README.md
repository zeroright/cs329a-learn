# CS329A 自学教学网站

纯静态站点：用浏览器打开 `index.html`，或在仓库根目录起一个静态服务器。讲次正文在 `data/lectures/L01.js` … `L20.js`，每个讲次页只加载自己的那一篇。

推荐：

```bash
cd site
python3 -m http.server 8765
```

然后访问 http://127.0.0.1:8765/

- 官方作业与课表来源：https://cs329a.stanford.edu/
- 自编练习/自测/闪卡/Capstone 均标注「自编」
- Pyodide 代码运行需能访问 jsDelivr CDN（本地 server 模式）


## 幻灯配图来源与版权

本站讲次页中的幻灯缩略图来自 **Stanford CS329A** 公开课程录像的清洗截帧（v5 去重 + web 压缩，约 ≤1024px WebP），仅供个人学习与复习。

- 版权归原作者 / 授课方（Stanford CS329A）。
- 每张配图附信用语「Stanford CS329A 课程录像截图 · 版权归原作者」，并链回对应视频时间戳。
- 请勿二次分发为商业素材；如需正式课件请以官方渠道为准。
