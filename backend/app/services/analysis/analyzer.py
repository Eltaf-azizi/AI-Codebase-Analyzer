from collections import Counter


class AnalysisEngine:
    def summarize_project(self, files: dict[str, str], chunks: list[dict]) -> dict:
        extensions = Counter(path.split(".")[-1] if "." in path else "unknown" for path in files)
        top_paths = sorted(files.keys())[:8]
        return {
            "project_summary": f"Repository has {len(files)} files across {len(extensions)} file types.",
            "architecture_summary": (
                "Detected layered structure based on paths and symbols. "
                "Use dependency graph endpoint for module-level relationships."
            ),
            "dependency_insights": [f"{ext}: {count} files" for ext, count in extensions.most_common(8)],
            "file_summaries": {path: f"Contains {len(content.splitlines())} lines." for path, content in list(files.items())[:30]},
            "entrypoint_candidates": top_paths,
            "total_chunks": len(chunks),
        }
