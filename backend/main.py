from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import List, Optional
from services.ml_service import analyze_text
from services.ocr_service import extract_text
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    text: str

class Issue(BaseModel):
    text: str
    correction: str
    type: str # grammar | spelling | clarity
    severity: str # low | medium | high
    explanation: str
    confidence: float
    start: int
    end: int

class Metrics(BaseModel):
    grammar_score: int
    spelling_score: int
    clarity_score: int
    overall_score: int

class AnalysisResponse(BaseModel):
    issues: List[Issue]
    metrics: Metrics

@app.get("/")
def read_root():
    return {"message": "Elite AI Writing Assistant API is running locally (offline)."}

import asyncio
from concurrent.futures import ThreadPoolExecutor

# High-concurrency thread pool for CPU-bound NLP inference
executor = ThreadPoolExecutor(max_workers=4)

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):
    if len(request.text) > 1000:
        raise HTTPException(status_code=400, detail="Text exceeds the maximum limit of 1000 characters.")
        
    # Offload heavy Neural Operations to avoid blocking the ASGI event loop
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, analyze_text, request.text)
    
    return AnalysisResponse(
        issues=result["issues"],
        metrics=result["metrics"]
    )

@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    contents = await file.read()
    text = extract_text(contents)
    return {"text": text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
