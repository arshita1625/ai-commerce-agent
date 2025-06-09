import os
import json
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from sentence_transformers import SentenceTransformer
import faiss
import re

# Load product catalog
catalog_path = os.path.join(os.path.dirname(__file__), "product_catalog.json")
with open(catalog_path, "r") as f:
    catalog = json.load(f)
sbert = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device="cpu")
texts = [p["description"] for p in catalog]
text_embs = sbert.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
index_text = faiss.IndexFlatIP(text_embs.shape[1])
index_text.add(text_embs)
def search_text(query: str, k: int = 3):
    q_emb = sbert.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    D, I = index_text.search(q_emb, k)
    return [catalog[i] for i in I[0]]

# ─── Helpers ────────────────────────────────────────────────────────────────
def normalize(text: str) -> str:
    """Lowercase + strip non-alphanumeric characters."""
    return re.sub(r"[^a-z0-9]", "", text.lower())

def parse_recommendation(query: str):
    """
    Parses:
      - "recommend me [some] <item> for <context>"
      - "recommend me [some] <item>"
    Returns (item_norm, context_norm or None).
    """
    # 1) Try with context
    m = re.search(
        r"recommend(?: me)?(?: some)?\s+(?P<item>.+?)\s+for\s+(?P<context>.+?)[\.\?!]?$",
        query,
        flags=re.IGNORECASE
    )
    if m:
        raw_item    = m.group("item").strip().lower()
        raw_context = m.group("context").strip().lower()
    else:
        # 2) Fallback to no-context
        m2 = re.search(
            r"recommend(?: me)?(?: some)?\s+(?P<item>.+?)[\.\?!]?$",
            query,
            flags=re.IGNORECASE
        )
        if not m2:
            return None, None
        raw_item    = m2.group("item").strip().lower()
        raw_context = None

    # Strip leading articles from the item phrase
    raw_item = re.sub(r"^(?:a|an|the|some)\s+", "", raw_item)

    item    = normalize(raw_item)
    context = normalize(raw_context) if raw_context else None
    return item, context

# ─── recommend_products ───────────────────────────────────────────────────
def recommend_products(query: str, k: int = 3):
    item, context = parse_recommendation(query)

    # 1) If user asked for an item, try strict catalog match first
    if item:
        candidates = []
        for p in catalog:
            cat_norm  = normalize(p.get("category", ""))
            name_norm = normalize(p.get("name", ""))
            tags_norm = [normalize(t) for t in p.get("tags", [])]
            if (
                item in cat_norm
                or item in name_norm
                or any(item in t for t in tags_norm)
            ):
                candidates.append(p)

        if candidates:
            # 2a) If context also given, try narrowing by it
            if context:
                ctx_matches = [
                    p for p in candidates
                    if context in normalize(p.get("category", ""))
                       or any(context in normalize(t) for t in p.get("tags", []))
                ]
                if ctx_matches:
                    return ctx_matches
            # 2b) Otherwise (or no context‐matches) return all item matches
            return candidates

    # 3) Only if **no** strict item matches found do we fall back to semantic search
    return search_text(query, k=k)
# Text embeddings (SentenceTransformer)
device = "cuda" if torch.cuda.is_available() else "cpu"
sbert = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device=device)
texts = [p["description"] for p in catalog]
text_embeddings = sbert.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
index_text = faiss.IndexFlatIP(text_embeddings.shape[1])
index_text.add(text_embeddings)

def search_text(query: str, k: int = 3):
    q_emb = sbert.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    D, I = index_text.search(q_emb, k)
    return [catalog[i] for i in I[0]]

# Image embeddings (CLIP)
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

image_embeddings = []
for p in catalog:
    img_path = os.path.join(os.path.dirname(__file__), p["image_path"])
    img = Image.open(img_path).convert("RGB")
    inputs = clip_processor(images=img, return_tensors="pt")
    with torch.no_grad():
        embed = clip_model.get_image_features(**inputs)
    image_embeddings.append(embed[0].cpu().numpy())
image_embeddings = np.vstack(image_embeddings)
index_image = faiss.IndexFlatL2(image_embeddings.shape[1])
index_image.add(image_embeddings)

def search_image(file_bytes, k: int = 3):
    img = Image.open(file_bytes).convert("RGB")
    inputs = clip_processor(images=img, return_tensors="pt")
    with torch.no_grad():
        q_emb = clip_model.get_image_features(**inputs)[0].cpu().numpy()
    D, I = index_image.search(np.expand_dims(q_emb, 0), k)
    return [catalog[i] for i in I[0]]
