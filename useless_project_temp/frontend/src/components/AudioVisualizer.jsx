import React, { useEffect, useRef } from 'react';

export function AudioVisualizer({ isActive = false, level = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const barCount = 24;
    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / barCount - 3;

      phase += 0.15;

      for (let i = 0; i < barCount; i++) {
        let barHeight;
        if (isActive) {
          const sine = Math.sin(phase + i * 0.4);
          const noise = Math.random() * 0.4;
          barHeight = Math.max(6, Math.min(height - 4, (level * 0.7 + Math.abs(sine) * 25 + noise * 15)));
        } else {
          barHeight = 4 + Math.sin(phase * 0.5 + i * 0.3) * 2;
        }

        const x = i * (barWidth + 3);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#00f3ff');
        gradient.addColorStop(0.5, '#ff007f');
        gradient.addColorStop(1, '#8a2be2');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isActive, level]);

  return (
    <div className="w-full flex justify-center items-center my-2">
      <canvas
        ref={canvasRef}
        width={260}
        height={40}
        className="rounded-xl bg-slate-950/40 border border-white/5"
      />
    </div>
  );
}
