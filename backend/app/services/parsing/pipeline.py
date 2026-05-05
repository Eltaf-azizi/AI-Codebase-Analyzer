from .ast_python_parser import AstPythonParser
from .treesitter_parser import TreeSitterParser
from .chunker import CodeChunker


class ParsingPipeline:
    def __init__(self) -> None:
        self.py_parser = AstPythonParser()
        self.ts_parser = TreeSitterParser()
        self.chunker = CodeChunker()

    def parse_and_chunk(self, project_id: str, files: dict[str, str]) -> list[dict]:
        all_chunks: list[dict] = []
        for path, content in files.items():
            symbols: list[dict] = []
            if path.endswith(".py"):
                try:
                    symbols = self.py_parser.parse(path, content)
                except SyntaxError:
                    symbols = []
            elif path.endswith((".ts", ".tsx", ".js", ".jsx")):
                symbols, imports = self.ts_parser.parse(path, content)
                for symbol in symbols:
                    symbol["imports"] = imports
            all_chunks.extend(self.chunker.chunk_file(project_id, path, content, symbols))
        return all_chunks
