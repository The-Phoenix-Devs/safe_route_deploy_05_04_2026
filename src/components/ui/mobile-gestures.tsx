import React, { useRef, useState, useEffect } from 'react';
import { mobileService } from '@/services/mobileService';

interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = ''
}) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < threshold) return;

    await mobileService.hapticFeedback('light');

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    touchStartRef.current = null;
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  disabled = false,
  threshold = 80
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      touchStartRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !touchStartRef.current) return;

    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStartRef.current);
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !touchStartRef.current) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      await mobileService.hapticFeedback('medium');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    touchStartRef.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-transform duration-200 z-10 ${
          pullDistance > 0 ? 'block' : 'hidden'
        }`}
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
          height: '40px'
        }}
      >
        <div
          className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full ${
            isRefreshing ? 'animate-spin' : ''
          }`}
        />
      </div>
      
      <div
        ref={containerRef}
        className="h-full overflow-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

interface LongPressProps {
  children: React.ReactNode;
  onLongPress: () => void;
  delay?: number;
  className?: string;
}

export const LongPress: React.FC<LongPressProps> = ({
  children,
  onLongPress,
  delay = 500,
  className = ''
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    timeoutRef.current = setTimeout(async () => {
      await mobileService.hapticFeedback('heavy');
      onLongPress();
    }, delay);
  };

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {children}
    </div>
  );
};