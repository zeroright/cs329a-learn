#!/usr/bin/env python3
"""【自编】HW1-style majority vote vs Best-of-N on a tiny math subset (mock LLM)."""
from __future__ import annotations
import random
from collections import Counter

# Tiny AIME/MATH-style problems with numeric answers (自编)
PROBLEMS = [
    {"id": "t1", "q": "Compute 17*19.", "answer": "323"},
    {"id": "t2", "q": "What is gcd(84, 30)?", "answer": "6"},
    {"id": "t3", "q": "Solve 2x+5=17 for x.", "answer": "6"},
    {"id": "t4", "q": "How many primes <= 20?", "answer": "8"},
    {"id": "t5", "q": "Remainder of 100/7.", "answer": "2"},
]

DISTRACTORS = {
    "t1": ["323", "324", "317", "323", "190", "323", "36"],
    "t2": ["6", "12", "6", "2", "6", "42", "6"],
    "t3": ["6", "11", "6", "5", "6", "7", "6"],
    "t4": ["8", "9", "7", "8", "8", "10", "8"],
    "t5": ["2", "3", "2", "1", "2", "4", "2"],
}

def mock_sample(pid: str, n: int, seed: int = 0) -> list[str]:
    rng = random.Random(seed + hash(pid) % 10007)
    pool = DISTRACTORS[pid]
    return [rng.choice(pool) for _ in range(n)]

def majority_vote(samples: list[str]) -> str:
    return Counter(samples).most_common(1)[0][0]

def rule_verifier_score(problem: dict, candidate: str) -> float:
    """Stand-in for generative RM: exact match gets 1, else digit-overlap heuristic."""
    gold = problem["answer"]
    if candidate.strip() == gold:
        return 1.0
    return 0.15 * len(set(candidate) & set(gold)) / max(len(gold), 1)

def best_of_n(problem: dict, samples: list[str]) -> str:
    return max(samples, key=lambda s: rule_verifier_score(problem, s))

def accuracy(preds: dict[str, str]) -> float:
    ok = sum(1 for p in PROBLEMS if preds[p["id"]] == p["answer"])
    return ok / len(PROBLEMS)

def main():
    N = 8
    zero, maj, bon = {}, {}, {}
    for p in PROBLEMS:
        samples = mock_sample(p["id"], N, seed=42)
        zero[p["id"]] = samples[0]
        maj[p["id"]] = majority_vote(samples)
        bon[p["id"]] = best_of_n(p, samples)
        print(f"{p['id']}: zero={zero[p['id']]} maj={maj[p['id']]} bon={bon[p['id']]} gold={p['answer']}")
    print("---")
    print(f"zero-shot acc={accuracy(zero):.2f}")
    print(f"majority@{N} acc={accuracy(maj):.2f}")
    print(f"best-of-{N} (rule V) acc={accuracy(bon):.2f}")
    # RLEF-style one retry on wrong zero-shot
    rlef = {}
    for p in PROBLEMS:
        s0 = mock_sample(p["id"], 1, seed=1)[0]
        if rule_verifier_score(p, s0) < 1.0:
            feedback = f"Previous answer {s0} failed check; try again."
            s1 = mock_sample(p["id"], 1, seed=99)[0]  # mock "retry"
            rlef[p["id"]] = s1
        else:
            rlef[p["id"]] = s0
    print(f"rlef-mock acc={accuracy(rlef):.2f}")

if __name__ == "__main__":
    main()
