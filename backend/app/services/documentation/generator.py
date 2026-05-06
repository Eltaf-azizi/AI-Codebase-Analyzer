class DocumentationGenerator:
    def generate_readme(self, project_name: str, analysis: dict) -> str:
        return (
            f"# {project_name}\n\n"
            "## Project Overview\n"
            f"{analysis.get('project_summary', 'No summary available.')}\n\n"
            "## Architecture\n"
            f"{analysis.get('architecture_summary', 'No architecture summary available.')}\n"
        )

    def generate_api_docs(self) -> str:
        return (
            "# API Docs\n\n"
            "- `POST /api/v1/ingestion/zip`\n"
            "- `POST /api/v1/ingestion/github`\n"
            "- `POST /api/v1/projects/{project_id}/chat`\n"
            "- `GET /api/v1/projects/{project_id}/analysis`\n"
        )

    def inline_comment_suggestions(self, files: dict[str, str]) -> dict[str, list[str]]:
        suggestions: dict[str, list[str]] = {}
        for path, content in list(files.items())[:20]:
            if "TODO" in content:
                suggestions[path] = ["Replace TODO placeholders with implementation details."]
            elif "if" in content and "return" in content:
                suggestions[path] = ["Add intent comment on key branch conditions."]
        return suggestions
