'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ScrambleTextProps {
  text: string;
  className?: string;
  scrambleOnHover?: boolean;
  triggerKey?: string | number;
}

const GLYPHS = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ#$@%*&/<>[]{}~+=-_';

export default function ScrambleText({
  text,
  className = '',
  scrambleOnHover = true,
  triggerKey,
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isScrambling, setIsScrambling] = useState<boolean>(false);
  const frameRef = useRef<number | null>(null);

  const startScramble = () => {
    if (isScrambling) return;
    setIsScrambling(true);

    let frame = 0;
    const maxFrames = 15;
    const originalText = text;

    const animate = () => {
      frame++;
      const progress = frame / maxFrames;
      const revealedChars = Math.floor(progress * originalText.length);

      const scrambled = originalText
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (index < revealedChars) return originalText[index];
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');

      setDisplayText(scrambled);

      if (frame < maxFrames) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayText(originalText);
        setIsScrambling(false);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    setDisplayText(text);
  }, [text]);

  useEffect(() => {
    if (triggerKey !== undefined) {
      startScramble();
    }
  }, [triggerKey]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <span
      className={className}
      onMouseEnter={() => {
        if (scrambleOnHover) startScramble();
      }}
    >
      {displayText}
    </span>
  );
}
