import {useEffect, useRef} from 'react';

export function useLeaveConfirm(isConfirm: boolean, message = "저장되지 않은 변경사항이 있습니다. 정말 떠나시겠습니까?") {
    const isConfirmRef = useRef(isConfirm);

    useEffect(() => {
        isConfirmRef.current = isConfirm;
    }, [isConfirm]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isConfirmRef.current) {
                e.preventDefault();
                e.returnValue = message; // Chrome requires this to show the prompt
            }
        };

        // For Next.js App Router, intercepting browser back/forward buttons
        const handlePopState = (e: PopStateEvent) => {
            if (isConfirmRef.current) {
                if (!globalThis.confirm(message)) {
                    // Push state back to prevent leaving
                    globalThis.history.pushState(null, '', globalThis.location.href);
                }
            }
        };

        // Add a dummy history state so that when the user clicks 'back',
        // it triggers popstate without immediately leaving the app.
        if (isConfirm) {
            globalThis.history.pushState(null, '', globalThis.location.href);
        }

        globalThis.addEventListener('beforeunload', handleBeforeUnload);
        globalThis.addEventListener('popstate', handlePopState);

        return () => {
            globalThis.removeEventListener('beforeunload', handleBeforeUnload);
            globalThis.removeEventListener('popstate', handlePopState);
        };
    }, [message]); // removed isConfirm from dependency to prevent re-attaching listeners constantly
}