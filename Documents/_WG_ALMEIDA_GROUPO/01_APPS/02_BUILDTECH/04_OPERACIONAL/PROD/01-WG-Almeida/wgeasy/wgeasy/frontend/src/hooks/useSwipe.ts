import React, { useRef, useCallback } from "react";

/**
 * Hook para detectar gestos de swipe
 * @param handlers - Callbacks para cada direçÍo
 * @param threshold - Distância mínima em pixels para considerar swipe (padrÍo: 50px)
 * @returns Objetos onTouchStart e onTouchEnd para usar em JSX
 *
 * @example
 * const { onTouchStart, onTouchEnd } = useSwipe({
 *   onSwipeLeft: () => console.log('Swipe left'),
 *   onSwipeRight: () => goBack(),
 *   threshold: 50
 * });
 *
 * return (
 *   <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
 *     Swipe aqui
 *   </div>
 * );
 */

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: SwipeHandlers) {
  const touchStart = useRef<number>(0);
  const touchEnd = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchEnd.current = e.changedTouches[0].clientX;
      touchEndY.current = e.changedTouches[0].clientY;

      const distance = touchStart.current - touchEnd.current;
      const distanceY = touchStartY.current - touchEndY.current;
      const isHorizontal = Math.abs(distance) > Math.abs(distanceY);
      const isVertical = Math.abs(distanceY) > Math.abs(distance);

      // Swipe horizontal
      if (isHorizontal && Math.abs(distance) > threshold) {
        if (distance > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }

      // Swipe vertical
      if (isVertical && Math.abs(distanceY) > threshold) {
        if (distanceY > 0) {
          onSwipeUp?.();
        } else {
          onSwipeDown?.();
        }
      }
    },
    [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  );

  return { onTouchStart, onTouchEnd };
}

