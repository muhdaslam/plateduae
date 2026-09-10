from functools import lru_cache
from typing import cast

from sentence_transformers import SentenceTransformer

# Local multilingual model (PDF section 5.3's "multilingual embeddings for
# semantic similarity" half of hybrid matching) — chosen over a hosted API
# so canonicalisation matching needs no API key/billing and works offline.
# 384-dim output; packages/db's canonical_dish.embedding column is sized
# to match (see CANONICAL_DISH_EMBEDDING_DIMENSIONS in that schema file —
# keep the two in sync if this model ever changes).
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIMENSIONS = 384


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    """Loaded once per process (first call pays the model-load cost;
    everything after is free) rather than per request/task."""
    return SentenceTransformer(MODEL_NAME)


def embed(texts: list[str]) -> list[list[float]]:
    model = get_model()
    vectors = model.encode(texts, normalize_embeddings=True)
    return cast(list[list[float]], vectors.tolist())
