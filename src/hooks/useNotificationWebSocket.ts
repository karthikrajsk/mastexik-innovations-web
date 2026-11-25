import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/state/store';
import { pushNotification, fetchUnreadCount, NotificationItem } from '@/state/notificationSlice';
import { API_ORIGIN } from '@/services/ApiService';

let notificationSound: HTMLAudioElement | null = null;
function getNotificationSound(): HTMLAudioElement {
  if (!notificationSound) {
    notificationSound = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA' +
      'EAAQAARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2dJOlCUz' +
      'PeqaUlBVJjT+69xUEBKja/m3J+GaFZPVIuw5+KqjXJiWFJQVGe37+bBp4hyZFhRUFZs' +
      'wO3muZuCcGFZVFhpuefkwamRfW9mX1pkdb/r5sOsloF1bGZkaHO+6+bFr5qGem9pZ2l0' +
      'wOzmxK+bh3pxamhqdbzp5cOunYp+c2xpaGp0vOfkw62ci4B1bWppam91vOnlxK+dioB1' +
      'bWlpa211vOnlxK+diH92bmlpa213vOnlxbCeioB2bmlpaW13vOnlxbCdiH91bmlpaW1' +
      '3vOnlxbCeiH91bmlpaW13'
    );
    notificationSound.volume = 0.6;
  }
  return notificationSound;
}

export function useNotificationWebSocket(companyId: string | null) {
  const dispatch = useDispatch<AppDispatch>();
  const clientRef = useRef<Client | null>(null);
  const companyIdRef = useRef<string | null>(companyId);

  useEffect(() => {
    companyIdRef.current = companyId;
  }, [companyId]);

  const playSound = useCallback(() => {
    try {
      const sound = getNotificationSound();
      sound.currentTime = 0;
      sound.play().catch(() => {});
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!companyId) return;

    dispatch(fetchUnreadCount(companyId));

    const wsUrl = `${API_ORIGIN}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(
          `/topic/notifications/${companyId}`,
          (message: IMessage) => {
            try {
              const notification: NotificationItem = JSON.parse(message.body);
              dispatch(pushNotification(notification));
              playSound();
            } catch (_) {}
          }
        );
      },
      onStompError: () => {},
      onDisconnect: () => {},
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [companyId, dispatch, playSound]);
}
