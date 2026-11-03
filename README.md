# CS329A 自学站（zeroright/cs329a-learn）

Stanford CS329A（Self-Improving AI Agents，Autumn 2025）的**浏览器可打开**交互自学站：讲次全文、论文库、测验/闪卡、Pyodide 代码场、进度追踪、**详细学习路径**、方法流程图，以及作业源码对照复现。

> 官方课程：https://cs329a.stanford.edu/  
> 本站为社区自学镜像与【自编】练习合集，**不是**斯坦福官方站点。

## 在线访问（GitHub Pages）

启用仓库 Pages 后，项目站地址形如：

`https://zeroright.github.io/cs329a-learn/`

（本仓库以**根目录静态文件**部署；已含 `.nojekyll` 与 `404.html`。）

## 本地预览

任意静态服务器即可。若要模拟 Pages 的子路径 `/cs329a-learn/`：

```bash
mkdir -p /tmp/cs329a-serve/cs329a-learn
cp -a ./ /tmp/cs329a-serve/cs329a-learn/
cd /tmp/cs329a-serve && python3 -m http.server 8765
# 打开 http://127.0.0.1:8765/cs329a-learn/
```

或直接在仓库根：

```bash
python3 -m http.server 8765
# http://127.0.0.1:8765/
```

## 主要页面

| 页面 | 说明 |
|------|------|
| `index.html` | 首页、知识地图、总览 |
| `learning-path.html` | 六阶段路线 + 2 周 / 8 周 / PM·B2B 轨 + 清单 |
| `lectures/*.html` | 17 讲教案、测验、闪卡、方法流程图 |
| `homework.html` | 作业复现 walkthrough |
| `homework/hw1/` `hw3/` | 官方公开作业镜像（见许可证） |
| `homework/hw2/` | **仅说明**（上游无 LICENSE，不复制源码） |
| `repro/hw1..3/` | 【自编】可运行复现脚手架 |
| `playground.html` | Pyodide 在线跑示例 |
| `papers.html` / `assignments.html` / `progress.html` / `search.html` | 论文、项目、进度、搜索 |

## 作业许可证

| 作业 | 上游 | 许可证 | 本站 |
|------|------|--------|------|
| HW1 | [cs329a-homework1-fall2025-public](https://github.com/stanford-cs329a/cs329a-homework1-fall2025-public) | MIT | 已 vendor + `ATTRIBUTION.md` |
| HW2 | [cs329a-homework2-fall2025-public](https://github.com/stanford-cs329a/cs329a-homework2-fall2025-public) | **未声明** | **不复制**；请自行 clone + 用 `repro/hw2/` |
| HW3 | [cs329a-homework3-fall2025-public](https://github.com/stanford-cs329a/cs329a-homework3-fall2025-public) | Apache-2.0 | 已 vendor + `ATTRIBUTION.md` |

【自编】复现（无需付费 API）：

```bash
python3 repro/hw1/run_majority_bon.py
python3 repro/hw2/run_pass_at_k.py
python3 repro/hw3/run_deep_research_mini.py
```

## 部署

推送 `main` 后，`.github/workflows/pages.yml` 使用 `actions/upload-pages-artifact` + `actions/deploy-pages` 发布。请在仓库 Settings → Pages → Source 选择 **GitHub Actions**。

## 标注约定

- 【官方】：来自课表 / stanford-cs329a 公开仓库  
- 【自编】：本站教学脚手架与练习，非课程评分项
