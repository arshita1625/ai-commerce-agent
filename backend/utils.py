import os
import json
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
import faiss
from openai import OpenAI

# Load catalog
def load_catalog():
    with open("backend/product_catalog.json") as f:
        return json.load(f)

# Initialize OpenAI client and CLIP
openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Compute text embedding
def embed_text(text):
    resp = openai.embeddings.create(input=text, model="text-embedding-ada-002")
    return np.array(resp.data[0].embedding, dtype=np.float32)

# Build FAISS index for text
_catalog = load_catalog()
_embeddings_text = np.vstack([embed_text(p["description"]) for p in _catalog])
_index_text = faiss.IndexFlatL2(_embeddings_text.shape[1])
_index_text.add(_embeddings_text)

# Compute image embedding and index
_image_embeddings = []
for p in _catalog:
    img = Image.open(p["image_path"]).convert("RGB")
    inputs = clip_processor(images=img, return_tensors="pt")
    with torch.no_grad():
        embed = clip_model.get_image_features(**inputs)
    _image_embeddings.append(embed[0].numpy())
_image_embeddings = np.vstack(_image_embeddings)
_index_image = faiss.IndexFlatL2(_image_embeddings.shape[1])
_index_image.add(_image_embeddings)

# Search functions
def search_text(query, k=1):
    q_emb = embed_text(query)
    D, I = _index_text.search(np.expand_dims(q_emb, 0), k)
    return [_catalog[i] for i in I[0]]

def search_image(file_bytes, k=1):
    img = Image.open(file_bytes).convert("RGB")
    inputs = clip_processor(images=img, return_tensors="pt")
    with torch.no_grad():
        q_emb = clip_model.get_image_features(**inputs)[0].numpy()
    D, I = _index_image.search(np.expand_dims(q_emb, 0), k)
    return [_catalog[i] for i in I[0]]
