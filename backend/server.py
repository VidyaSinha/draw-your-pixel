import asyncio
import json
import cv2
import numpy as np
import mediapipe as mp
import os
import gc
from flask import Flask, render_template, send_from_directory
from flask_sock import Sock

app = Flask(__name__)
sock = Sock(app)

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands

# Serve static files
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

# Serve index page
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# WebSocket endpoint for real-time hand tracking
@sock.route('/ws')
def handle_websocket(ws):
    # Initialize hands object within the WebSocket context
    hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7, max_num_hands=1)
    try:
        while True:
            # Receive frame data from client
            frame_data = ws.receive()
            
            # Convert binary data to numpy array
            frame_array = np.frombuffer(frame_data, dtype=np.uint8)
            frame = frame_array.reshape((480, 640, 4))  # RGBA format
            
            # Convert to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_RGBA2RGB)
            
            # Process frame with MediaPipe
            results = hands.process(rgb_frame)
            
            # Clear unused variables
            del frame_array
            del frame
            del rgb_frame
            
            response_data = {
                'mode': 'idle',
                'hand_data': []
            }
            
            if results.multi_hand_landmarks:
                hand_landmarks = results.multi_hand_landmarks[0]
                
                # Extract hand landmarks
                landmarks = [{
                    'x': lm.x,
                    'y': lm.y,
                    'z': lm.z
                } for lm in hand_landmarks.landmark]
                
                # Detect gestures
                index_tip = landmarks[8]
                thumb_tip = landmarks[4]
                
                # Calculate distance between thumb and index
                distance = np.sqrt(
                    (thumb_tip['x'] - index_tip['x'])**2 +
                    (thumb_tip['y'] - index_tip['y'])**2
                )
                
                # Determine mode based on finger positions
                if all(landmarks[tip]['y'] < landmarks[pip]['y'] 
                       for tip, pip in zip([8,12,16,20], [6,10,14,18])):
                    response_data['mode'] = 'eraser'
                elif landmarks[8]['y'] < landmarks[6]['y']:
                    response_data['mode'] = 'draw'
                
                response_data['hand_data'] = landmarks
            
            # Send response back to client
            ws.send(json.dumps(response_data))
            
            # Clear MediaPipe results
            del results
            
            # Force garbage collection
            gc.collect()
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Clean up MediaPipe resources
        hands.close()
        del hands
        gc.collect()

if __name__ == '__main__':
    # Get port from environment variable with fallback to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)