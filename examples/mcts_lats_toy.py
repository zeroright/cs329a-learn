"""自编: tiny UCT/MCTS toy for LATS-style tree search (no LLM)."""
from __future__ import annotations
import math, random

class Node:
    def __init__(self, state: str, parent=None):
        self.state = state
        self.parent = parent
        self.children: list[Node] = []
        self.n = 0
        self.w = 0.0  # total value

    def uct(self, c=1.4) -> float:
        if self.n == 0:
            return float("inf")
        return self.w / self.n + c * math.sqrt(math.log(self.parent.n) / self.n)

def expand(node: Node, actions=("L", "R", "Stay")):
    for a in actions:
        node.children.append(Node(node.state + a, parent=node))

def simulate(state: str) -> float:
    # Reward paths that contain "LR" subsequence (toy goal)
    return 1.0 if "LR" in state else 0.0

def mcts(root: Node, iters=50):
    for _ in range(iters):
        node = root
        # select
        while node.children:
            node = max(node.children, key=lambda ch: ch.uct())
        # expand
        if node.n > 0 and not node.children:
            expand(node)
            node = random.choice(node.children) if node.children else node
        elif not node.children:
            expand(node)
            node = random.choice(node.children)
        # simulate + backprop
        val = simulate(node.state)
        while node:
            node.n += 1
            node.w += val
            node = node.parent
    return max(root.children, key=lambda ch: ch.n)

if __name__ == "__main__":
    root = Node("")
    expand(root)
    best = mcts(root, iters=80)
    ranked = sorted(root.children, key=lambda ch: ch.n, reverse=True)
    print("visits:", [(ch.state, ch.n, round(ch.w/ch.n, 2) if ch.n else 0) for ch in ranked])
    print("most_visited_child", best.state)
