from google import genai
from app.core.config import get_settings


class GeminiEmbeddingService:
    def __init__(self) -> None:
        settings = get_settings()
        self.model = settings.gemini_embedding_model
        self.client = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if not self.client:
            # Deterministic fallback for local development without API key.
            return [[float((sum(map(ord, t)) % 97) / 97.0)] * 16 for t in texts]
        response = self.client.models.embed_content(model=self.model, contents=texts)
        return [item.values for item in response.embeddings]
