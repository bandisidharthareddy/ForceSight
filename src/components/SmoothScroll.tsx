'use client';

import React from 'react';

// Pure non-intrusive container - zero scroll hijacking, zero GSAP lag
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
