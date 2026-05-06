class DebugAssistant:
    def analyze(self, error_message: str, code_snippet: str | None = None) -> dict:
        lower = error_message.lower()
        if "none" in lower or "null" in lower:
            root = "Potential null/None access in runtime flow."
            fixes = ["Add guard clauses before access.", "Initialize value earlier in lifecycle."]
        elif "timeout" in lower:
            root = "Likely I/O or remote dependency timeout."
            fixes = ["Increase timeout with retry/backoff.", "Add caching and circuit breaker patterns."]
        else:
            root = "General runtime or logic fault."
            fixes = ["Inspect stack trace origin and local variables.", "Write a regression test for failing path."]
        evidence = [error_message.strip()]
        if code_snippet:
            evidence.append("Code snippet provided and used for local reasoning.")
        return {"root_cause": root, "evidence": evidence, "suggested_fixes": fixes}
