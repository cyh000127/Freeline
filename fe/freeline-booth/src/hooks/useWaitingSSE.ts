import { useEffect, useRef, useState } from "react";
import { waitingApi } from "@/lib/api/waiting";

export function useWaitingSSE(boothId: number | undefined, onUpdate?: (data: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!boothId) return;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      let url = waitingApi.getSubscribeUrl(boothId);
      
      if (token) {
        // Ensure token is correctly encoded for URL
        url += `${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
      }

      console.log(`[SSE] Connecting to: ${url}`);
      
      try {
        // Added { withCredentials: true } which is often needed for cross-origin SSE
        const eventSource = new EventSource(url, { withCredentials: true });
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log("[SSE] Connected state: open");
          setIsConnected(true);
        };

        const handleEvent = (event: MessageEvent) => {
          console.log(`[SSE] Received ${event.type} event:`, event.data);
          if (onUpdateRef.current) {
            try {
              const data = event.data ? JSON.parse(event.data) : null;
              onUpdateRef.current(data);
            } catch (e) {
              onUpdateRef.current(event.data);
            }
          }
        };

        eventSource.addEventListener("WAITING_LIST_CHANGED", (e) => handleEvent(e as MessageEvent));
        eventSource.addEventListener("BOOTH_STATUS_CHANGED", (e) => handleEvent(e as MessageEvent));
        eventSource.onmessage = (event) => handleEvent(event);

        eventSource.onerror = (error) => {
          console.error("[SSE] Connection Error details:", error);
          setIsConnected(false);
          eventSource.close();
          
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };
      } catch (err) {
        console.error("[SSE] Failed to create EventSource:", err);
      }
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [boothId]);

  return { isConnected };
}
