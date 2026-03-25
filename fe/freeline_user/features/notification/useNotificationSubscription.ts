import { useEffect } from 'react';
import { AppState } from 'react-native';
import {
  connectNotificationSse,
  disconnectNotificationSse,
} from './notification.service';

type UseNotificationSubscriptionParams = {
  accessToken?: string | null;
  onMessage?: (raw: string) => void;
};

export function useNotificationSubscription({
  accessToken,
  onMessage,
}: UseNotificationSubscriptionParams) {
  useEffect(() => {
    if (!accessToken) {
      disconnectNotificationSse();
      return;
    }

    let currentAppState = AppState.currentState;
    let connected = false;

    const connect = () => {
      if (connected) {
        return;
      }

      connected = true;

      connectNotificationSse({
        accessToken,
        onOpen: () => {
          console.log('SSE connected');
        },
        onMessage: (raw) => {
          console.log('SSE raw:', raw);
          onMessage?.(raw);
        },
        onError: (error) => {
          console.error('SSE error:', error);
          connected = false;
        },
      });
    };

    const disconnect = () => {
      if (!connected) {
        return;
      }

      connected = false;
      disconnectNotificationSse();
    };

    if (currentAppState === 'active') {
      connect();
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasActive = currentAppState === 'active';
      const isActive = nextState === 'active';

      if (!wasActive && isActive) {
        connect();
      }

      if (wasActive && !isActive) {
        disconnect();
      }

      currentAppState = nextState;
    });

    return () => {
      subscription.remove();
      disconnect();
    };
  }, [accessToken, onMessage]);
}
