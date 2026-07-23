'use client';

import { useRef, useEffect, useState, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Mobile3DScroll — an immersive horizontal scroll with 3D perspective for mobile.
 *
 * On mobile (<768px), the children are arranged in a horizontal scroll-snap
 * container with 3D perspective. Each card rotates slightly on Y axis based
 * on its position in the viewport, creating a "cards floating in 3D space"
 * effect. The active card is centered and flat; cards to the sides rotate
 * away and dim.
 *
 * On desktop (≥768px), renders children normally (no horizontal scroll).
 *
 * Usage:
 *   <Mobile3DScroll>
 *     <Card1 />
 *     <Card2 />
 *     <Card3 />
 *   </Mobile3DScroll>
 */
export function Mobile3DScroll({
  children,
  className,
}: {
  children: ReactNode[];
  className?: string;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isMobile) {
    // Desktop: render children normally in a grid
    return (
      <div className={cn('grid gap-4 lg:grid-cols-2', className)}>
        {children}
      </div>
    );
  }

  // Mobile: horizontal scroll with 3D perspective
  const items = Array.isArray(children) ? children : [children];

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4',
        'scrollbar-none [&::-webkit-scrollbar]:hidden',
        className,
      )}
      style={{ perspective: '1000px' }}
    >
      {items.map((child, i) => (
        <Mobile3DCard key={i} index={i} total={items.length} containerRef={containerRef}>
          {child}
        </Mobile3DCard>
      ))}
    </div>
  );
}

function Mobile3DCard({
  children,
  index,
  total,
  containerRef,
}: {
  children: ReactNode;
  index: number;
  total: number;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateY, setRotateY] = useState(0);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;

    const update = () => {
      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const containerCenter = containerRect.left + containerRect.width / 2;
      const distance = cardCenter - containerCenter;
      const maxDistance = containerRect.width / 2;
      const normalized = Math.max(-1, Math.min(1, distance / maxDistance));

      // Rotate away from center (max ±25deg)
      setRotateY(normalized * -25);
      // Scale down slightly when off-center
      setScale(1 - Math.abs(normalized) * 0.12);
      // Dim slightly when off-center
      setOpacity(1 - Math.abs(normalized) * 0.3);
    };

    update();
    container.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      container.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [containerRef]);

  return (
    <div
      ref={cardRef}
      className="snap-center shrink-0 w-[85vw] max-w-sm"
      style={{
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateY(${rotateY}deg) scale(${scale})`,
        opacity,
        transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
}
