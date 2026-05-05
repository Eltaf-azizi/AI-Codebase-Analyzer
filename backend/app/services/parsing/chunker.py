import hashlib


class CodeChunker:
    def chunk_file(self, project_id: str, file_path: str, content: str, symbols: list[dict]) -> list[dict]:
        chunks: list[dict] = []
        if symbols:
            for symbol in symbols:
                start = symbol.get("start_line", 1) - 1
                end = symbol.get("end_line", start + 40)
                lines = content.splitlines()
                snippet = "\n".join(lines[start:end])
                chunk_id = hashlib.sha256(f"{project_id}:{file_path}:{symbol.get('symbol_name')}".encode()).hexdigest()
                chunks.append(
                    {
                        "chunk_id": chunk_id,
                        "project_id": project_id,
                        "file_path": file_path,
                        "symbol_name": symbol.get("symbol_name"),
                        "symbol_type": symbol.get("symbol_type"),
                        "start_line": start + 1,
                        "end_line": end,
                        "content": snippet or content[:3000],
                    }
                )
        else:
            chunk_id = hashlib.sha256(f"{project_id}:{file_path}:full".encode()).hexdigest()
            chunks.append(
                {
                    "chunk_id": chunk_id,
                    "project_id": project_id,
                    "file_path": file_path,
                    "symbol_name": None,
                    "symbol_type": "file",
                    "start_line": 1,
                    "end_line": len(content.splitlines()),
                    "content": content[:4000],
                }
            )
        return chunks
