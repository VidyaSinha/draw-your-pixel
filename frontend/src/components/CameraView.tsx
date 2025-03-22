
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";

interface CameraViewProps {
  isActive: boolean;
  onCameraReady: () => void;
}

interface HandData {
  isDetected: boolean;
  mode: 'idle' | 'brush' | 'eraser';
  position: [number, number] | null;
}

const CameraView = ({ isActive, onCameraReady }: CameraViewProps) => {
  const videoRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLImageElement>(null);
  const [streamStarted, setStreamStarted] = useState(false);
  
  useEffect(() => {
    if (!isActive) return;

    let imageStream: EventSource | null = null;

    const startStream = () => {
      imageStream = new EventSource('http://localhost:8000/video_feed');
      let frameCount = 0;

      imageStream.onmessage = (event) => {
        const data = event.data;
        frameCount++;

        if (frameCount % 3 === 1) {
          // Process hand data
          try {
            const handData: HandData = JSON.parse(data);
            // Handle hand data here
            console.log('Hand data:', handData);
          } catch (e) {
            // Skip non-JSON messages (frame data)
          }
        } else if (frameCount % 3 === 2 && videoRef.current) {
          // Process camera frame
          videoRef.current.src = `data:image/jpeg;base64,${btoa(data)}`;
        } else if (frameCount % 3 === 0 && canvasRef.current) {
          // Process canvas frame
          canvasRef.current.src = `data:image/jpeg;base64,${btoa(data)}`;
        }

        if (!streamStarted) {
          setStreamStarted(true);
          onCameraReady();
          toast.success('Camera connected successfully');
        }
      };

      imageStream.onerror = (error) => {
        console.error('Stream error:', error);
        toast.error('Camera stream error. Please make sure the backend server is running.');
        if (imageStream) {
          imageStream.close();
        }
      };
    };

    startStream();

    return () => {
      if (imageStream) {
        imageStream.close();
      }
    };
  }, [isActive, onCameraReady]);

  if (!isActive) return null;

  return (
    <motion.div 
      className="relative w-full h-full flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass rounded-xl w-full max-w-3xl h-[400px] md:h-[500px] relative overflow-hidden">
        <img
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Camera feed"
        />
        <img
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ mixBlendMode: 'multiply' }}
          alt="Drawing canvas"
        />
        
        <AnimatePresence>
          {!streamStarted && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="text-center"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-lg font-medium mb-4">
                  Connecting to camera...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CameraView;
