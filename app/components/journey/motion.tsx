import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Small motion helpers for the day view. Nothing runs at rest: a swap keeps the outgoing block for
 * one short fade, a count-up is one rAF loop that stops.
 */

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** How long the outgoing block stays (its fade is in journey.css, `.jr-swap > .is-leaving`). */
const LEAVE_MS = 220;

type Item<T> = { k: string; value: T; leaving: boolean };

/**
 * Keeps the previous block mounted briefly (class `is-leaving`) while the new one enters (class
 * `is-entering`, staggered children in CSS), so a day change reads as one block giving way to the next.
 */
export function Swap<T>({ k, value, render, className = "" }: { k: string; value: T; render: (value: T) => ReactNode; className?: string }) {
  const [items, setItems] = useState<Item<T>[]>([{ k, value, leaving: false }]);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setItems((current) => {
      const last = current[current.length - 1];
      if (last && last.k === k && !last.leaving) return current; // unchanged (e.g. a re-run effect)
      return [...current.filter((i) => i.k !== k).map((i) => ({ ...i, leaving: true })), { k, value, leaving: false }];
    });
    const timer = window.setTimeout(() => setItems((current) => current.filter((i) => !i.leaving)), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`jr-swap ${className}`}>
      {items.map((item) => (
        <div key={item.k} className={item.leaving ? "jr-swap__item is-leaving" : "jr-swap__item is-entering"} aria-hidden={item.leaving || undefined} inert={item.leaving || undefined}>
          {render(item.value)}
        </div>
      ))}
    </div>
  );
}

/** A number that counts from `from` to `value` once (500 ms, ease-out); reduced motion: no count. */
export function Count({ value, from, delayMs = 0, className = "" }: { value: number; from?: number; delayMs?: number; className?: string }) {
  const [shown, setShown] = useState(from ?? value);
  useEffect(() => {
    if (from === undefined || from === value || prefersReducedMotion()) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now() + delayMs;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / 500));
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, from, delayMs]);
  return <span className={className}>{shown.toLocaleString("en")}</span>;
}
