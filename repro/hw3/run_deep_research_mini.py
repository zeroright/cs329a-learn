#!/usr/bin/env python3
"""【自编】Mini DeepResearchAgent: route → decompose → mock retrieve → fuse → refine."""
from __future__ import annotations
from dataclasses import dataclass, field

KB = {
    "weather": {"paris": "rain 12C", "sf": "fog 15C"},
    "finance": {"AAPL": "180 USD", "GOOG": "140 USD"},
    "math": {"integral x^2": "x^3/3 + C", "gcd(84,30)": "6"},
    "search": {
        "self-improving agents": "CS329A covers TTC, verification, tools, RL, SWE agents.",
        "pass@k": "Unbiased estimator 1 - C(n-c,k)/C(n,k) from HumanEval.",
    },
}

def route(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ("weather", "温度", "rain")): return "weather"
    if any(w in q for w in ("stock", "price", "aapl", "goog")): return "finance"
    if any(w in q for w in ("integral", "gcd", "compute")): return "math"
    return "search"

def decompose(query: str) -> list[str]:
    if " and " in query.lower() or "且" in query:
        parts = [p.strip() for p in query.replace("且", " and ").split(" and ") if p.strip()]
        return parts or [query]
    return [query]

def retrieve(api: str, subq: str) -> str:
    store = KB.get(api, {})
    for k, v in store.items():
        if k.lower() in subq.lower() or subq.lower() in k.lower():
            return f"[{api}] {k}: {v}"
    # fuzzy first value
    if store:
        k, v = next(iter(store.items()))
        return f"[{api}] fallback {k}: {v}"
    return f"[{api}] no hit"

def fuse(snippets: list[str]) -> str:
    return " | ".join(snippets)

def refine(answer: str, round_i: int) -> str:
    return f"{answer} (refined r{round_i})"

@dataclass
class Trace:
    route: str = ""
    subs: list[str] = field(default_factory=list)
    snippets: list[str] = field(default_factory=list)
    answer: str = ""

def run(query: str, max_refine: int = 2) -> Trace:
    tr = Trace()
    tr.route = route(query)
    tr.subs = decompose(query)
    tr.snippets = [retrieve(tr.route if tr.route != "search" else route(s), s) for s in tr.subs]
    ans = fuse(tr.snippets)
    for i in range(1, max_refine + 1):
        if "no hit" in ans:
            ans = refine(ans + " ; broaden retrieval", i)
        else:
            ans = refine(ans, i)
            break
    tr.answer = ans
    return tr

def main():
    queries = [
        "What is the weather in Paris?",
        "AAPL stock price",
        "gcd(84,30)",
        "pass@k and self-improving agents",
    ]
    for q in queries:
        tr = run(q)
        print(f"Q: {q}\n  route={tr.route} subs={tr.subs}\n  -> {tr.answer}\n")

if __name__ == "__main__":
    main()
