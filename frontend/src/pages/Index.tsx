
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Canvas from "@/components/Canvas";
import CameraView from "@/components/CameraView";
import ModeSelector from "@/components/ModeSelector";
import DetectionResult from "@/components/DetectionResult";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [mode, setMode] = useState<"draw" | "write">("draw");
  const [showCamera, setShowCamera] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [detecting, setDetecting] = useState(false);
  
  // Handle mode change
  const handleModeChange = (newMode: "draw" | "write") => {
    setMode(newMode);
    toast(`Switched to ${newMode === "draw" ? "Draw & Detect" : "Write"} mode`);
  };
  
  // Handle camera ready
  const handleCameraReady = () => {
    setCameraReady(true);
  };
  
  // Handle detect button click
  const handleDetect = () => {
    setDetecting(true);
    
    // Reset after detection complete
    setTimeout(() => {
      setDetecting(false);
    }, 4000);
  };
  
  // Handle detection result
  const handleDetectionComplete = (result: string) => {
    // Here you would typically do something with the result
    console.log("Detection result:", result);
  };
  
  // Initial animation
  useEffect(() => {
    // Show welcome toast on first load
    toast("Welcome to Draw & Detect", {
      description: "Use your camera to draw and let AI detect what you've drawn"
    });
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 p-6 flex flex-col items-center">
      <motion.div
        className="w-full max-w-5xl mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold relative inline-block"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
                Draw & Detect
              </span>
            </motion.h1>
            <motion.p 
              className="text-muted-foreground mt-2 max-w-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Use your camera to draw in the air and let AI detect what you've created
            </motion.p>
          </div>
          
          {/* Theme toggle */}
          <ThemeToggle />
        </div>
        
        {/* Mode selector */}
        <ModeSelector 
          activeMode={mode} 
          onModeChange={handleModeChange} 
        />
        
        {/* Main content */}
        <div className="relative w-full glass-dark p-8 rounded-xl">
          {/* Camera View */}
          <CameraView 
            isActive={showCamera} 
            onCameraReady={handleCameraReady} 
          />
          
          {/* Canvas for drawing */}
          <Canvas 
            isActive={!showCamera} 
            mode={mode} 
          />
          
          {/* Camera toggle button */}
          <motion.div 
            className="absolute top-4 right-4 z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="glass-dark text-foreground hover:bg-muted hover:bg-opacity-30"
              onClick={() => setShowCamera(!showCamera)}
            >
              {showCamera ? "Show Canvas" : "Show Camera"}
            </Button>
          </motion.div>
        </div>
        
        {/* Action buttons */}
        {mode === "draw" && (
          <motion.div 
            className="mt-6 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Button
              className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-purple hover:to-neon-blue text-white px-6"
              size="lg"
              disabled={detecting || !cameraReady}
              onClick={handleDetect}
            >
              <Wand2 size={18} className="mr-2" />
              Detect Drawing
            </Button>
          </motion.div>
        )}
      </motion.div>
      
      {/* Detection result */}
      <DetectionResult 
        detecting={detecting} 
        onDetectionComplete={handleDetectionComplete} 
      />
    </div>
  );
};

export default Index;
