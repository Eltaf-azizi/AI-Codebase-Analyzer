from fastapi import APIRouter, HTTPException
from app.domain.schemas import ChatRequest, ChatResponse, SourceCitation
from app.services.registry import registry
from app.services.rag.embedding_service import GeminiEmbeddingService
from app.services.rag.vector_store import FaissVectorStore
from app.services.rag.answer_service import AnswerService

router = APIRouter(prefix="/projects", tags=["chat"])
embedder = GeminiEmbeddingService()
answer_service = AnswerService()
vector_stores: dict[str, FaissVectorStore] = {}


def _ensure_index(project_id: str) -> FaissVectorStore:
    store = vector_stores.get(project_id)
    if store is not None:
        return store
    store = FaissVectorStore()
    vector_stores[project_id] = store
    return store


@router.post("/{project_id}/chat", response_model=ChatResponse)
def chat(project_id: str, payload: ChatRequest) -> ChatResponse:
    state = registry.projects.get(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    if not state.chunks:
        raise HTTPException(status_code=400, detail="Project has no indexed chunks yet")

    store = _ensure_index(project_id)
    if not store.chunks:
        embeddings = embedder.embed_texts([c["content"] for c in state.chunks])
        store.upsert(state.chunks, embeddings)
    query_embedding = embedder.embed_texts([payload.query])[0]
    contexts = store.search(query_embedding, k=6)
    answer = answer_service.answer(payload.query, contexts)
    citations = [
        SourceCitation(
            file_path=c.get("file_path", ""),
            symbol_name=c.get("symbol_name"),
            snippet=c.get("content", "")[:600],
        )
        for c in contexts
    ]
    return ChatResponse(answer=answer, citations=citations)
