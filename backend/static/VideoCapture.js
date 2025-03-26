import React, { useEffect, useRef } from 'react';

const VideoCapture = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);

    useEffect(() => {
        let animationFrameId;
        const fps = 30;
        const frameInterval = 1000 / fps;
        let lastFrameTime = 0;

        // Initialize WebSocket connection
        wsRef.current = new WebSocket('ws://localhost:8000/ws');

        // Start video stream
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640,
                height: 480,
                frameRate: { ideal: 30, max: 30 }
            } 
        })
        .then(stream => {
            videoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Error accessing camera:", err));

        // Function to send frame to server
        const sendFrame = (currentTime) => {
            if (currentTime - lastFrameTime >= frameInterval) {
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                
                // Draw current video frame to canvas
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                
                // Convert canvas to blob and send to server
                canvas.toBlob((blob) => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            wsRef.current.send(JSON.stringify({
                                frame: reader.result
                            }));
                        };
                        reader.readAsArrayBuffer(blob);
                    }
                }, 'image/jpeg', 0.7); // Compress JPEG quality to 70%

                lastFrameTime = currentTime;
            }
            
            animationFrameId = requestAnimationFrame(sendFrame);
        };

        // Start the animation loop
        animationFrameId = requestAnimationFrame(sendFrame);

        // Cleanup
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ display: 'none' }}
            />
            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{ maxWidth: '100%' }}
            />
        </div>
    );
};

export default VideoCapture; 