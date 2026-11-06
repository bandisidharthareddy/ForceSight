'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  spotlightColor?: string;
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 14,
  spotlightColor = 'rgba(56, 189, 248, 0.16)',
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);

  const springConfig = { stiffness: 280, damping: 20 };
  const rotateX = useSpring(rawRotateX, springConfig);
  const rotateY = useSpring(rawRotateY, springConfig);

  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Map offset to rotation
    const calculatedRotateX = ((y - rect.height / 2) / (rect.height / 2)) * -maxTilt;
    const calculatedRotateY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;

    rawRotateX.set(calculatedRotateX);
    rawRotateY.set(calculatedRotateY);
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rawRotateX.set(0);
    rawRotateY.set(0);
    setMousePos({ x: -1000, y: -1000 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: isTouchDevice ? 'flat' : 'preserve-3d',
        rotateX: isTouchDevice ? 0 : rotateX,
        rotateY: isTouchDevice ? 0 : rotateY,
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* 3D Internal Spotlight Reflection */}
      {!isTouchDevice && isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 280px at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 75%)`,
          }}
        />
      )}

      {/* Card Content with 3D Pop depth */}
      <div
        className="h-full w-full relative z-10"
        style={{
          transform: isTouchDevice ? 'none' : 'translateZ(20px)',
          transformStyle: isTouchDevice ? 'flat' : 'preserve-3d',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
