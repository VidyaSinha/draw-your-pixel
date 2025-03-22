
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface DetectionResultProps {
  detecting: boolean;
  onDetectionComplete?: (result: string) => void;
}

const DetectionResult = ({ detecting, onDetectionComplete }: DetectionResultProps) => {
  const [detectionResult, setDetectionResult] = useState<string | null>(null);
  
  // Simulate detection
  useEffect(() => {
    if (detecting) {
      const timer = setTimeout(() => {
        const possibleResults = [
          "Circle", "Square", "Triangle", "Star", 
          "House", "Tree", "Car", "Flower",
          "Apple", "Cat", "Dog", "Butterfly"
        ];
        
        const result = possibleResults[Math.floor(Math.random() * possibleResults.length)];
        setDetectionResult(result);
        
        if (onDetectionComplete) {
          onDetectionComplete(result);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      setDetectionResult(null);
    }
  }, [detecting, onDetectionComplete]);
  
  if (!detecting && !detectionResult) return null;
  
  return (
    <motion.div
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ type: "spring", duration: 0.5 }}
    >
      <div className="glass rounded-xl px-8 py-4 min-w-[300px] text-center">
        {detecting && !detectionResult ? (
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple animate-pulse-light mb-2"></div>
            <p className="text-lg font-medium">Analyzing your drawing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
              className="text-2xl font-bold mb-1 bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent"
            >
              {detectionResult}
            </motion.div>
            <p className="text-sm text-foreground/70">
              I detected that you drew a{' '}
              <span className="font-medium text-foreground">{detectionResult}</span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DetectionResult;
