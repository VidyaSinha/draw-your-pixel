class AirCanvas {
    constructor() {
        this.video = document.getElementById('video');
        this.landmarksCanvas = document.getElementById('landmarksCanvas');
        this.drawingCanvas = document.getElementById('drawingCanvas');
        this.currentMode = document.getElementById('currentMode');
        this.clearBtn = document.getElementById('clearBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.brushSize = document.getElementById('brushSize');
        
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.fps = 0;
        this.isStreaming = false;
        
        this.initializeCanvases();
        this.initializeWebSocket();
        this.initializeControls();
        this.initializeColorPalette();
        this.startVideoStream();
    }

    initializeCanvases() {
        const setCanvasSize = (canvas) => {
            canvas.width = 640;
            canvas.height = 480;
        };

        setCanvasSize(this.landmarksCanvas);
        setCanvasSize(this.drawingCanvas);

        this.landmarksCtx = this.landmarksCanvas.getContext('2d', { alpha: true });
        this.drawingCtx = this.drawingCanvas.getContext('2d', { alpha: false });
        
        // Enable image smoothing for better quality
        this.drawingCtx.imageSmoothingEnabled = true;
        this.drawingCtx.imageSmoothingQuality = 'high';
        
        // Set white background for drawing canvas
        this.drawingCtx.fillStyle = 'white';
        this.drawingCtx.fillRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
    }

    initializeWebSocket() {
        const connectWebSocket = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            this.ws = new WebSocket(wsUrl);
            this.ws.binaryType = 'arraybuffer';
            
            this.ws.onmessage = this.handleWebSocketMessage.bind(this);
            
            this.ws.onclose = () => {
                console.log('WebSocket connection closed. Attempting to reconnect...');
                setTimeout(connectWebSocket, 1000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.currentMode.textContent = 'CONNECTION ERROR';
                this.currentMode.style.color = '#ff0000';
            };
        };
        
        connectWebSocket();
    }

    initializeControls() {
        this.clearBtn.onclick = () => {
            this.drawingCtx.fillStyle = 'white';
            this.drawingCtx.fillRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        };

        this.saveBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `air-canvas-${new Date().toISOString()}.png`;
            link.href = this.drawingCanvas.toDataURL('image/png');
            link.click();
        };
    }

    initializeColorPalette() {
        const colors = [
            '#000000', '#FF0000', '#00FF00', '#0000FF',
            '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800'
        ];
        
        const palette = document.getElementById('colorPalette');
        colors.forEach(color => {
            const btn = document.createElement('div');
            btn.className = 'color-btn';
            btn.style.backgroundColor = color;
            btn.onclick = () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentColor = color;
            };
            palette.appendChild(btn);
        });
        
        // Set initial color
        palette.firstChild.classList.add('active');
        this.currentColor = colors[0];
    }

    async startVideoStream() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 60 },
                    facingMode: 'user'
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = stream;
            
            this.video.onloadedmetadata = () => {
                this.isStreaming = true;
                this.startFrameCapture();
            };

            // Handle video errors
            this.video.onerror = (error) => {
                console.error('Video error:', error);
                this.isStreaming = false;
            };
        } catch (err) {
            console.error('Error accessing camera:', err);
            this.currentMode.textContent = 'CAMERA ERROR';
            this.currentMode.style.color = '#ff0000';
        }
    }

    startFrameCapture() {
        let lastFrameTime = performance.now();
        const targetFrameTime = 1000 / 30; // Target 30 FPS for WebSocket communication

        const processFrame = async (currentTime) => {
            if (!this.isStreaming) return;

            const deltaTime = currentTime - lastFrameTime;

            // Limit WebSocket frame sending rate
            if (deltaTime >= targetFrameTime) {
                lastFrameTime = currentTime;

                // Draw video frame to landmarks canvas
                this.landmarksCtx.drawImage(this.video, 0, 0);

                // Send frame data through WebSocket
                if (this.ws.readyState === WebSocket.OPEN) {
                    try {
                        const imageData = this.landmarksCtx.getImageData(
                            0, 0,
                            this.landmarksCanvas.width,
                            this.landmarksCanvas.height
                        );
                        const buffer = imageData.data.buffer;
                        this.ws.send(buffer);
                    } catch (error) {
                        console.error('Error sending frame:', error);
                    }
                }
            }

            requestAnimationFrame(processFrame);
        };

        requestAnimationFrame(processFrame);
    }

    handleWebSocketMessage(event) {
        const data = JSON.parse(event.data);
        
        // Update mode display with animation
        if (data.mode) {
            const newMode = data.mode.toUpperCase();
            if (this.currentMode.textContent !== newMode) {
                this.currentMode.style.transition = 'color 0.3s ease';
                this.currentMode.textContent = newMode;
                this.currentMode.style.color = data.mode === 'draw' ? '#00ff00' : '#ff9800';
            }
        }
        
        // Handle drawing with improved smoothing
        if (data.hand_data && data.hand_data.length > 0) {
            const landmarks = data.hand_data;
            this.drawHandLandmarks(landmarks);
            
            if (data.mode === 'draw') {
                const index_finger_tip = landmarks[8];
                const x = index_finger_tip.x * this.drawingCanvas.width;
                const y = index_finger_tip.y * this.drawingCanvas.height;
                
                if (this.lastPoint) {
                    // Smooth line drawing
                    this.drawingCtx.beginPath();
                    this.drawingCtx.moveTo(this.lastPoint.x, this.lastPoint.y);
                    
                    // Use quadratic curve for smoother lines
                    const midPoint = {
                        x: (this.lastPoint.x + x) / 2,
                        y: (this.lastPoint.y + y) / 2
                    };
                    
                    this.drawingCtx.quadraticCurveTo(
                        this.lastPoint.x,
                        this.lastPoint.y,
                        midPoint.x,
                        midPoint.y
                    );
                    
                    this.drawingCtx.strokeStyle = this.currentColor;
                    this.drawingCtx.lineWidth = this.brushSize.value;
                    this.drawingCtx.lineCap = 'round';
                    this.drawingCtx.lineJoin = 'round';
                    this.drawingCtx.stroke();
                }
                this.lastPoint = { x, y };
            } else {
                this.lastPoint = null;
            }
        }
    }

    drawHandLandmarks(landmarks) {
        this.landmarksCtx.clearRect(0, 0, this.landmarksCanvas.width, this.landmarksCanvas.height);
        
        // Draw hand connections with glow effect
        this.landmarksCtx.shadowColor = 'rgba(0, 255, 0, 0.5)';
        this.landmarksCtx.shadowBlur = 15;
        this.landmarksCtx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        this.landmarksCtx.lineWidth = 3;
        
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.landmarksCanvas.width;
            const y = landmark.y * this.landmarksCanvas.height;
            
            // Draw landmark points
            this.landmarksCtx.beginPath();
            this.landmarksCtx.arc(x, y, 4, 0, 2 * Math.PI);
            this.landmarksCtx.fillStyle = 'rgba(0, 255, 0, 1)';
            this.landmarksCtx.fill();
            
            // Draw connections between landmarks
            if (index > 0) {
                const prevLandmark = landmarks[index - 1];
                const prevX = prevLandmark.x * this.landmarksCanvas.width;
                const prevY = prevLandmark.y * this.landmarksCanvas.height;
                
                this.landmarksCtx.beginPath();
                this.landmarksCtx.moveTo(prevX, prevY);
                this.landmarksCtx.lineTo(x, y);
                this.landmarksCtx.stroke();
            }
        });
        
        // Reset shadow effect
        this.landmarksCtx.shadowBlur = 0;
    }
}

// Initialize the application when the page loads
window.onload = () => {
    new AirCanvas();
};