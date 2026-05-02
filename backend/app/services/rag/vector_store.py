import numpy as np
import faiss


class FaissVectorStore:
    def __init__(self) -> None:
        self.index = None
        self.chunks: list[dict] = []

    def upsert(self, chunks: list[dict], embeddings: list[list[float]]) -> None:
        if not embeddings:
            return
        matrix = np.array(embeddings, dtype=np.float32)
        dim = matrix.shape[1]
        if self.index is None:
            self.index = faiss.IndexFlatIP(dim)
        self.index.add(matrix)
        self.chunks.extend(chunks)

    def search(self, query_embedding: list[float], k: int = 6) -> list[dict]:
        if self.index is None or not self.chunks:
            return []
        query = np.array([query_embedding], dtype=np.float32)
        scores, indices = self.index.search(query, k)
        results: list[dict] = []
        for idx, score in zip(indices[0], scores[0]):
            if idx < 0 or idx >= len(self.chunks):
                continue
            chunk = self.chunks[idx].copy()
            chunk["score"] = float(score)
            results.append(chunk)
        return results
