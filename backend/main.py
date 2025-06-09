import io
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ollama_utils import llama_chat
from utils import search_text, search_image
from fastapi import FastAPI
from pydantic import BaseModel
# from llama_utils import llama_chat
# CORS setup
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatInput(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(input: ChatInput):
    try:
        # Blocking call is fine here—if you want, wrap in run_in_threadpool
        reply = llama_chat(input.message)
        return {"response": reply}
    except Exception as e:
        return {"error": str(e)}

class ChatInput(BaseModel):
    message: str

# @app.post("/chat")
# async def chat(input: ChatInput):
#     response = ollama_chat(input.message)
#     return {"response": response}

@app.post("/recommend")
async def recommend(input: ChatInput):
    recommendations = search_text(input.message)
    return {"recommendations": recommendations}

@app.post("/search-by-image")
async def img_search(file: UploadFile = File(...)):
    content = await file.read()
    buf = io.BytesIO(content)
    results = search_image(buf)
    return {"results": results}
