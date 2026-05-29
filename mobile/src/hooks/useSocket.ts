import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Storage from '../utils/storage';
import Constants from 'expo-constants';

const getSocketUrl = () => {
  if (Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
};

export function useSocket(matchId?: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const joinIdRef = useRef<string | null>(null);

  useEffect(() => {
    let disconnected = false;
    const init = async () => {
      const token = await Storage.getItem('token');
      if (disconnected) return;
      const socket = io(getSocketUrl(), {
        transports: ['websocket', 'polling'],
        auth: { token },
      });
      socket.on('connect', () => {
        if (joinIdRef.current) socket.emit('join:match', joinIdRef.current);
      });
      socketRef.current = socket;
    };
    init();
    return () => {
      disconnected = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    joinIdRef.current = matchId ?? null;
    const socket = socketRef.current;
    if (socket?.connected && matchId) {
      socket.emit('join:match', matchId);
    }
    return () => {
      if (socket?.connected && matchId) {
        socket.emit('leave:match', matchId);
      }
    };
  }, [matchId]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  const emit = useCallback((event: string, ...args: any[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  return { socket: socketRef.current, on, emit };
}
