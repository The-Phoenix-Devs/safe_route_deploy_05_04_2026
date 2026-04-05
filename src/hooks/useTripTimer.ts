
import { useState, useEffect } from 'react';

export const useTripTimer = (isActive: boolean, tripStartTime: Date | null) => {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    
    if (isActive && tripStartTime) {
      timer = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - tripStartTime.getTime()) / 1000);
        
        const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const seconds = Math.floor(diff % 60).toString().padStart(2, '0');
        
        setElapsed(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, tripStartTime]);

  return elapsed;
};
