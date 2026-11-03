"""自编: minimal ReAct loop with mock LLM + tools (no paid API)."""
from __future__ import annotations

TOOLS = {
    "search": lambda q: f"[search:{q}] stub hit: Stanford CS329A teaches self-improving agents.",
    "calc": lambda expr: str(eval(expr, {"__builtins__": {}}, {})),  # toy only
}

def mock_llm(step: int, question: str, obs: str | None) -> tuple[str, str | None, str | None]:
    """Return (thought, action_or_none, final_or_none)."""
    if step == 0:
        return ("Need course topic facts.", "search[CS329A overview]", None)
    if step == 1:
        return ("Have overview; compute 2+2 as sanity.", "calc[2+2]", None)
    return ("Enough evidence.", None, f"Answer: agents + verifiers. Obs calc={obs}")

def run_react(question: str, max_steps: int = 5) -> str:
    transcript = []
    obs = None
    for t in range(max_steps):
        thought, action, final = mock_llm(t, question, obs)
        transcript.append(f"Thought: {thought}")
        if final:
            transcript.append(f"Final: {final}")
            return "\n".join(transcript)
        assert action and "[" in action
        name, arg = action[:-1].split("[", 1)
        obs = TOOLS[name](arg)
        transcript.append(f"Action: {action}\nObservation: {obs}")
    return "\n".join(transcript) + "\nFinal: (max steps)"

if __name__ == "__main__":
    print(run_react("What is CS329A about?"))
