import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { playReceive, playIncoming, stopIncoming, stopRingtone, playConnect } from '../utils/sounds.js';

const Ctx = createContext(null);
const SERVER = 'https://auragram-telegram-web.hf.space';
const isElectron = !!window.electronAPI;

export function SocketProvider({ children }) {
  const { token, logout } = useAuth();
  const [socket, setSocket]         = useState(null);
  const [connected, setConnected]   = useState(false);
  const [connStatus, setConnStatus] = useState('connecting');

  useEffect(() => {
    if (!token) { setConnStatus('ok'); return; }

    console.log('[Pulse] Connecting socket to:', SERVER);

    const s = io(SERVER, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      forceNew: true,
    });

    setSocket(s);

    s.on('connect',           () => { console.log('[Pulse] Socket connected'); setConnected(true); setConnStatus('ok'); });
    s.on('disconnect',        () => { setConnected(false); setConnStatus('offline'); });
    s.on('reconnect_attempt', () => setConnStatus('connecting'));
    s.on('reconnect',         () => { setConnected(true); setConnStatus('ok'); });
    s.on('connect_error',     e  => {
      console.log('[Pulse] Socket error:', e.message);
      if (e.message === 'ACCOUNT_FROZEN') logout();
      else setConnStatus('poor');
    });

    s.on('message:new', msg => {
      playReceive();
      const title = msg.sender?.nickname || 'Pulse';
      const body  = msg.content || (msg.type==='image'?'📷 Фото':msg.type==='voice'?'🎤 Голосовое':'📎');
      if (isElectron && window.electronAPI?.notifyMessage) {
        window.electronAPI.notifyMessage(title, body, msg.chat||msg.chatId);
      } else if (!document.hasFocus() && Notification.permission === 'granted') {
        try { new Notification(title, { body, icon: '/icon.svg' }); } catch {}
      }
    });

    s.on('call:incoming', data => {
      playIncoming();
      if (isElectron && window.electronAPI?.notifyCall) {
        window.electronAPI.notifyCall(data.callerId, data.callerName||'Неизвестный', data.callerAvatar||'', data.isVideo||false);
      } else if (Notification.permission === 'granted') {
        try {
          new Notification(`📞 ${data.isVideo?'Видеозвонок':'Звонок'}`, {
            body: `${data.callerName||'Кто-то'} звонит вам`,
            icon: '/icon.svg',
            requireInteraction: true,
          });
        } catch {}
      }
    });

    s.on('call:answered', () => { stopIncoming(); stopRingtone(); playConnect(); });
    s.on('call:rejected', () => { stopIncoming(); stopRingtone(); });
    s.on('call:ended',    () => { stopIncoming(); stopRingtone(); });

    if (isElectron) {
      window.electronAPI.onCallAccept?.((data) => {
        stopIncoming();
        s.emit('call:accept_from_notif', data);
        window.dispatchEvent(new CustomEvent('pulse:call:accept', { detail: data }));
      });
      window.electronAPI.onCallReject?.((data) => {
        stopIncoming();
        s.emit('call:reject', { targetId: data.callerId });
        window.dispatchEvent(new CustomEvent('pulse:call:reject', { detail: data }));
      });
      window.electronAPI.onOpenChat?.((chatId) => {
        window.dispatchEvent(new CustomEvent('pulse:open:chat', { detail: chatId }));
      });
    }

    const onOnline  = () => { if (!s.connected) { setConnStatus('connecting'); s.connect(); } };
    const onOffline = () => setConnStatus('offline');

    // Android: reconnect when app returns to foreground after suspension
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !s.connected) {
        setConnStatus('connecting');
        setTimeout(() => { if (!s.connected) s.connect(); }, 300);
      }
    };
    const onPageShow = (e) => {
      if (e.persisted && !s.connected) {
        setConnStatus('connecting');
        setTimeout(() => { s.connect(); }, 300);
      }
    };

    window.addEventListener('online',             onOnline);
    window.addEventListener('offline',            onOffline);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow',           onPageShow);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
      window.removeEventListener('online',             onOnline);
      window.removeEventListener('offline',            onOffline);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow',           onPageShow);
    };
  }, [token]);

  return (
    <Ctx.Provider value={{ socket, connected, connStatus }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSocket = () => useContext(Ctx);
