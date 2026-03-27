import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

type FocusTarget = {
  focus?: () => void;
};

type BlurTarget = {
  blur?: () => void;
  focus?: () => void;
};

export function useWebModalFocus<T extends FocusTarget>(visible: boolean) {
  const focusRef = useRef<T | null>(null);
  const previousFocusRef = useRef<BlurTarget | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    if (visible) {
      previousFocusRef.current = (document.activeElement as BlurTarget | null) ?? null;
      previousFocusRef.current?.blur?.();

      const frame = requestAnimationFrame(() => {
        focusRef.current?.focus?.();
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }

    (document.activeElement as BlurTarget | null)?.blur?.();
    previousFocusRef.current?.focus?.();
    previousFocusRef.current = null;
  }, [visible]);

  return focusRef;
}
