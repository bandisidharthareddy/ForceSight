import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ForceSight Digital Twin | Predictive Crowd Stress Simulation',
  description: 'Proactive digital twin crowd stress simulator using Helbing Social Force Model and photoelastic birefringence visualization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
