"use client";

import { useEffect, useRef, useState } from "react";

interface VerifiedGaugeProps {
  /** 0 to 1, or null when nobody has reported yet. */
  rate: number | null;
  /** Total worked + didn't-work reports. */
  reports: number;
  size?: number;
  /** "light" sits on a dark/gradient surface, "dark" on white. */
  tone?: "light" | "dark";
}

const R = 42;
const C = 2 * Math.PI * R;

/**
 * Success-rate ring. Draws in and counts up once when scrolled into view.
 * With no reports it shows an honest "Not verified yet" state instead of a
 * made-up number, and under reduced motion it renders the final state at once.
 */
export default function VerifiedGauge({ rate, reports, size = 112, tone = "dark" }: VerifiedGaugeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const target = rate !== null && reports > 0 ? Math.round(rate * 100) : null;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;
    const reduce = (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    const duration = reduce ? 1 : 900;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(Math.round(target * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (reduce || typeof IntersectionObserver === "undefined") {
      run();
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        run();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);

  const track = tone === "light" ? "rgba(255,255,255,0.28)" : "#e3e6f3";
  const label =
    target === null
      ? "Not verified yet: nobody has reported on this code"
      : `${target}% of ${reports} report${reports === 1 ? "" : "s"} say it worked`;
  const color = target === null ? "#a3a8c3" : target >= 80 ? "#0f9d58" : target >= 50 ? "#ff9d1a" : "#ff6a1a";
  const dash = target === null ? C : C - (C * shown) / 100;

  return (
    <div ref={ref} role="img" aria-label={label} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={R} fill="none" stroke={track} strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={dash}
          style={{ transition: "stroke 300ms ease" }}
        />
      </svg>
      <div
        aria-hidden="true"
        className={`absolute inset-0 flex flex-col items-center justify-center text-center ${tone === "light" ? "text-white" : "text-ink"}`}
      >
        {target === null ? (
          <span className="px-3 text-[11px] font-semibold leading-tight opacity-80">Not verified yet</span>
        ) : (
          <>
            <span className="font-serif text-3xl font-extrabold leading-none">{shown}%</span>
            <span className="mt-1 text-[10px] font-semibold opacity-75">worked</span>
          </>
        )}
      </div>
    </div>
  );
}
