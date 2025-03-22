
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trash, Download } from "lucide-react";
import BrushControls from "./BrushControls";

interface CanvasProps {
  isActive: boolean;
  mode: "draw" | "write";
}

const Canvas = ({ isActive, mode }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState(mode === "draw" ? "#713eff" : "#36b9ff");
  
  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    // Set canvas dimensions to fill container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    if (context) {
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      context.fillStyle = "#ffffff"; // White background
      context.fillRect(0, 0, canvas.width, canvas.height);
      setCtx(context);
    }
    
    // Handle resize
    const handleResize = () => {
      if (!canvas || !context) return;
      
      // Save current drawing
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Resize canvas
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Fill with white background
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Restore drawing and settings
      context.putImageData(imageData, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [brushColor, brushSize, mode]);
  
  // Update drawing settings when mode changes
  useEffect(() => {
    if (!ctx) return;
    setBrushColor(mode === "draw" ? "#713eff" : "#36b9ff");
    ctx.strokeStyle = mode === "draw" ? "#713eff" : "#36b9ff";
    ctx.lineWidth = brushSize;
  }, [mode, ctx, brushSize]);
  
  // Update brush settings
  useEffect(() => {
    if (!ctx) return;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
  }, [brushColor, brushSize, ctx]);
  
  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    setIsDrawing(true);
    
    // Get coordinates
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let x, y;
    
    if ('touches' in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  // Draw
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;
    
    // Get coordinates
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let x, y;
    
    if ('touches' in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  // Stop drawing
  const stopDrawing = () => {
    if (!ctx) return;
    setIsDrawing(false);
    ctx.closePath();
  };
  
  // Clear canvas
  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = "#ffffff"; // White background
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  
  // Download canvas as image
  const downloadCanvas = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${mode === "draw" ? "drawing" : "writing"}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };
  
  return (
    <motion.div 
      className={`relative w-full h-full flex flex-col items-center justify-center ${!isActive && 'hidden'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass rounded-xl w-full max-w-3xl h-[400px] md:h-[500px] relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full absolute inset-0 touch-none bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      
      {/* Brush controls */}
      <BrushControls
        onBrushChange={setBrushSize}
        onColorChange={setBrushColor}
        currentBrushSize={brushSize}
        currentColor={brushColor}
      />
      
      <div className="mt-4 flex space-x-3">
        <Button 
          variant="outline" 
          size="sm"
          className="glass-dark text-foreground flex items-center space-x-1 hover:neon-glow-purple"
          onClick={clearCanvas}
        >
          <Trash size={16} className="mr-1" />
          Clear
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className="glass-dark text-foreground flex items-center space-x-1 hover:neon-glow-blue"
          onClick={downloadCanvas}
        >
          <Download size={16} className="mr-1" />
          Save
        </Button>
      </div>
    </motion.div>
  );
};

export default Canvas;
