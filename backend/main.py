import io
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from utils import openai, search_text, search_image

class ChatInput(BaseModel):
    message: str

app = FastAPI(title="AI Commerce Agent")

@app.post("/chat")
async def chat(input: ChatInput):
    resp = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": "You are a helpful shopping assistant."},
                  {"role": "user", "content": input.message}]
    )
    return {"response": resp.choices[0].message.content}

@app.post("/recommend")
async def recommend(input: ChatInput):
    results = search_text(input.message)
    return {"recommendations": results}

@app.post("/search-by-image")
async def img_search(file: UploadFile = File(...)):
    content = await file.read()
    buf = io.BytesIO(content)
    results = search_image(buf)
    return {"results": results"}
