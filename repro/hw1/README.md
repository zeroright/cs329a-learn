# 【自编】HW1 复现脚手架 — 多数票与 Best-of-N

对应官方 HW1（AIME25 测试时算力）：https://github.com/stanford-cs329a/cs329a-homework1-fall2025-public（MIT，源码镜像见 `../../homework/hw1/`）。

本目录为**自编**教学复现，使用玩具 MATH/AIME 风格小题 + mock LLM，**无需 API Key**。

## 环境
```bash
python3 -m venv .venv && source .venv/bin/activate
# 无额外依赖；标准库即可
python run_majority_bon.py
```

## 子任务对照
| 官方任务 | 本脚手架 |
|----------|----------|
| Zero-shot | `mock_llm` 单次采样 |
| Majority voting | `majority_vote` |
| Best-of-N + generative RM | `best_of_n`（规则 verifier 代替 generative RM） |
| RLEF | 见扩展注释；本文件用「错误反馈再采样」示意 |

相关讲次：P1–P4。
