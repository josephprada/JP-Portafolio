import { useInView } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";

interface ScriptWriteProps {
  children: ReactNode;
  className?: string;
  /** Seconds. Defaults to the values in `.script-write`. */
  duration?: number;
  delay?: number;
  /** Start on mount instead of when the element scrolls into view. */
  immediate?: boolean;
}

/**
 * Wraps script text in the clip-path "write-on" reveal defined in index.css.
 * The real text stays in the DOM the whole time (only clipped), so screen
 * readers and copy/paste are unaffected.
 *
 * Two elements on purpose. The inner one owns `clip-path` and nothing else, so
 * it never fights a parent's GSAP/motion transform or opacity tween. The outer
 * one (which takes `className`: layout, rotation) is what the in-view observer
 * watches, because an IntersectionObserver on a fully clipped element never
 * reports it as visible and the reveal would never start.
 */
export function ScriptWrite({
  children,
  className = "",
  duration,
  delay,
  immediate = false,
}: ScriptWriteProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const style: CSSProperties & Record<`--${string}`, string> = {};
  if (duration !== undefined) style["--write-duration"] = `${duration}s`;
  if (delay !== undefined) style["--write-delay"] = `${delay}s`;

  return (
    <span ref={ref} className={className}>
      <span
        data-write={immediate || seen ? "in" : "out"}
        style={style}
        className="script-write block"
      >
        {children}
      </span>
    </span>
  );
}
