import { useEffect, useRef } from 'react';

// Optional animated background: waves and/or floating particles drawn on a
// full-screen canvas. Turned on/off from the header buttons.
export default function BackgroundFx({ waves, particles }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (!waves && !particles)) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const accent = '124, 108, 255';
    const mouse = { x: 0, y: 0 };
    let frame;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const dots = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size: Math.random() * 2 + 1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (waves) {
        ctx.lineWidth = 2;
        for (let wave = 0; wave < 3; wave++) {
          ctx.strokeStyle = `rgba(${accent}, ${0.28 - wave * 0.07})`;
          ctx.beginPath();
          for (let x = 0; x <= canvas.width; x += 5) {
            const y =
              canvas.height - 120 +
              wave * 36 +
              Math.sin((x + time + mouse.x) * 0.01) * 28 +
              Math.cos((time + mouse.y) * 0.005) * 18;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      if (particles) {
        const alpha = 0.45 + Math.sin(time * 0.02) * 0.2;
        ctx.fillStyle = `rgba(${accent}, ${alpha})`;
        for (const p of dots) {
          p.x = (p.x + p.vx + canvas.width) % canvas.width;
          p.y = (p.y + p.vy + canvas.height) % canvas.height;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      time += 2;
      frame = requestAnimationFrame(animate);
    };
    animate();

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [waves, particles]);

  if (!waves && !particles) return null;
  return <canvas ref={canvasRef} className="bg-fx" aria-hidden="true" />;
}
