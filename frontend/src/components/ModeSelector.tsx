
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  activeMode: "draw" | "write";
  onModeChange: (mode: "draw" | "write") => void;
}

const ModeSelector = ({ activeMode, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="glass rounded-full p-1 flex items-center">
        <button
          onClick={() => onModeChange("draw")}
          className={cn(
            "relative px-6 py-2 rounded-full text-sm font-medium transition-all-300",
            activeMode === "draw" 
              ? "text-white" 
              : "text-foreground/70 hover:text-foreground"
          )}
        >
          {activeMode === "draw" && (
            <motion.div
              layoutId="pill"
              className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
              transition={{ type: "spring", duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Draw & Detect</span>
        </button>
        
        <button
          onClick={() => onModeChange("write")}
          className={cn(
            "relative px-6 py-2 rounded-full text-sm font-medium transition-all-300",
            activeMode === "write" 
              ? "text-white" 
              : "text-foreground/70 hover:text-foreground"
          )}
        >
          {activeMode === "write" && (
            <motion.div
              layoutId="pill"
              className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
              transition={{ type: "spring", duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Write</span>
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;
