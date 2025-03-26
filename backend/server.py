from fastapi import FastAPI, WebSocket
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import numpy as np
import os
import cv2
from io import BytesIO
import time
import logging
import json
import base64
import app
import mediapipe as mp

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

# Initialize MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7,
    max_num_hands=1
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Receive base64 image from client
            data = await websocket.receive_json()
            
            # Process hand tracking
            image_data = np.frombuffer(data['frame'], dtype=np.uint8)
            frame = cv2.imdecode(image_data, cv2.IMREAD_COLOR)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)
            
            # Send hand landmarks back to client
            response = {
                'hand_data': None
            }
            
            if results.multi_hand_landmarks:
                # Convert landmarks to a serializable format
                landmarks = []
                for hand_landmarks in results.multi_hand_landmarks:
                    for landmark in hand_landmarks.landmark:
                        landmarks.append({
                            'x': landmark.x,
                            'y': landmark.y,
                            'z': landmark.z
                        })
                response['hand_data'] = landmarks
            
            await websocket.send_json(response)
    
    except Exception as e:
        logging.error(f"WebSocket error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Server running"}

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
    import asyncio
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