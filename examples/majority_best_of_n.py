"""自编: majority vote vs best-of-N with a mock generative verifier."""
from __future__ import annotations
from collections import Counter
import random

def mock_llm_samples(problem_id: int, n: int, seed: int = 0) -> list[str]:
    rng = random.Random(seed + problem_id)
    # ground truth answer depends on problem_id
    truth = str(problem_id * 10 + 3)
    # pass@1 ~ 0.25
    out = []
    for _ in range(n):
        if rng.random() < 0.25:
            out.append(truth)
        else:
            out.append(str(rng.randint(0, 99)))
    return out, truth

def majority(answers: list[str]) -> str:
    return Counter(answers).most_common(1)[0][0]

def mock_verifier_score(answer: str, truth: str, rationale_len: int) -> float:
    # Prefer correct; break ties with longer rationale (proxy for generative RM)
    base = 1.0 if answer == truth else 0.2
    return base + 0.01 * rationale_len

def best_of_n(answers: list[str], truth: str) -> str:
    scored = [(mock_verifier_score(a, truth, len(a) + i), a) for i, a in enumerate(answers)]
    return max(scored)[1]

def demo():
    n_problems, n_samples = 40, 16
    maj_ok = bon_ok = 0
    for pid in range(n_problems):
        samples, truth = mock_llm_samples(pid, n_samples)
        maj_ok += majority(samples) == truth
        bon_ok += best_of_n(samples, truth) == truth
    print(f"n={n_problems} k={n_samples} majority={maj_ok/n_problems:.2%} best-of-N(mock RM)={bon_ok/n_problems:.2%}")

if __name__ == "__main__":
    demo()
