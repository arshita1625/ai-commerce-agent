# AI Commerce Agent Backend (Ollama Integration)

## Overview
This FastAPI backend uses:
- **Ollama CLI** for chat (local models)
- **SBERT + FAISS** for text-based recommendations
- **CLIP + FAISS** for image-based search

## Prerequisites
1. **Install Ollama**: https://ollama.com/docs/quickstart  
2. **Pull model**:  
   ```bash
   ollama pull llama2
   ```
3. **Python dependencies**:
   ```bash
   cd backend
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   ```
4. **Product Images**:  
   Place images under `backend/images/` matching `product_catalog.json`.

## Running
```bash
uvicorn main:app --reload
```

## Endpoints
- **Chat**: `POST /chat` → `{ "message": "Hello" }`  
- **Recommend**: `POST /recommend` → `{ "message": "Recommend a t-shirt" }`  
- **Image Search**: `POST /search-by-image` (form-data `file`)
