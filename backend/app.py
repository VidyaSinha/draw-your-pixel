import cv2
import numpy as np
import mediapipe as mp

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7, max_num_hands=1)

# Gesture detection functions
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
    """Draw plus sign cursor for idle/select mode."""
    cv2.line(img, (center[0]-size, center[1]), (center[0]+size, center[1]), color, 2)
    cv2.line(img, (center[0], center[1]-size), (center[0], center[1]+size), color, 2)

def draw_brush(img, center, color, size):
    """Draw brush cursor (circle with tail) for drawing mode."""
    cv2.circle(img, center, size//2, color, -1)
    cv2.line(img, (center[0], center[1]+size//2), (center[0], center[1]+size), color, 2)

def draw_eraser(img, center, color, size):
    """Draw eraser cursor (rectangle) for erasing mode."""
    cv2.rectangle(img, (center[0]-size, center[1]-size//2), (center[0]+size, center[1]+size//2), color, 2)

# Define color palette (original + pastel colors in BGR)
colors = [
    (0, 0, 255),      # Red
    (0, 255, 0),      # Green
    (255, 0, 0),      # Blue
    (0, 0, 0),        # Black
    (255, 192, 203),  # Pastel Pink
    (173, 216, 230),  # Pastel Blue
    (152, 251, 152),  # Pastel Green
    (255, 255, 224),  # Pastel Yellow
]

# Initialize webcam and canvas
cap = cv2.VideoCapture(0)
ret, frame = cap.read()
h, w, _ = frame.shape

canvas = np.ones((h, w, 3), dtype=np.uint8) * 255  # White canvas
canvas_overlay = canvas.copy()

# Generate color buttons dynamically
button_width = 50
button_height = 50
button_gap = 10
total_button_width = len(colors) * button_width + (len(colors) - 1) * button_gap
start_x = (w - total_button_width) // 2
buttons = []
for i, color in enumerate(colors):
    x1 = start_x + i * (button_width + button_gap)
    x2 = x1 + button_width
    y1 = h - 60
    y2 = y1 + button_height
    buttons.append({"rect": (x1, y1, x2, y2), "color": color})

# Settings
brush_thickness = 3
eraser_thickness = 25
smoothing_factor = 0.3
cursor_size = 13
brush_color = (0, 0, 0)  # Initial color: black
prev_x, prev_y = 0, 0
prev_pos = None
current_pos = None

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
        index_tip = hand_landmarks.landmark[8]  # Index finger tip
        thumb_tip = hand_landmarks.landmark[4]  # Thumb tip

        # Get raw positions
        index_x = int(index_tip.x * w)
        index_y = int(index_tip.y * h)
        thumb_x = int(thumb_tip.x * w)
        thumb_y = int(thumb_tip.y * h)

        # Smooth coordinates
        ix = int(prev_x * smoothing_factor + index_x * (1 - smoothing_factor))
        iy = int(prev_y * smoothing_factor + index_y * (1 - smoothing_factor))
        prev_x, prev_y = ix, iy
        current_pos = (ix, iy)

        # Calculate distance between thumb and index tips (in pixels)
        distance = ((thumb_x - index_x)**2 + (thumb_y - index_y)**2)**0.5

        # Check if index finger is in the button area (bottom 70 pixels)
        if iy >= h - 70:
            cursor_type = "select"
            hovered_button = None
            # Find which button is being hovered over
            for button in buttons:
                x1, y1, x2, y2 = button["rect"]
                if x1 <= ix <= x2 and y1 <= iy <= y2:
                    hovered_button = button
                    break
            # Select color if thumb is close to index finger
            if hovered_button and distance < 30:
                brush_color = hovered_button["color"]
            prev_pos = None  # Prevent drawing in button area
        else:
            # Gesture detection and drawing logic
            if are_all_fingers_open(hand_landmarks):
                cursor_type = "eraser"
                if prev_pos is not None:
                    cv2.line(canvas, prev_pos, current_pos, (255, 255, 255), eraser_thickness)
                prev_pos = current_pos
            elif are_all_fingers_closed(hand_landmarks):
                cursor_type = "idle"
                prev_pos = None
            elif is_index_extended(hand_landmarks):
                cursor_type = "brush"
                if prev_pos is not None:
                    cv2.line(canvas, prev_pos, current_pos, brush_color, brush_thickness)
                prev_pos = current_pos
            else:
                cursor_type = "idle"
                prev_pos = None

        # Draw hand landmarks on the frame
        mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
    else:
        prev_pos = None

    # Draw color buttons on canvas_overlay
    for button in buttons:
        x1, y1, x2, y2 = button["rect"]
        color = button["color"]
        cv2.rectangle(canvas_overlay, (x1, y1), (x2, y2), color, -1)
        # Highlight hovered button with a black border
        if cursor_type == "select" and hovered_button == button:
            cv2.rectangle(canvas_overlay, (x1, y1), (x2, y2), (0, 0, 0), 2)

    # Draw cursor on overlay
    if current_pos:
        if cursor_type == "brush":
            draw_brush(canvas_overlay, current_pos, brush_color, cursor_size)
        elif cursor_type == "eraser":
            draw_eraser(canvas_overlay, current_pos, (0, 0, 255), cursor_size)
        elif cursor_type == "select":
            draw_plus(canvas_overlay, current_pos, (255, 0, 0), cursor_size//2)  # Red plus for select mode
        else:
            draw_plus(canvas_overlay, current_pos, (0, 255, 0), cursor_size//2)  # Green plus for idle

    # Display mode text
    cv2.putText(frame, f"Mode: {cursor_type.upper()}", (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    # Combine webcam feed and canvas
    combined = np.hstack((frame, canvas_overlay))
    cv2.imshow("Air Canvas", combined)

    # Controls
    key = cv2.waitKey(1)
    if key == ord('q'):
        break
    elif key == ord('s'):
        cv2.imwrite('canvas.png', canvas)

cap.release()
cv2.destroyAllWindows()