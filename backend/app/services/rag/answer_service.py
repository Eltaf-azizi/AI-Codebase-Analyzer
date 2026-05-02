from google import genai
from app.core.config import get_settings


class AnswerService:
    def __init__(self) -> None:
        settings = get_settings()
        self.model = settings.gemini_model
        self.client = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None

    def answer(self, query: str, contexts: list[dict]) -> str:
        context_text = "\n\n".join(
            f"FILE: {c.get('file_path')}\nSYMBOL: {c.get('symbol_name')}\nCODE:\n{c.get('content')}" for c in contexts
        )
        prompt = (
            "You are a senior software engineer. Answer only using provided context. "
            "If context is insufficient, explicitly say so.\n\n"
            f"User Query:\n{query}\n\nContext:\n{context_text}\n\n"
            "Return concise, technical explanation with path references."
        )
        if not self.client:
            return "Local mode response: configure GEMINI_API_KEY to enable full AI answers."
        response = self.client.models.generate_content(model=self.model, contents=prompt)
        return response.text or "No response generated."
