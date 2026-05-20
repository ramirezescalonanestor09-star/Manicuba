'use client';

import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

export function connectSocket(opts: { token?: string; publicToken?: string }): Socket {
  return io(API_URL, {
    path: '/ws',
    auth: opts,
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}
