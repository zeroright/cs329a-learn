# Paper deep-read corrections (2026-11-03 Asia/Shanghai)

Verified with pdftotext / existing PDF text extracts. Never invented numbers.

- **[OK] DeepSeekMath (2402.03300)** — GRPO 后 GSM8K 82.9%→88.2%，MATH 46.8%→51.7%；CMATH 84.6%→88.8%；MATH SC 60.9%
  - link: https://arxiv.org/abs/2402.03300

- **[CORRECT_TO_MATH] DeepSeekMath** — 教案开场写「AIME … DeepSeekMath 7B≈51.7%」
  - link: https://arxiv.org/abs/2402.03300
  - fix: 开场对比句改为：MATH 上 DeepSeekMath-RL 7B 达 51.7%（非工具）；勿写成 AIME 51.7%。AIME 数字留给 DAPO/R1。

- **[OK] DAPO (2503.14476)** — DAPO Qwen2.5-32B AIME2024≈50，超 R1-Zero-Qwen-32B 的 47，约一半训练步数；naive≈30
  - link: https://arxiv.org/abs/2503.14476

- **[UNVERIFIED_IN_PDF] STaR (2203.14465)** — 口播：STaR 可 boost 到 51.7（需核对基准）
  - link: https://arxiv.org/abs/2203.14465
  - fix: 口播「star approach to 51.7」若出现在教案，标注为口误/与 DeepSeekMath MATH 数字混淆；STaR 原文无此 51.7% 声明。

- **[OK] AlphaCode (2203.07814)** — CodeContests 34.2%；Codeforces top 54.3%；评分≈1238
  - link: https://arxiv.org/abs/2203.07814

- **[OK] AlphaCode 2 (alphacode2.pdf)** — 解出约 43%；约第 85 百分位；100 样本追上 100 万样本
  - link: https://storage.googleapis.com/deepmind-media/AlphaCode2_Tech_Report.pdf

- **[OK] Search-o1 (2501.05366)** — GPQA 63.6%；多跳 EM +23.2% vs 标准 RAG
  - link: https://arxiv.org/abs/2501.05366

- **[OK] METR (2503.14499)** — 50% 时间视野约每 7 个月翻倍；o3≈110 分钟；翻倍≈207 天
  - link: https://arxiv.org/abs/2503.14499

- **[OK] Self-Consistency (2203.11171)** — GSM8K +17.9%, SVAMP +11.0%, AQuA +12.2%, StrategyQA +6.4%, ARC-c +3.9%
  - link: https://arxiv.org/abs/2203.11171

- **[OK] ADAS (2408.08435)** — Meta Agent Search；跨域迁移仍优
  - link: https://arxiv.org/abs/2408.08435

- **[OK] GDPval (2510.04374)** — Claude Opus 4.1 ≈47.6% 优于或打平专家；自动评分≈66% 一致
  - link: https://arxiv.org/abs/2510.04374

- **[OK] DeepScholar-Bench (2508.20033)** — 无系统几何平均超过约 31%
  - link: https://arxiv.org/abs/2508.20033

- **[OK] AlphaCode 2** — 教案「>10000× 样本效率」
  - link: n/a
