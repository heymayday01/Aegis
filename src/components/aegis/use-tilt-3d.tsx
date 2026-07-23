/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

/**
 * useTilt3D — a hook that adds device-orientation (gyroscope) reactive 3D tilt
 * to any element. On mobile devices with a gyroscope, tilting the phone
 * slightly rotates the element in 3D space, creating a depth parallax effect.
 *
 * Falls back gracefully on desktop (no tilt, element stays flat).
 *
 * Usage:
 *   const { ref, style } = useTilt3D({ max: 8 });
 *   <motion.div ref={ref} style={style}>...</motion.div>
 */
export function useTilt3D({ max = 8 }: { max?: number } = {}) {
  const rotateX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 });
  const [enabled, setEnabled] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    // Only enable on touch devices that support device orientation
    const isTouch = 'ontouchstart' in window;
    if (!isTouch) return;

    // Request permission on iOS 13+
    const anyDeviceOrientation = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (anyDeviceOrientation.requestPermission) {
      // Can't request without user gesture — enable on first touch
      const enable = () => {
        const req = anyDeviceOrientation.requestPermission;
        if (req) {
          req().then((state: string) => {
            if (state === 'granted' && mountedRef.current) {
              setEnabled(true);
            }
          }).catch(() => {});
        }
        window.removeEventListener('touchstart', enable);
      };
      window.addEventListener('touchstart', enable, { once: true });
      return () => window.removeEventListener('touchstart', enable);
    }

    // Android / other — just enable
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      // beta: front-back tilt (-180 to 180), gamma: left-right tilt (-90 to 90)
      const x = Math.max(-1, Math.min(1, e.gamma / 45)); // -1 to 1
      const y = Math.max(-1, Math.min(1, e.beta / 45));
      rotateY.set(x * max);
      rotateX.set(-y * max);
    };

    window.addEventListener('deviceorientation', onOrientation);
    return () => window.removeEventListener('deviceorientation', onOrientation);
  }, [enabled, rotateX, rotateY, max]);

  const style = enabled
    ? { rotateX, rotateY, transformPerspective: 800, transformStyle: 'preserve-3d' as const }
    : {};

  return { style, enabled };
}

/**
 * TiltCard3D — a wrapper that applies gyroscope tilt to its children on mobile.
 * On desktop, renders children without tilt (flat).
 */
export function TiltCard3D({
  children,
  className,
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const { style } = useTilt3D({ max });

  return (
    <motion.div style={style} className={className}>
      {children}
    </motion.div>
  );
}
