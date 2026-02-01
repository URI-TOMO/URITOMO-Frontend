import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { authApi } from '../api/auth';
import { userApi } from '../api/user';
import { getTranslation } from '../i18n/translations';

type RoomInviteAction = 'invited' | 'rejoined';

type RoomInvitePayload = {
  action: RoomInviteAction;
  room_id: string;
  room_name: string;
  invited_user_id: string;
  invited_by: string;
  member_id: string;
  joined_at: string;
};

type StoredRoom = {
  id: string;
  name: string;
  icon?: string;
};

type RoomInviteSSEOptions = {
  enabled?: boolean;
  keepAlive?: boolean;
  reconnectDelayMs?: number;
  errorDelayMs?: number;
  syncThrottleMs?: number;
};

const DEFAULT_RECONNECT_DELAY_MS = 300;
const DEFAULT_ERROR_DELAY_MS = 1000;
const DEFAULT_SYNC_THROTTLE_MS = 30000;

const formatTranslation = (key: string, params?: Record<string, string | number>) => {
  let text = getTranslation(key);
  if (!params) return text;

  Object.entries(params).forEach(([paramKey, paramValue]) => {
    text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
  });

  return text;
};

const getInviteStreamUrl = (token: string, keepAlive: boolean) => {
  const baseURL = import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '');

  const trimmedBase = baseURL.replace(/\/$/, '');
  const closeOnEventParam = keepAlive ? '&close_on_event=false' : '';
  return `${trimmedBase}/user/rooms/stream?token=${encodeURIComponent(token)}${closeOnEventParam}`;
};

const readStoredRooms = (): StoredRoom[] => {
  try {
    const raw = localStorage.getItem('uri-tomo-rooms');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[RoomInviteSSE] Failed to parse stored rooms:', error);
    return [];
  }
};

const writeStoredRooms = (rooms: StoredRoom[]) => {
  localStorage.setItem('uri-tomo-rooms', JSON.stringify(rooms));
  window.dispatchEvent(new Event('rooms-updated'));
};

export const useRoomInviteSSE = (options?: RoomInviteSSEOptions) => {
  const reconnectTimerRef = useRef<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const refreshInFlightRef = useRef<Promise<boolean> | null>(null);
  const lastSyncAtRef = useRef(0);
  const syncInFlightRef = useRef(false);

  const enabled = options?.enabled ?? true;
  const keepAlive = options?.keepAlive ?? false;
  const reconnectDelayMs = options?.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS;
  const errorDelayMs = options?.errorDelayMs ?? DEFAULT_ERROR_DELAY_MS;
  const syncThrottleMs = options?.syncThrottleMs ?? DEFAULT_SYNC_THROTTLE_MS;

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = (delayMs: number) => {
      clearReconnectTimer();
      reconnectTimerRef.current = window.setTimeout(() => {
        if (!isMounted) return;
        connect();
      }, delayMs);
    };

    const syncRoomsFromServer = async () => {
      if (syncInFlightRef.current) return;
      const now = Date.now();
      if (now - lastSyncAtRef.current < syncThrottleMs) return;

      syncInFlightRef.current = true;
      lastSyncAtRef.current = now;

      try {
        const data = await userApi.getMainData();
        const mappedRooms: StoredRoom[] = data.rooms.map((room) => ({
          id: room.id,
          name: room.name,
        }));
        writeStoredRooms(mappedRooms);
      } catch (error) {
        console.warn('[RoomInviteSSE] Failed to sync rooms:', error);
      } finally {
        syncInFlightRef.current = false;
      }
    };

    const upsertRoom = (payload: RoomInvitePayload) => {
      const roomName = payload.room_name?.trim() || 'New Room';
      const rooms = readStoredRooms();
      const existingIndex = rooms.findIndex((room) => room.id === payload.room_id);

      let nextRooms: StoredRoom[];
      if (existingIndex >= 0) {
        nextRooms = rooms.map((room) =>
          room.id === payload.room_id ? { ...room, name: roomName } : room
        );
      } else {
        nextRooms = [{ id: payload.room_id, name: roomName }, ...rooms];
      }

      writeStoredRooms(nextRooms);
    };

    const refreshToken = async () => {
      if (refreshInFlightRef.current) return refreshInFlightRef.current;

      const refreshPromise = authApi
        .refreshToken()
        .then((response) => {
          if (response?.access_token) {
            localStorage.setItem('uri-tomo-token', response.access_token);
            return true;
          }
          return false;
        })
        .catch((error) => {
          console.warn('[RoomInviteSSE] Failed to refresh token:', error);
          return false;
        })
        .finally(() => {
          refreshInFlightRef.current = null;
        });

      refreshInFlightRef.current = refreshPromise;
      return refreshPromise;
    };

    const handleInvite = (event: MessageEvent) => {
      let payload: RoomInvitePayload | null = null;
      try {
        payload = JSON.parse(event.data) as RoomInvitePayload;
      } catch (error) {
        console.warn('[RoomInviteSSE] Failed to parse invite payload:', error);
        return;
      }

      if (!payload?.room_id) return;

      upsertRoom(payload);
      window.dispatchEvent(new CustomEvent('room-invited', { detail: payload }));

      const toastKey = payload.action === 'rejoined' ? 'roomRejoined' : 'roomInvited';
      const roomName = payload.room_name?.trim() || formatTranslation('roomName');
      toast.success(formatTranslation(toastKey, { room: roomName }));

      void syncRoomsFromServer();

      if (!keepAlive) {
        eventSourceRef.current?.close();
        scheduleReconnect(reconnectDelayMs);
      }
    };

    const handleError = async () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;

      await refreshToken();
      scheduleReconnect(errorDelayMs);
    };

    const connect = () => {
      const token = localStorage.getItem('uri-tomo-token');
      if (!token) return;

      eventSourceRef.current?.close();
      const url = getInviteStreamUrl(token, keepAlive);
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('room.invited', handleInvite as EventListener);
      es.onerror = handleError;
    };

    connect();

    return () => {
      isMounted = false;
      clearReconnectTimer();
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [enabled, errorDelayMs, keepAlive, reconnectDelayMs, syncThrottleMs]);
};
