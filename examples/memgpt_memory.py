"""自编: minimal MemGPT-style working + archival memory (in-process)."""
from __future__ import annotations
from dataclasses import dataclass, field

@dataclass
class MemoryOS:
    working: list[str] = field(default_factory=list)
    archival: dict[str, str] = field(default_factory=dict)
    max_working: int = 4

    def observe(self, text: str):
        self.working.append(text)
        while len(self.working) > self.max_working:
            old = self.working.pop(0)
            key = f"mem_{len(self.archival)}"
            self.archival[key] = old

    def recall(self, query: str) -> list[str]:
        q = query.lower()
        pool = list(self.archival.values()) + list(self.working)
        hits = [v for v in pool if any(w in v.lower() for w in q.split())]
        return hits[-3:]

    def prompt_block(self) -> str:
        return "WORKING:\n- " + "\n- ".join(self.working) + f"\nARCHIVAL_KEYS={list(self.archival)}"

if __name__ == "__main__":
    mem = MemoryOS()
    for turn in [
        "User wants 2D drawing export to DXF",
        "Constraint: CATIA V5 only",
        "Failed last night on hole tolerance",
        "Retry with ±0.1 mm",
        "Success on fixture plate A",
    ]:
        mem.observe(turn)
    print(mem.prompt_block())
    print("recall tolerance:", mem.recall("tolerance hole"))
