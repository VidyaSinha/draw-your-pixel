from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import numpy as np
import os
import cv2
from io import BytesIO
import time
import logging
import app

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize drawing components
canvas = np.ones((480, 640, 3), dtype=np.uint8) * 255
brush_color = (0, 0, 255)  # Default to red color

@app.get("/")
async def root():
    return {"message": "Server running"}

def process_frame():
    global canvas
    while True:
        _, buffer = cv2.imencode(".jpg", canvas)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.1)

@app.get("/video_feed")
async def video_feed():
    return StreamingResponse(
        process_frame(),
        media_type='multipart/x-mixed-replace;boundary=frame'
    )

@app.post("/clear_canvas")
async def clear_canvas():
    global canvas
    if canvas is not None:
        canvas = np.ones_like(canvas) * 255
    return {"status": "success"}

@app.post("/set_color")
async def set_color(color: Dict[str, int]):
    global brush_color
    brush_color = (color.get("b", 0), color.get("g", 0), color.get("r", 0))
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    logging.basicConfig(level=logging.INFO)
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"
    logging.info(f"Starting server on {host}:{port}")
    uvicorn.run(
        app,
        host=host,
        port=port,
        workers=1
    )