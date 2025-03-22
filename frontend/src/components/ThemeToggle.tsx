
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

const ThemeToggle = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Check if user has a theme preference in localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setTheme("light");
      document.documentElement.classList.add("light");
    } else {
      setTheme("dark");
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      setTheme("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="glass-dark hover:neon-glow-purple transition-all-300 w-10 h-10 rounded-full"
      onClick={toggleTheme}
    >
      <motion.div
        initial={{ scale: 0.8, rotate: 0 }}
        animate={{ 
          scale: [0.8, 1.2, 1],
          rotate: theme === "dark" ? 0 : 180
        }}
        transition={{ duration: 0.5 }}
      >
        {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
      </motion.div>
    </Button>
  );
};

export default ThemeToggle;
