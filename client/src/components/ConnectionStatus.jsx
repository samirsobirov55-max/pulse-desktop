import React from 'react';
import { useSocket } from '../contexts/SocketContext';

const STATUS_MAP = {
  ok: null,
  connecting: { label: 'Обновление', color: '#FBBF24' },
  poor: { label: 'Соединение', color: '#FB923C' },
  offline: { label: 'Ожидание сети', color: '#F87171' },
};

export default function ConnectionStatus() {
  const { connStatus } = useSocket() || { connStatus: 'ok' };
  const status = STATUS_MAP[connStatus];
  if (!status) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
      padding: '6px 0', textAlign: 'center',
      background: `${status.color}18`, borderBottom: `1px solid ${status.color}40`,
      backdropFilter: 'blur(10px)',
      fontSize: '0.8rem', color: status.color, fontWeight: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      <span>Pulse — {status.label}</span>
      <span className="conn-dots">
        <span style={{ display: 'inline-block', width: 3, height: 3, background: status.color, borderRadius: '50%', marginLeft: 1 }} />
        <span style={{ display: 'inline-block', width: 3, height: 3, background: status.color, borderRadius: '50%', marginLeft: 1 }} />
        <span style={{ display: 'inline-block', width: 3, height: 3, background: status.color, borderRadius: '50%', marginLeft: 1 }} />
      </span>
    </div>
  );
}
