from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from typing import Dict
import numpy as np
import os

app = FastAPI()

# Initialize drawing components
canvas = np.ones((480, 640, 3), dtype=np.uint8) * 255
brush_color = (0, 0, 255) # Default to red color

@app.get("/")
async def root():
    return {"message": "Server running"}

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
async def set_color(color: dict[str, int]):
    global brush_color
    brush_color = (color.get("b", 0), color.get("g", 0), color.get("r", 0))
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "5000"))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        proxy_headers=True,
        reload=False
    )