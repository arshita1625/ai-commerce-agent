# AI Commerce Agent

## Overview
An AI-powered shopping assistant with chat, text-based product recommendations, and image search.

## Tech Stack
- **Backend**: FastAPI, FAISS, OpenAI, CLIP
- **Frontend**: React, Tailwind CSS

## Setup
### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export OPENAI_API_KEY=<your_key>
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Usage
- **Chat**: POST `/chat` with `{ "message": "..." }`
- **Recommend**: POST `/recommend` with `{ "message": "..." }`
- **Image Search**: POST `/search-by-image` form-data `file` field

## Deployment
- **Backend**: Docker + Render/Railway
- **Frontend**: Vercel or Netlify
