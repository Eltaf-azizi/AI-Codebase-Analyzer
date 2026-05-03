from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI Codebase Analyzer API"
    env: str = "development"
    api_prefix: str = "/api/v1"
    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = Field(default="sqlite:///./ai_codebase_analyzer.db")
    redis_url: str = Field(default="redis://localhost:6379/0")
    storage_dir: str = Field(default="./storage")
    vector_index_dir: str = Field(default="./storage/vector_indexes")

    gemini_api_key: str = Field(default="")
    gemini_model: str = Field(default="gemini-2.5-flash")
    gemini_embedding_model: str = Field(default="text-embedding-004")

    max_repo_size_mb: int = 300
    max_file_size_bytes: int = 1_000_000
    max_files_per_repo: int = 20_000


@lru_cache
def get_settings() -> Settings:
    return Settings()
