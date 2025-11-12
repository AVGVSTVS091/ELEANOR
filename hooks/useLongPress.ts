import React, { useCallback, useRef } from 'react';

export const useLongPress = (
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void,
  onClick: () => void,
  { delay = 500 } = {}
) => {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    // Prevent context menu from opening on long touch
    if (event.type === 'touchstart') {
      event.currentTarget.addEventListener('contextmenu', e => e.preventDefault(), { once: true });
    }
    timeout.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress(event);
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    timeout.current && clearTimeout(timeout.current);
    if (!isLongPress.current && event.type !== 'contextmenu') {
        if(event.type === 'mouseup' || event.type === 'touchend') {
             // Check if the click target is not inside an interactive element
            const target = event.target as HTMLElement;
            if (!target.closest('select, button, a, input')) {
                onClick();
            }
        }
    }
  }, [onClick]);
  
  const onContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      isLongPress.current = true; // Ensure click is not fired
      timeout.current && clearTimeout(timeout.current);
      onLongPress(e);
  };

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onTouchEnd: clear,
    onContextMenu,
  };
};