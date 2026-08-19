import { useEffect, useRef } from 'react';
import { animate, useInView, useMotionValue, useTransform, motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}

export function AnimatedNumber({ value, duration = 0.8, className, format }: AnimatedNumberProps) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (v) => {
    const n = Math.round(v);
    return format ? format(n) : n.toString();
  });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, safeValue, { duration, ease: 'easeOut' });
    return () => controls.stop();
  }, [inView, safeValue, duration, motionValue]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{text}</motion.span>
    </span>
  );
}
