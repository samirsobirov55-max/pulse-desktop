import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Settings from './components/Settings';
import Profile from './components/Profile';
import ConnectionStatus from './components/ConnectionStatus';

// ── TopBar ──────────────────────────────────────────────
function TopBar({ title, onBack }) {
  return (
    <div style={{height:52,display:'flex',alignItems:'center',gap:8,padding:'0 10px',
      borderBottom:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)',
      backdropFilter:'blur(20px)',flexShrink:0}}>
      <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',
        color:'#7C5CFC',display:'flex',alignItems:'center',padding:'8px 4px'}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
        </svg>
      </button>
      <span style={{fontWeight:700,fontFamily:'Syne,sans-serif'}}>{title}</span>
    </div>
  );
}

// ── Пустой экран ─────────────────────────────────────────
function EmptyChat() {
  return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
      flexDirection:'column',gap:12,color:'rgba(240,240,255,0.15)'}}>
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1rem'}}>Выберите чат</span>
    </div>
  );
}

// ── Главный компонент ────────────────────────────────────
function MainApp() {
  const { user } = useAuth();

  // Состояние навигации
  const [chat, setChat]     = useState(null);   // активный чат
  const [panel, setPanel]   = useState(null);   // 'profile' | 'settings' | null
  const [screen, setScreen] = useState('sidebar'); // мобиле: 'sidebar' | 'chat'

  const sidebarRef = useRef(null);

  const isMobile = () => window.innerWidth < 768;

  if (!user) return <Navigate to="/auth" replace />;

  // ── Открыть чат ──
  const openChat = useCallback((c) => {
    if (!c) return; // защита от null
    setChat(c);
    setPanel(null);
    setScreen('chat');
  }, []);

  // ── Назад (мобиле) ──
  const goBack = useCallback(() => {
    setScreen('sidebar');
    setPanel(null);
    setChat(null); // ВСЕГДА сбрасываем чат при нажатии "назад"
  }, []);

  // ── Открыть профиль / настройки ──
  const openProfile  = useCallback(() => { setPanel('profile');  setScreen('chat'); }, []);
  const openSettings = useCallback(() => { setPanel('settings'); setScreen('chat'); }, []);

  // ── Удалить чат ──
  const handleDeleteChat = useCallback((id) => {
    sidebarRef.current?.removeChat(id);
    setChat(null);
    setPanel(null);
    setScreen('sidebar');
  }, []);

  const BG = (
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',
      background:'radial-gradient(ellipse at 15% 25%,rgba(124,92,252,0.09),transparent 55%),radial-gradient(ellipse at 85% 80%,rgba(252,92,168,0.07),transparent 50%)'}}/>
  );

  const sidebarEl = (
    <Sidebar
      ref={sidebarRef}
      onSelectChat={openChat}
      selectedChatId={chat?._id}
      onOpenProfile={openProfile}
      onOpenSettings={openSettings}
    />
  );

  // ── Десктоп ──
  if (!isMobile()) {
    const mainContent = () => {
      if (panel === 'profile')  return <><Profile/></>;
      if (panel === 'settings') return <><Settings/></>;
      if (chat)                 return <ChatWindow key={chat._id} chat={chat} onBack={goBack} onDeleteChat={handleDeleteChat}/>;
      return <EmptyChat/>;
    };

    return (
      <div style={{display:'flex',height:'100vh',overflow:'hidden',position:'relative'}}>
        {BG}<ConnectionStatus/>
        <div style={{width:320,flexShrink:0,borderRight:'1px solid rgba(255,255,255,0.07)',
          display:'flex',flexDirection:'column',position:'relative',zIndex:1}}>
          {sidebarEl}
        </div>
        <main style={{flex:1,display:'flex',overflow:'hidden',position:'relative',zIndex:1}}>
          {mainContent()}
        </main>
      </div>
    );
  }

  // ── Мобиле ──
  const mobileContent = () => {
    if (panel === 'profile') return (
      <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
        <TopBar title="Мой профиль" onBack={goBack}/>
        <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}><Profile/></div>
      </div>
    );
    if (panel === 'settings') return (
      <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
        <TopBar title="Настройки" onBack={goBack}/>
        <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}><Settings/></div>
      </div>
    );
    if (chat) return (
      <ChatWindow key={chat._id} chat={chat} onBack={goBack} onDeleteChat={handleDeleteChat}/>
    );
    // Если ни chat ни panel — переключаемся на sidebar
    if (screen === 'chat') {
      setScreen('sidebar');
    }
    return null;
  };

  const slideIn  = 'none';
  const slideOut = 'translateX(-100%)';
  const slideR   = 'translateX(100%)';

  return (
    <div style={{position:'relative',width:'100vw',height:'100dvh',overflow:'hidden'}}>
      {BG}<ConnectionStatus/>

      {/* Sidebar — всегда в DOM */}
      <div style={{
        position:'absolute',inset:0,zIndex:1,
        transform: screen==='sidebar' ? slideIn : slideOut,
        transition:'transform .28s cubic-bezier(.4,0,.2,1)',
        display:'flex',flexDirection:'column',background:'var(--bg-dark)',
      }}>
        {sidebarEl}
      </div>

      {/* Chat/Profile/Settings */}
      <div style={{
        position:'absolute',inset:0,zIndex:2,
        transform: screen==='chat' ? slideIn : slideR,
        transition:'transform .28s cubic-bezier(.4,0,.2,1)',
        display:'flex',flexDirection:'column',background:'var(--bg-dark)',
      }}>
        {mobileContent()}
      </div>
    </div>
  );
}

// ── Root ────────────────────────────────────────────────
// Перехватываем кнопку назад на Android
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    window.history.pushState({ pulse: true }, '');
  });
  window.addEventListener('popstate', (e) => {
    // Всегда возвращаем state чтобы не выйти из приложения
    window.history.pushState({ pulse: true }, '');
  });
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage/>}/>
          <Route path="/*"   element={<MainApp/>}/>
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}
