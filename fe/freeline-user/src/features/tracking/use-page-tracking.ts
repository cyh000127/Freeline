import { useEffect } from 'react';
import { useSession } from '@/features/session/context';
import { useTracking } from './tracking.context';

export function usePageTracking(pageName: string) {
  const { eventId } = useSession();
  const { trackEvent } = useTracking();

  useEffect(() => {
    if (!eventId) {
      return;
    }

    trackEvent({
      action: 'PAGE_VIEW',
      targetType: 'PAGE',
      targetId: pageName,
      metadata: { page_name: pageName },
      eventId,
    });
  }, [eventId, pageName, trackEvent]);
}
