"""自编: GRPO-style group-relative advantages (DeepSeekMath / DAPO intuition)."""
from __future__ import annotations
import statistics

def grpo_advantages(rewards: list[float], eps: float = 1e-8) -> list[float]:
    """Within-group standardize rewards → advantages (no critic)."""
    mu = statistics.mean(rewards)
    # population std within group
    var = sum((r - mu) ** 2 for r in rewards) / max(len(rewards), 1)
    sd = var ** 0.5
    return [(r - mu) / (sd + eps) for r in rewards]

def demo():
    # One prompt, G=8 rollouts with outcome rewards 0/1
    group = [0, 1, 0, 1, 1, 0, 0, 1]
    adv = grpo_advantages(group)
    print("rewards", group)
    print("advantages", [round(a, 3) for a in adv])
    print("mean_adv≈0?", round(sum(adv)/len(adv), 6))
    # length-biased toy: longer wrong chains
    rewards2 = [0.0, 0.0, 1.0, 1.0]
    print("small group adv", [round(a, 3) for a in grpo_advantages(rewards2)])

if __name__ == "__main__":
    demo()
