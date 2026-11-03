"""自编: SWE-bench-style generate→apply→test loop on a tiny local repo (no pytest)."""
from __future__ import annotations
from pathlib import Path
import importlib.util, tempfile, traceback

BUGGY = "def add(a, b):\n    return a - b  # bug\n"
PATCH = "def add(a, b):\n    return a + b\n"

def load_add(repo: Path):
    spec = importlib.util.spec_from_file_location("app", repo / "app.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.add

def run_tests(repo: Path) -> tuple[bool, str]:
    try:
        add = load_add(repo)
        assert add(2, 3) == 5, f"expected 5 got {add(2,3)}"
        assert add(-1, 1) == 0
        return True, "2 passed"
    except Exception as e:
        return False, traceback.format_exc(limit=1)

def demo():
    with tempfile.TemporaryDirectory() as td:
        repo = Path(td)
        (repo / "app.py").write_text(BUGGY)
        ok1, out1 = run_tests(repo)
        print("before patch ok=", ok1, "msg=", out1.splitlines()[-1])
        (repo / "app.py").write_text(PATCH)
        ok2, out2 = run_tests(repo)
        print("after patch ok=", ok2, "msg=", out2)
        assert (not ok1) and ok2
        print("SWE toy loop OK")

if __name__ == "__main__":
    demo()
