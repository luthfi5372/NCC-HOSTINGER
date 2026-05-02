"use client";

import { useEffect, useRef } from "react";
import { useFluid } from "@/contexts/FluidContext";

export default function CursorDistortion({ paused }: { paused?: boolean }) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotPos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const { updateMousePos } = useFluid();

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      updateMousePos(e.clientX, e.clientY);
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [updateMousePos]);

  useEffect(() => {
    let raf: number;

    const animate = () => {
      if (paused) {
        raf = requestAnimationFrame(animate);
        return;
      }
      // Dot is snappy and tracks almost instantly
      dotPos.current.x += (target.current.x - dotPos.current.x) * 0.35;
      dotPos.current.y += (target.current.y - dotPos.current.y) * 0.35;
      
      // Ring has a smooth buttery trailing effect
      ringPos.current.x += (target.current.x - ringPos.current.x) * 0.1;
      ringPos.current.y += (target.current.y - ringPos.current.y) * 0.1;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${dotPos.current.x - 8}px, ${dotPos.current.y - 8}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x - 24}px, ${ringPos.current.y - 24}px)`;
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (paused) return null;

  return (
    <>
      {/* Inner dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "rgba(34, 211, 238, 0.8)",
          boxShadow: "0 0 12px rgba(34, 211, 238, 0.6), 0 0 30px rgba(34, 211, 238, 0.3)",
          mixBlendMode: "screen",
          willChange: "transform",
        }}
      />
      {/* Outer ring with refraction feel */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "1.5px solid rgba(34, 211, 238, 0.3)",
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.05) 0%, transparent 70%)",
          backdropFilter: "blur(2px) hue-rotate(15deg)",
          WebkitBackdropFilter: "blur(2px) hue-rotate(15deg)",
          mixBlendMode: "screen",
          willChange: "transform",
          transition: "width 0.3s, height 0.3s",
        }}
      />
    </>
  );
}
