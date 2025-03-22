from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
import mediapipe as mp
from typing import Dict
import json
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7, max_num_hands=1)

# Initialize webcam
cap = cv2.VideoCapture(0)

# Canvas settings
canvas = None
brush_color = (0, 0, 0)
brush_thickness = 5
eraser_thickness = 20
smoothing_factor = 0.5
prev_x, prev_y = 0, 0
prev_pos = None

def are_all_fingers_open(hand_landmarks):
    tips = [4, 8, 12, 16, 20]
    pips = [3, 6, 10, 14, 18]
    fingers_open = sum(1 for tip_idx, pip_idx in zip(tips, pips)
                      if hand_landmarks.landmark[tip_idx].y < hand_landmarks.landmark[pip_idx].y)
    return fingers_open == 5

def are_all_fingers_closed(hand_landmarks):
    tips = [4, 8, 12, 16, 20]
    pips = [3, 6, 10, 14, 18]
    fingers_closed = sum(1 for tip_idx, pip_idx in zip(tips, pips)
                        if hand_landmarks.landmark[tip_idx].y > hand_landmarks.landmark[pip_idx].y)
    return fingers_closed == 5

def is_index_extended(hand_landmarks):
    index_tip = 8
    index_pip = 6
    return hand_landmarks.landmark[index_tip].y < hand_landmarks.landmark[index_pip].y

def process_frame():
    global canvas, prev_x, prev_y, prev_pos
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)
        
        # Initialize canvas if not exists
        if canvas is None:
            h, w = frame.shape[:2]
            canvas = np.ones((h, w, 3), dtype=np.uint8) * 255
        
        hand_data = {
            "isDetected": False,
            "mode": "idle",
            "position": None
        }
        
        if results.multi_hand_landmarks:
            hand_landmarks = results.multi_hand_landmarks[0]
            index_tip = hand_landmarks.landmark[8]
            
            h, w = frame.shape[:2]
            raw_x, raw_y = int(index_tip.x * w), int(index_tip.y * h)
            ix = int(prev_x * smoothing_factor + raw_x * (1 - smoothing_factor))
            iy = int(prev_y * smoothing_factor + raw_y * (1 - smoothing_factor))
            prev_x, prev_y = ix, iy
            current_pos = (ix, iy)
            
            hand_data["isDetected"] = True
            hand_data["position"] = current_pos
            
            if are_all_fingers_open(hand_landmarks):
                hand_data["mode"] = "eraser"
                if prev_pos:
                    cv2.line(canvas, prev_pos, current_pos, (255, 255, 255), eraser_thickness)
                prev_pos = current_pos
            elif are_all_fingers_closed(hand_landmarks):
                hand_data["mode"] = "idle"
                prev_pos = None
            elif is_index_extended(hand_landmarks):
                hand_data["mode"] = "brush"
                if prev_pos:
                    cv2.line(canvas, prev_pos, current_pos, brush_color, brush_thickness)
                prev_pos = current_pos
            else:
                hand_data["mode"] = "idle"
                prev_pos = None
                
            # Draw landmarks
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
        else:
            prev_pos = None
        
        # Encode frame and canvas
        _, encoded_frame = cv2.imencode('.jpg', frame)
        _, encoded_canvas = cv2.imencode('.jpg', canvas)
        
        # Prepare multipart response
        frame_data = encoded_frame.tobytes()
        canvas_data = encoded_canvas.tobytes()
        
        # Yield the frame data with metadata
        yield b'--frame\r\n'
        yield b'Content-Type: application/json\r\n\r\n'
        yield json.dumps(hand_data).encode() + b'\r\n'
        yield b'--frame\r\n'
        yield b'Content-Type: image/jpeg\r\n\r\n'
        yield frame_data + b'\r\n'
        yield b'--frame\r\n'
        yield b'Content-Type: image/jpeg\r\n\r\n'
        yield canvas_data + b'\r\n'

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
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)