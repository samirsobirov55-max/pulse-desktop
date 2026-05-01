import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const Ctx = createContext(null);
const HF_SERVER = 'https://auragram-telegram-web.hf.space';
const isElectronEnv = typeof window !== 'undefined' && (
  window.location?.protocol === 'file:' || !!window.electronAPI
);
const API = isElectronEnv
  ? HF_SERVER + '/api'
  : (import.meta.env.VITE_API_URL || '/api');
const VERIFIED = ['zxcswatme','developer','support'];

// Экран заморозки
function FrozenScreen({ onLogout }) {
  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#050510,#0a0520)', flexDirection:'column', gap:24, padding:24, textAlign:'center' }}>
      <div style={{ width:100, height:100, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 60px rgba(59,130,246,0.4)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
          <line x1="12" y1="2" x2="12" y2="22"/>
          <path d="m20 6-8 4-8-4"/><path d="m20 18-8-4-8 4"/><path d="m2 12 10 4 10-4"/>
        </svg>
      </div>
      <div>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:900, fontSize:'1.8rem', color:'#fff', marginBottom:8 }}>
          Аккаунт заморожен
        </div>
        <div style={{ color:'rgba(240,240,255,0.55)', fontSize:'0.95rem', lineHeight:1.6, maxWidth:320 }}>
          Ваш аккаунт был временно заморожен администратором Pulse.<br/>
          Вы не можете отправлять сообщения, совершать звонки и использовать другие функции.<br/><br/>
          Если вы считаете это ошибкой, обратитесь в поддержку: <span style={{ color:'#7C5CFC' }}>@support</span>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300 }}>
        <button onClick={onLogout} style={{ padding:'14px', borderRadius:16, border:'1px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.1)', color:'#f87171', cursor:'pointer', fontWeight:700, fontSize:'0.95rem' }}>
          Выйти из аккаунта
        </button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@900&display=swap');`}</style>
    </div>
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pulse_token'));
  const [loading, setLoading] = useState(true);
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    axios.defaults.baseURL = API;
    // Перехватчик для обработки 403 ACCOUNT_FROZEN
    const interceptor = axios.interceptors.response.use(
      r => r,
      err => {
        if (err.response?.status === 403 && err.response?.data?.message === 'ACCOUNT_FROZEN') {
          setFrozen(true);
        }
        return Promise.reject(err);
      }
    );
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await axios.get('/auth/me');
      if (data.isFrozen) { setFrozen(true); setLoading(false); return; }
      applyVerified(data);
      setUser(data);
    } catch(e) {
      if (e.response?.status === 403) { setFrozen(true); setLoading(false); return; }
      doLogout();
    } finally { setLoading(false); }
  };

  const applyVerified = (u) => {
    if (VERIFIED.includes(u.username?.toLowerCase())) {
      u.isVerified = true; u.isPremium = true;
    }
  };

  const login = async (loginStr, password, twoFACode) => {
    const { data } = await axios.post('/auth/login', { login: loginStr, password, twoFACode });
    if (data.user?.isFrozen) { setFrozen(true); throw { frozen: true }; }
    setToken(data.token);
    localStorage.setItem('pulse_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    applyVerified(data.user);
    setUser(data.user);
    return data;
  };

  const register = async (nickname, username, password) => {
    const { data } = await axios.post('/auth/register', { nickname, username, password });
    setToken(data.token);
    localStorage.setItem('pulse_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    applyVerified(data.user);
    setUser(data.user);
    return data;
  };

  const doLogout = () => {
    setToken(null); setUser(null); setFrozen(false);
    localStorage.removeItem('pulse_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const logout = async () => {
    try { await axios.post('/auth/logout'); } catch {}
    doLogout();
  };

  const updateUser = (updates) => setUser(u => {
    const next = { ...u, ...updates };
    applyVerified(next);
    return next;
  });

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050510', flexDirection:'column', gap:16 }}>
      <div style={{ width:48, height:48, border:'3px solid rgba(124,92,252,0.3)', borderTopColor:'#7C5CFC', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <div style={{ color:'rgba(240,240,255,0.4)', fontFamily:'sans-serif', fontSize:'0.9rem' }}>Загрузка Pulse...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (frozen) return <FrozenScreen onLogout={doLogout} />;

  return (
    <Ctx.Provider value={{ user, token, login, register, logout, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
