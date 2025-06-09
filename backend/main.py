import io
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ollama_utils import llama_chat
from utils import search_text, search_image , recommend_products
from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
from fastapi.staticfiles import StaticFiles
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
# app.mount("/images", StaticFiles(directory="images"), name="images")
BASE_DIR = Path(__file__).resolve().parent
IMAGES_DIR = BASE_DIR / "images"
print("base",BASE_DIR)
# Mount it at /images
app.mount(
    "/images",
    StaticFiles(directory=str(IMAGES_DIR)),
    name="images"
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
    results = recommend_products(input.message)
    return {"recommendations": results}

@app.post("/search-by-image")
async def img_search(file: UploadFile = File(...)):
    content = await file.read()
    buf = io.BytesIO(content)
    results = search_image(buf)
    return {"results": results}
