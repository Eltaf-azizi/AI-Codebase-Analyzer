import ast


class AstPythonParser:
    def parse(self, file_path: str, content: str) -> list[dict]:
        tree = ast.parse(content)
        symbols: list[dict] = []
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                symbols.append(
                    {
                        "file_path": file_path,
                        "symbol_name": node.name,
                        "symbol_type": "function",
                        "start_line": node.lineno,
                        "end_line": getattr(node, "end_lineno", node.lineno),
                    }
                )
            if isinstance(node, ast.ClassDef):
                symbols.append(
                    {
                        "file_path": file_path,
                        "symbol_name": node.name,
                        "symbol_type": "class",
                        "start_line": node.lineno,
                        "end_line": getattr(node, "end_lineno", node.lineno),
                    }
                )
        return symbols
