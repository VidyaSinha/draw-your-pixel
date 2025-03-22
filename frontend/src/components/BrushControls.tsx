
import { useState } from "react";
import { motion } from "framer-motion";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BrushControlsProps {
  onBrushChange: (size: number) => void;
  onColorChange: (color: string) => void;
  currentBrushSize: number;
  currentColor: string;
}

const BrushControls = ({
  onBrushChange,
  onColorChange,
  currentBrushSize,
  currentColor
}: BrushControlsProps) => {
  const brushSizes = [2, 5, 10, 15, 20];
  const colors = [
    "#713eff", // Purple
    "#36b9ff", // Blue
    "#ff71e9", // Pink
    "#f9f871", // Yellow
    "#ff5252", // Red
    "#4caf50", // Green
    "#ffffff", // White
    "#000000", // Black
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-4">
      <div className="glass rounded-full p-2 flex items-center">
        <p className="text-xs mr-2 text-foreground/70">Brush Size:</p>
        <div className="flex space-x-1">
          {brushSizes.map((size) => (
            <Toggle
              key={size}
              pressed={currentBrushSize === size}
              onPressedChange={() => onBrushChange(size)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                currentBrushSize === size
                  ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white"
                  : "text-foreground/70"
              }`}
            >
              <motion.div 
                className="rounded-full bg-current"
                style={{ 
                  width: `${size/2}px`, 
                  height: `${size/2}px`,
                }}
                whileHover={{ scale: 1.2 }}
              />
            </Toggle>
          ))}
        </div>
      </div>
      
      <div className="glass rounded-full p-2">
        <p className="text-xs mx-2 mb-1 text-foreground/70">Color:</p>
        <ScrollArea className="w-full">
          <div className="flex space-x-2 px-2">
            {colors.map((color) => (
              <motion.button
                key={color}
                className={`w-8 h-8 rounded-full cursor-pointer ${
                  currentColor === color ? "ring-2 ring-white" : ""
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default BrushControls;
