import os
import json
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from sentence_transformers import SentenceTransformer
import faiss

# Load product catalog
catalog_path = os.path.join(os.path.dirname(__file__), "product_catalog.json")
with open(catalog_path) as f:
    catalog = json.load(f)

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
