import os
import tempfile
from git import Repo


class GithubIngestor:
    def ingest(self, repo_url: str, branch: str | None = None) -> dict[str, str]:
        with tempfile.TemporaryDirectory(prefix="repo_") as temp_dir:
            clone_args = {"depth": 1}
            if branch:
                clone_args["branch"] = branch
            Repo.clone_from(repo_url, temp_dir, **clone_args)
            files: dict[str, str] = {}
            for root, _, filenames in os.walk(temp_dir):
                for filename in filenames:
                    path = os.path.join(root, filename)
                    rel = os.path.relpath(path, temp_dir).replace("\\", "/")
                    try:
                        with open(path, "r", encoding="utf-8") as f:
                            content = f.read()
                    except (UnicodeDecodeError, OSError):
                        continue
                    if content.strip():
                        files[rel] = content
            return files
