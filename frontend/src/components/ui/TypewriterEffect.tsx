import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TypewriterEffectProps {
  words: string[];
  className?: string;
  cursorClassName?: string;
}

export const TypewriterEffect = ({
  words,
  className,
  cursorClassName,
}: TypewriterEffectProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [blink, setBlink] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const timer = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Typing logic
  useEffect(() => {
    const word = words[currentWordIndex];
    const typeSpeed = isDeleting ? 50 : 150;
    const pauseTime = 2000;

    const type = () => {
      setCurrentText((prev) => {
        if (isDeleting) {
          return word.substring(0, prev.length - 1);
        } else {
          return word.substring(0, prev.length + 1);
        }
      });
    };

    const timer = setTimeout(() => {
      type();

      if (!isDeleting && currentText === word) {
        setTimeout(() => setIsDeleting(true), pauseTime);
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    }, typeSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, words]);

  return (
    <div className={cn("inline-flex items-center", className)}>
      <span>{currentText}</span>
      <span
        className={cn(
          "ml-1 h-8 w-1 bg-primary block",
          blink ? "opacity-100" : "opacity-0",
          cursorClassName
        )}
      />
    </div>
  );
};
