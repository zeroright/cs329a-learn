"""自编: unbiased pass@k estimator + coverage curve (Monkeys / HumanEval style)."""
from __future__ import annotations
import math
from collections import Counter

def unbiased_pass_at_k(n: int, c: int, k: int) -> float:
    """HumanEval unbiased estimator: 1 - C(n-c, k) / C(n, k)."""
    if n - c < k:
        return 1.0
    return 1.0 - math.comb(n - c, k) / math.comb(n, k)

def coverage_power_law(ks, A=0.55, B=0.35):
    """Toy C(K) ≈ 1 - A * K^{-B} as in Large Language Monkeys."""
    return [1.0 - A * (k ** (-B)) for k in ks]

def demo():
    # Fake per-problem: n samples, c correct
    problems = [(16, 3), (16, 0), (16, 8), (16, 1), (8, 2)]
    for k in (1, 2, 4, 8):
        scores = [unbiased_pass_at_k(n, c, min(k, n)) for n, c in problems]
        print(f"pass@{k} mean={sum(scores)/len(scores):.3f}  per={['%.2f'%s for s in scores]}")
    ks = [1, 2, 4, 8, 16, 32, 64]
    cov = coverage_power_law(ks)
    print("coverage toy:", list(zip(ks, [round(x, 3) for x in cov])))
    # majority vs oracle best-of-n
    samples = ["42", "7", "42", "42", "99", "7", "42", "3"]
    truth = "42"
    maj = Counter(samples).most_common(1)[0][0]
    best = truth if truth in samples else samples[0]
    print(f"majority={maj} best-of-n(oracle)={best} maj_ok={maj==truth}")

if __name__ == "__main__":
    demo()
