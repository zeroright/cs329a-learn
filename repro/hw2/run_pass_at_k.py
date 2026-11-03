#!/usr/bin/env python3
"""【自编】Mini HumanEval + unbiased pass@k with subprocess sandbox (no Docker)."""
from __future__ import annotations
import math, subprocess, textwrap, tempfile, os
from pathlib import Path

TASKS = [
    {
        "id": "add",
        "prompt": "def add(a, b):\n",
        "canonical": "def add(a, b):\n    return a + b\n",
        "tests": "assert add(2,3)==5\nassert add(-1,1)==0\n",
        "candidates": [
            "def add(a, b):\n    return a + b\n",
            "def add(a, b):\n    return a - b\n",
            "def add(a, b):\n    return a + b\n",
            "def add(a, b):\n    return a * b\n",
        ],
    },
    {
        "id": "factorial",
        "prompt": "def factorial(n):\n",
        "canonical": "def factorial(n):\n    return 1 if n<=1 else n*factorial(n-1)\n",
        "tests": "assert factorial(0)==1\nassert factorial(5)==120\n",
        "candidates": [
            "def factorial(n):\n    r=1\n    for i in range(1,n+1): r*=i\n    return r\n",
            "def factorial(n):\n    return n\n",
            "def factorial(n):\n    return 1 if n<=1 else n*factorial(n-1)\n",
            "def factorial(n):\n    return sum(range(n))\n",
        ],
    },
]

def run_sandboxed(code: str, tests: str, timeout: float = 2.0) -> bool:
    src = code + "\n" + tests
    with tempfile.TemporaryDirectory() as td:
        f = Path(td) / "sol.py"
        f.write_text(src, encoding="utf-8")
        try:
            r = subprocess.run(
                ["python3", str(f)],
                capture_output=True, text=True, timeout=timeout,
                env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
            )
            return r.returncode == 0
        except subprocess.TimeoutExpired:
            return False

def unbiased_pass_at_k(n: int, c: int, k: int) -> float:
    if n - c < k:
        return 1.0
    return 1.0 - math.comb(n - c, k) / math.comb(n, k)

def main():
    for task in TASKS:
        results = [run_sandboxed(c, task["tests"]) for c in task["candidates"]]
        n, c = len(results), sum(results)
        print(f"{task['id']}: n={n} c={c} passes={results}")
        for k in (1, 2, 4):
            if k <= n:
                print(f"  pass@{k}={unbiased_pass_at_k(n,c,k):.3f}")
    # LLM-as-judge toy: prefer candidates whose AST has 'return'
    print("judge-toy: prefer solutions containing 'return' —", 
          all("return" in c for t in TASKS for c in t["candidates"][:1]))

if __name__ == "__main__":
    main()
