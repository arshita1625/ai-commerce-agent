# AI Commerce Agent Backend (Ollama Integration)

An end-to-end AI-powered shopping assistant for a commerce website. It combines a React frontend with a FastAPI backend, offering:

- **General chat** via Ollama LLaMA-based model  
- **Text-based product recommendations** (semantic + strict catalog match)  
- **Image-based product search** (CLIP embeddings + category filter)  

![App Screenshot](docs/images/app_screenshot.png)

---
## Project Structure
.
├── backend/
│   ├── main.py             # FastAPI app + static mount + CORS
│   ├── utils.py            # Search logic (embeddings + strict match)
│   ├── ollama_utils.py     # Ollama CLI wrapper for chat
│   ├── product_catalog.json
│   ├── images/             # Product images
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # React chat UI
│   │   └── App.css
│   ├── public/             # webpack static assets
│   ├── package.json
│   └── webpack.config.js
├── Dockerfile              # Multi-stage build for Cloud Run
└── README.md

## 🏗 Architecture

This FastAPI backend uses:
- **Ollama CLI** for chat (local models)
- **SBERT + FAISS** for text-based recommendations
- **CLIP + FAISS** for image-based search

### Prerequisites

- Python 3.11 + pip  
- Node.js 18 + npm  
- Git

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
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

## API Reference

All endpoints are served from the same origin as your app (no hard-coded host/port). Use **POST** for the API routes.

---

### `GET /`

Serves the React frontend (`index.html`).

**Response:**  
- Content-Type: `text/html`  
- Your single-page app UI.

---

### `GET /health`

Simple health check.

**Request:**  
```http
GET /health HTTP/1.1
Host: your-domain.com

Status: 200 OK
{
  "status": "ok"
}
--- 
### `POST /chat`
{
  "message": "Hello, what can you do?"
}
Response: 
Status: 200 OK
{
  "response": "Hi there! I can help you find products, answer questions, and more."
}
### `POST /recommend`
{
  "message": "Recommend me a t-shirt for sports"
}
Status: 200 OK
{
  "recommendations": [
    {
      "id": 1,
      "name": "Nike Dry-Fit Sports T-Shirt",
      "description": "Lightweight t-shirt for workouts",
      "image_path": "nike1.jpg",
      "category": "t-shirt",
      "tags": ["sports", "workout"]
    },
    {
      "id": 3,
      "name": "Under Armour HeatGear T-Shirt",
      "description": "Performance tee with four-way stretch",
      "image_path": "ua_heatgear.png",
      "category": "t-shirt",
      "tags": ["sports", "performance"]
    }
  ]
}
POST /search-by-image
Response: 
Status: 200 OK
{
  "results": [
    {
      "id": 2,
      "name": "Revlon Super Lustrous Lipstick",
      "image_path": "revlon_lipstick.png"
    },
    {
      "id": 5,
      "name": "L’Oréal Voluminous Mascara",
      "image_path": "loreal_mascara.png"
    }
  ]
}
