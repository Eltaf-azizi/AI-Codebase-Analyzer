from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any
import uuid


@dataclass
class ProjectState:
    project_id: str
    name: str
    status: str = "created"
    files: dict[str, str] = field(default_factory=dict)
    chunks: list[dict[str, Any]] = field(default_factory=list)
    analysis: dict[str, Any] | None = None


class ProjectRegistry:
    def __init__(self) -> None:
        self.projects: dict[str, ProjectState] = {}
        self.tasks: dict[str, dict[str, str]] = defaultdict(dict)

    def create_project(self, name: str) -> ProjectState:
        project_id = str(uuid.uuid4())
        state = ProjectState(project_id=project_id, name=name)
        self.projects[project_id] = state
        return state


registry = ProjectRegistry()
