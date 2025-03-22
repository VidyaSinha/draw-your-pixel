import cv2
import numpy as np
import mediapipe as mp

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7, max_num_hands=1)

def are_all_fingers_open(hand_landmarks):
    """Check if all fingers are extended."""
    tips = [4, 8, 12, 16, 20]  # Thumb, index, middle, ring, pinky tips
    pips = [3, 6, 10, 14, 18]  # Thumb IP, index PIP, middle PIP, ring PIP, pinky PIP
    fingers_open = sum(1 for tip_idx, pip_idx in zip(tips, pips) 
                       if hand_landmarks.landmark[tip_idx].y < hand_landmarks.landmark[pip_idx].y)
    return fingers_open == 5

def are_all_fingers_closed(hand_landmarks):
    """Check if all fingers are closed (fisted)."""
    tips = [4, 8, 12, 16, 20]
    pips = [3, 6, 10, 14, 18]
    fingers_closed = sum(1 for tip_idx, pip_idx in zip(tips, pips) 
                         if hand_landmarks.landmark[tip_idx].y > hand_landmarks.landmark[pip_idx].y)
    return fingers_closed == 5

def is_index_extended(hand_landmarks):
    """Check if the index finger is extended."""
    index_tip = 8
    index_pip = 6
    return hand_landmarks.landmark[index_tip].y < hand_landmarks.landmark[index_pip].y

# Cursor drawing functions
def draw_plus(img, center, color, size):
    """Draw plus sign cursor for idle mode"""
    cv2.line(img, (center[0]-size, center[1]), (center[0]+size, center[1]), color, 2)
    cv2.line(img, (center[0], center[1]-size), (center[0], center[1]+size), color, 2)

def draw_brush(img, center, color, size):
    """Draw brush cursor (circle with tail) for drawing mode"""
    cv2.circle(img, center, size//2, color, -1)
    cv2.line(img, (center[0], center[1]+size//2), (center[0], center[1]+size), color, 2)

def draw_eraser(img, center, color, size):
    """Draw eraser cursor (rectangle) for erasing mode"""
    cv2.rectangle(img, (center[0]-size, center[1]-size//2), (center[0]+size, center[1]+size//2), color, 2)

# Initialize webcam and canvas
cap = cv2.VideoCapture(0)
ret, frame = cap.read()
h, w, _ = frame.shape

canvas = np.ones((h, w, 3), dtype=np.uint8) * 255  # White canvas
canvas_overlay = canvas.copy()

# Settings
brush_thickness = 5
eraser_thickness = 20
smoothing_factor = 0.5
cursor_size = 20
brush_color = (0, 0, 0)  # Black
prev_x, prev_y = 0, 0
prev_pos = None
current_pos = None  # Initialize current_pos

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)

    # Reset canvas overlay and cursor state
    canvas_overlay = canvas.copy()
    current_pos = None
    cursor_type = "idle"

    if results.multi_hand_landmarks:
        hand_landmarks = results.multi_hand_landmarks[0]
        index_tip = hand_landmarks.landmark[8]

        # Smooth coordinates
        raw_x, raw_y = int(index_tip.x * w), int(index_tip.y * h)
        ix = int(prev_x * smoothing_factor + raw_x * (1 - smoothing_factor))
        iy = int(prev_y * smoothing_factor + raw_y * (1 - smoothing_factor))
        prev_x, prev_y = ix, iy
        current_pos = (ix, iy)

        # Gesture detection and drawing
        if are_all_fingers_open(hand_landmarks):
            cursor_type = "eraser"
            if prev_pos is not None:  # Check if prev_pos exists
                cv2.line(canvas, prev_pos, current_pos, (255, 255, 255), eraser_thickness)
            prev_pos = current_pos
        elif are_all_fingers_closed(hand_landmarks):
            cursor_type = "idle"
            prev_pos = None
        elif is_index_extended(hand_landmarks):
            cursor_type = "brush"
            if prev_pos is not None:  # Check if prev_pos exists
                cv2.line(canvas, prev_pos, current_pos, brush_color, brush_thickness)
            prev_pos = current_pos
        else:
            cursor_type = "idle"
            prev_pos = None

        # Draw landmarks
        mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
    else:
        prev_pos = None

    # Draw cursor on overlay
    if current_pos:
        if cursor_type == "brush":
            draw_brush(canvas_overlay, current_pos, brush_color, cursor_size)
        elif cursor_type == "eraser":
            draw_eraser(canvas_overlay, current_pos, (0, 0, 255), cursor_size)
        else:
            draw_plus(canvas_overlay, current_pos, (0, 255, 0), cursor_size//2)

    # Display mode text
    cv2.putText(frame, f"Mode: {cursor_type.upper()}", (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    # Combine views
    combined = np.hstack((frame, canvas_overlay))
    cv2.imshow("Air Canvas", combined)

    # Controls
    key = cv2.waitKey(1)
    if key == ord('q'):
        break
    elif key == ord('s'):
        cv2.imwrite('canvas.png', canvas)
    elif key == ord('c'):
        brush_color = tuple(np.random.randint(0, 255, 3).tolist())

cap.release()
cv2.destroyAllWindows()
