from fastapi import FastAPI

app = FastAPI()

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
async def set_color(color: Dict[str, int]):
    global brush_color
    brush_color = (color.get("b", 0), color.get("g", 0), color.get("r", 0))
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ["PORT"])
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        proxy_headers=True,
        reload=False
    )