import re


class TreeSitterParser:
    """
    Lightweight fallback parser. Replace with concrete tree-sitter grammars in production hardening.
    """

    FUNC_PATTERN = re.compile(r"^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)", re.MULTILINE)
    CLASS_PATTERN = re.compile(r"^\s*(?:export\s+)?class\s+([A-Za-z0-9_]+)", re.MULTILINE)
    IMPORT_PATTERN = re.compile(r"^\s*(?:import|from|const\s+.+?=\s+require\()(.+)$", re.MULTILINE)

    def parse(self, file_path: str, content: str) -> tuple[list[dict], list[str]]:
        symbols: list[dict] = []
        for match in self.FUNC_PATTERN.finditer(content):
            symbols.append({"file_path": file_path, "symbol_name": match.group(1), "symbol_type": "function"})
        for match in self.CLASS_PATTERN.finditer(content):
            symbols.append({"file_path": file_path, "symbol_name": match.group(1), "symbol_type": "class"})
        imports = [m.group(0).strip() for m in self.IMPORT_PATTERN.finditer(content)]
        return symbols, imports
