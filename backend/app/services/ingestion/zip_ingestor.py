from zipfile import ZipFile
from io import BytesIO


class ZipIngestor:
    EXCLUDED_DIRS = {"node_modules", ".git", "dist", "build", ".next", "__pycache__", "venv"}
    EXCLUDED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".exe", ".dll", ".pyc"}

    def ingest(self, file_bytes: bytes, max_file_size_bytes: int = 1_000_000) -> dict[str, str]:
        files: dict[str, str] = {}
        with ZipFile(BytesIO(file_bytes)) as archive:
            for info in archive.infolist():
                if info.is_dir():
                    continue
                path = info.filename
                if any(f"/{d}/" in f"/{path}" for d in self.EXCLUDED_DIRS):
                    continue
                if any(path.lower().endswith(ext) for ext in self.EXCLUDED_EXTENSIONS):
                    continue
                if info.file_size > max_file_size_bytes:
                    continue
                try:
                    content = archive.read(path).decode("utf-8")
                except UnicodeDecodeError:
                    continue
                if content.strip():
                    files[path] = content
        return files
