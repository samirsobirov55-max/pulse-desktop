import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const HF = 'https://auragram-telegram-web.hf.space';
const absUrl = url => (!url || url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) ? url : HF + url;

const I = {
  search:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  user:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  settings: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chat:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  group:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  channel:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.69 19 19.5 19.5 0 0 1 5 12.31a19.79 19.79 0 0 1-2-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11l-1.27.91a16 16 0 0 0 6.18 6.18l.91-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  leave:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  trash:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  bot:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/><path d="M12 3v2"/></svg>,
  star:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

function VBadge() {
  return (
    <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:14,height:14,background:'#2563eb',borderRadius:'50%',flexShrink:0,marginLeft:2}}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
  );
}

function Av({ u, chat, size=46 }) {
  const cols = ['#7C5CFC','#FC5CA8','#5CF4FC','#4ADE80','#FBBF24','#F87171'];
  const src = u?.avatar ? absUrl(u.avatar) : (chat?.avatar ? absUrl(chat.avatar) : null);
  const name = u?.nickname || chat?.name || '?';
  const col = cols[(name.charCodeAt(0)||0) % cols.length];
  if (src) return <img src={src} alt="" style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>;
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:`linear-gradient(135deg,${col},${col}88)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.38,fontWeight:800,color:'#fff',flexShrink:0}}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

const Sidebar = forwardRef(function Sidebar({ onSelectChat, selectedChatId, onOpenProfile, onOpenSettings }, ref) {
  const { user, logout } = useAuth();
  const { socket } = useSocket() || {};
  const [chats,       setChats]       = useState([]);
  const [search,      setSearch]      = useState('');
  const [results,     setResults]     = useState(null);
  const [showMenu,    setShowMenu]    = useState(false);
  const [chatCtx,     setChatCtx]     = useState(null);
  const [createModal, setCreateModal] = useState(null);
  const [form,        setForm]        = useState({ name:'', desc:'', username:'', isPublic:false });
  const [formErr,     setFormErr]     = useState('');
  const [loading,     setLoading]     = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(null); // 'botfather' | 'stars' | null
  const debRef  = useRef(null);
  const isMobile = window.innerWidth < 768;

  useImperativeHandle(ref, () => ({
    removeChat: (id)   => setChats(prev => prev.filter(c => c._id !== id)),
    addChat:    (chat) => setChats(prev => prev.some(c => c._id === chat._id) ? prev : [chat, ...prev]),
    updateChat: (chat) => setChats(prev => prev.map(c => c._id === chat._id ? chat : c)),
  }));

  useEffect(() => { loadChats(); }, []);

  // Real-time
  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      const cid = msg.chatId || msg.chat;
      if (!cid) return;
      setChats(prev => {
        const idx = prev.findIndex(c => c._id === cid);
        if (idx === -1) return prev;
        const upd = { ...prev[idx], lastMessage: msg, updatedAt: new Date().toISOString() };
        return [upd, ...prev.filter((_, i) => i !== idx)];
      });
    };
    const onNew   = (chat) => setChats(prev => prev.some(c => c._id === chat._id) ? prev : [chat, ...prev]);
    const onUpd   = (chat) => setChats(prev => prev.map(c => c._id === (chat._id || chat) ? { ...c, ...chat } : c));
    const onSt    = ({ userId, isOnline }) => setChats(prev => prev.map(c => ({
      ...c, members: (c.members||[]).map(m => m._id === userId ? { ...m, isOnline } : m)
    })));
    socket.on('message:new',  onMsg);
    socket.on('chat:new',     onNew);
    socket.on('chat:updated', onUpd);
    socket.on('user:status',  onSt);
    return () => {
      socket.off('message:new',  onMsg);
      socket.off('chat:new',     onNew);
      socket.off('chat:updated', onUpd);
      socket.off('user:status',  onSt);
    };
  }, [socket]);

  const loadChats = async () => {
    try {
      const { data } = await axios.get('/chats');
      setChats(data);
    } catch {}
    finally { setLoading(false); }
  };

  const doSearch = (val) => {
    setSearch(val);
    clearTimeout(debRef.current);
    if (!val.trim()) { setResults(null); return; }
    debRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/users/search?q=${encodeURIComponent(val)}`);
        setResults(data);
      } catch { setResults({ users:[], chats:[] }); }
    }, 300);
  };

  const openPrivate = async (uid) => {
    try {
      const { data } = await axios.post('/chats/private', { userId: uid });
      setResults(null); setSearch('');
      onSelectChat(data);
      setChats(prev => prev.some(c => c._id === data._id) ? prev : [data, ...prev]);
    } catch {}
  };

  const joinChat = async (chat) => {
    try {
      const { data } = await axios.get(`/chats/join/${chat.inviteLink || chat._id}`);
      setResults(null); setSearch('');
      onSelectChat(data);
      setChats(prev => prev.some(c => c._id === data._id) ? prev : [data, ...prev]);
    } catch {}
  };

  const deleteOrLeave = async (c) => {
    try {
      if (c.type === 'private' || c.type === 'saved') {
        await axios.delete(`/chats/${c._id}`);
      } else {
        await axios.post(`/chats/${c._id}/leave`);
      }
      setChats(prev => prev.filter(ch => ch._id !== c._id));
    } catch {}
  };

  const createChat = async () => {
    if (!form.name.trim()) { setFormErr('Введите название'); return; }
    try {
      const ep   = createModal === 'channel' ? '/chats/channel' : '/chats/group';
      const body = createModal === 'channel'
        ? { name: form.name.trim(), description: form.desc, username: form.username, isPublic: form.isPublic }
        : { name: form.name.trim(), description: form.desc, isPublic: form.isPublic };
      const { data } = await axios.post(ep, body);
      setChats(prev => [data, ...prev]);
      onSelectChat(data);
      setCreateModal(null); setForm({ name:'', desc:'', username:'', isPublic:false }); setFormErr('');
    } catch(e) { setFormErr(e.response?.data?.message || 'Ошибка'); }
  };

  const other = (c) => c.type === 'private'
    ? (c.members || []).find(m => m._id !== user?.id && m._id !== user?._id) || null
    : null;

  const chatName = (c) => {
    if (c.type === 'saved') return 'Избранное';
    if (c.type === 'private') return other(c)?.nickname || 'Чат';
    return c.name || 'Группа';
  };

  const lastMsg = (c) => {
    const m = c.lastMessage;
    if (!m) return '';
    const isMe = m.sender?._id === user?.id || m.sender?._id === user?._id || m.sender === user?.id;
    const prefix = isMe ? 'Вы: ' : '';
    if (m.type === 'image') return prefix + '📷 Фото';
    if (m.type === 'voice') return prefix + '🎤 Голосовое';
    if (m.type === 'file')  return prefix + `📎 ${m.fileName || 'Файл'}`;
    if (m.type === 'geo')   return prefix + '📍 Геопозиция';
    return prefix + (m.content || '');
  };

  const timeStr = (c) => {
    const d = c.lastMessage?.createdAt || c.updatedAt;
    if (!d) return '';
    try {
      const date = new Date(d);
      const now  = new Date();
      const diff = now - date;
      const mins = Math.floor(diff/60000);
      const hrs  = Math.floor(diff/3600000);
      const days = Math.floor(diff/86400000);
      if (date.getDate()===now.getDate() && hrs<24)
        return date.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
      if (days===1) return 'Вчера';
      if (days<7)   return date.toLocaleDateString('ru',{weekday:'short'});
      return date.toLocaleDateString('ru',{day:'numeric',month:'short'});
    } catch { return ''; }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',position:'relative'}}>

      {/* Шапка */}
      <div style={{flexShrink:0,padding:'10px 12px 8px',borderBottom:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.02)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <button onClick={() => setShowMenu(v => !v)} style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',padding:0,position:'relative'}}>
            <Av u={user} size={36}/>
            <div style={{position:'absolute',bottom:0,right:0,width:9,height:9,borderRadius:'50%',background:'#4ADE80',border:'2px solid #0a0a1a'}}/>
          </button>
          <span style={{flex:1,fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:'1.35rem',background:'linear-gradient(135deg,#7C5CFC,#FC5CA8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Pulse</span>
          <button onClick={() => setCreateModal('group')} title="Создать группу" style={{width:34,height:34,borderRadius:10,background:'rgba(124,92,252,0.1)',border:'1px solid rgba(124,92,252,0.2)',cursor:'pointer',color:'#7C5CFC',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {I.plus}
          </button>
        </div>
        {/* Поиск */}
        <div style={{position:'relative'}}>
          <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'rgba(240,240,255,0.25)',pointerEvents:'none',display:'flex'}}>{I.search}</span>
          <input value={search} onChange={e => doSearch(e.target.value)} placeholder="Поиск..." className="input"
            style={{paddingLeft:32,fontSize:'0.875rem',padding:'9px 32px',height:36}}/>
          {search && <button onClick={() => { setSearch(''); setResults(null); }} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(240,240,255,0.3)',display:'flex',padding:2}}>{I.close}</button>}
        </div>
      </div>

      {/* Бургер-меню */}
      {showMenu && (
        <div style={{position:'fixed',inset:0,zIndex:300}} onClick={() => setShowMenu(false)}>
          <div className="glass-strong" style={{position:'absolute',top:54,left:10,width:220,borderRadius:14,padding:6,zIndex:301}} onClick={e => e.stopPropagation()}>
            <div style={{padding:'12px 14px 10px',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:4}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <Av u={user} size={38}/>
                <div>
                  <div style={{fontWeight:700,fontSize:'0.9rem',display:'flex',alignItems:'center',gap:4}}>
                    {user?.nickname}
                    {user?.isVerified && <VBadge/>}
                  </div>
                  <div style={{color:'rgba(240,240,255,0.35)',fontSize:'0.75rem'}}>@{user?.username}</div>
                </div>
              </div>
            </div>
            <div className="ctx-item" onClick={() => { onOpenProfile(); setShowMenu(false); }}>{I.user}<span style={{marginLeft:8}}>Профиль</span></div>
            <div className="ctx-item" onClick={() => { onOpenSettings(); setShowMenu(false); }}>{I.settings}<span style={{marginLeft:8}}>Настройки</span></div>
            <div style={{height:1,background:'rgba(255,255,255,0.07)',margin:'4px 0'}}/>
            <div className="ctx-item" onClick={() => { setCreateModal('group');   setShowMenu(false); }}>{I.group}<span style={{marginLeft:8}}>Новая группа</span></div>
            <div className="ctx-item" onClick={() => { setCreateModal('channel'); setShowMenu(false); }}>{I.channel}<span style={{marginLeft:8}}>Новый канал</span></div>
            <div style={{height:1,background:'rgba(255,255,255,0.07)',margin:'4px 0'}}/>
            <div className="ctx-item" onClick={() => { setShowComingSoon('botfather'); setShowMenu(false); }}>
              {I.bot}<span style={{marginLeft:8}}>BotFather</span>
              <span style={{marginLeft:'auto',fontSize:'0.62rem',fontWeight:700,letterSpacing:'.4px',padding:'2px 6px',borderRadius:6,background:'rgba(124,92,252,0.18)',color:'#7C5CFC',flexShrink:0}}>СКОРО</span>
            </div>
            <div className="ctx-item" onClick={() => { setShowComingSoon('stars'); setShowMenu(false); }}>
              {I.star}<span style={{marginLeft:8}}>Звёзды</span>
              <span style={{marginLeft:'auto',fontSize:'0.62rem',fontWeight:700,letterSpacing:'.4px',padding:'2px 6px',borderRadius:6,background:'rgba(251,191,36,0.15)',color:'#FBBF24',flexShrink:0}}>СКОРО</span>
            </div>
            <div style={{height:1,background:'rgba(255,255,255,0.07)',margin:'4px 0'}}/>
            <div className="ctx-item" style={{color:'#f87171'}} onClick={() => { logout(); setShowMenu(false); }}>{I.logout}<span style={{marginLeft:8}}>Выйти</span></div>
          </div>
        </div>
      )}

      {/* ── Coming Soon модал (BotFather / Stars) ── */}
      {showComingSoon && (
        <div style={{position:'fixed',inset:0,zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)'}}
          onClick={() => setShowComingSoon(null)}>
          <div className="glass-strong" style={{borderRadius:20,padding:'32px 28px',maxWidth:300,width:'90%',textAlign:'center'}} onClick={e => e.stopPropagation()}>
            <div style={{fontSize:'3rem',marginBottom:12}}>
              {showComingSoon === 'botfather' ? '🤖' : '⭐'}
            </div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.3rem',marginBottom:8}}>
              {showComingSoon === 'botfather' ? 'BotFather' : 'Звёзды'}
            </div>
            <div style={{display:'inline-block',background:'linear-gradient(135deg,rgba(124,92,252,0.25),rgba(252,92,168,0.18))',borderRadius:8,padding:'4px 14px',marginBottom:16,fontSize:'0.78rem',fontWeight:700,color:'#7C5CFC',letterSpacing:'.5px',border:'1px solid rgba(124,92,252,0.3)'}}>
              СКОРО
            </div>
            <div style={{color:'rgba(240,240,255,0.55)',fontSize:'0.875rem',lineHeight:1.6,marginBottom:20}}>
              {showComingSoon === 'botfather'
                ? 'Создавайте собственных ботов для автоматизации чатов, рассылок и интеграций. Функция появится в ближайших обновлениях.'
                : 'Звёзды — внутренняя валюта Pulse для вознаграждения авторов, поддержки каналов и эксклюзивных возможностей. Следите за новостями!'}
            </div>
            <button onClick={() => setShowComingSoon(null)} style={{width:'100%',padding:'11px',borderRadius:12,border:'none',cursor:'pointer',background:'rgba(124,92,252,0.18)',color:'#7C5CFC',fontWeight:700,fontSize:'0.9rem',fontFamily:'DM Sans,sans-serif'}}>
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* Список чатов / поиск */}
      <div style={{flex:1,overflowY:'auto'}}>
        {results !== null ? (
          <div>
            {results.users?.length === 0 && results.chats?.length === 0 && (
              <div style={{textAlign:'center',padding:'40px 20px',color:'rgba(240,240,255,0.2)',fontSize:'0.875rem'}}>Ничего не найдено</div>
            )}
            {results.users?.length > 0 && (
              <>
                <div style={{padding:'10px 14px 4px',fontSize:'0.68rem',color:'rgba(240,240,255,0.28)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.6px'}}>Пользователи</div>
                {results.users.map(u => (
                  <div key={u._id} onClick={() => openPrivate(u._id)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',cursor:'pointer'}}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div style={{position:'relative',flexShrink:0}}>
                      <Av u={u} size={42}/>
                      {u.isOnline && <div style={{position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',background:'#4ADE80',border:'2px solid #0a0a1a'}}/>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:'0.875rem',display:'flex',alignItems:'center'}}>
                        {u.nickname}{u.isVerified && <VBadge/>}
                        {u.isFrozen && <span style={{marginLeft:4,fontSize:'0.7rem'}}>🧊</span>}
                      </div>
                      <div style={{color:'rgba(240,240,255,0.3)',fontSize:'0.75rem'}}>@{u.username}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {results.chats?.length > 0 && (
              <>
                <div style={{padding:'10px 14px 4px',fontSize:'0.68rem',color:'rgba(240,240,255,0.28)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.6px'}}>Группы и каналы</div>
                {results.chats.map(c => (
                  <div key={c._id} onClick={() => joinChat(c)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',cursor:'pointer'}}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <Av chat={c} size={42}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:'0.875rem'}}>{c.name}</div>
                      <div style={{color:'rgba(240,240,255,0.3)',fontSize:'0.75rem'}}>{c.members?.length || 0} {c.type==='channel'?'подписчиков':'участников'}</div>
                    </div>
                    <span style={{fontSize:'0.72rem',color:'#7C5CFC',flexShrink:0}}>Войти</span>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'30px',opacity:.3}}>
            <div style={{width:24,height:24,border:'2px solid rgba(124,92,252,0.4)',borderTopColor:'#7C5CFC',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
          </div>
        ) : chats.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(240,240,255,0.18)'}}>
            <div style={{marginBottom:10,display:'flex',justifyContent:'center',opacity:.25}}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{fontSize:'0.875rem'}}>Нет чатов. Найдите кого-нибудь в поиске.</div>
          </div>
        ) : (
          chats.map(c => {
            const o   = other(c);
            const sel = c._id === selectedChatId;
            return (
              <div key={c._id}
                onClick={() => onSelectChat(c)}
                onContextMenu={e => { e.preventDefault(); setChatCtx({ c, x:e.clientX, y:e.clientY }); }}
                onTouchStart={e => { const t=e.touches[0]; const tm=setTimeout(() => setChatCtx({ c, x:t.clientX, y:t.clientY }), 500); e.currentTarget._lt=tm; }}
                onTouchEnd={e => clearTimeout(e.currentTarget._lt)}
                onTouchMove={e => clearTimeout(e.currentTarget._lt)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px 9px 10px',cursor:'pointer',background:sel?'rgba(124,92,252,0.13)':'transparent',borderLeft:sel?'3px solid #7C5CFC':'3px solid transparent',transition:'background .12s'}}
                onMouseEnter={e => { if(!sel) e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if(!sel) e.currentTarget.style.background='transparent'; }}>
                <div style={{position:'relative',flexShrink:0}}>
                  <Av u={o} chat={c} size={44}/>
                  {c.type === 'private' && o?.isOnline && (
                    <div style={{position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',background:'#4ADE80',border:'2px solid #0a0a1a'}}/>
                  )}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                    <div style={{fontWeight:600,fontSize:'0.875rem',display:'flex',alignItems:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%'}}>
                      {chatName(c)}{o?.isVerified && <VBadge/>}{o?.isFrozen && <span style={{marginLeft:3,fontSize:'0.68rem'}}>🧊</span>}
                    </div>
                    <span style={{fontSize:'0.68rem',color:'rgba(240,240,255,0.22)',flexShrink:0,marginLeft:4}}>{timeStr(c)}</span>
                  </div>
                  <div style={{fontSize:'0.775rem',color:'rgba(240,240,255,0.32)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lastMsg(c)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Контекст-меню (ПКМ / долгое нажатие) */}
      {chatCtx && (
        <div style={{position:'fixed',inset:0,zIndex:400}} onClick={() => setChatCtx(null)}>
          <div className="glass ctx-menu" style={{position:'absolute',top:Math.min(chatCtx.y,window.innerHeight-120),left:Math.min(chatCtx.x,window.innerWidth-200),minWidth:195,zIndex:401}} onClick={e => e.stopPropagation()}>
            <div className="ctx-item" onClick={() => { onSelectChat(chatCtx.c); setChatCtx(null); }}>
              <span style={{display:'inline-flex',marginRight:9,opacity:.65}}>{I.chat}</span>Открыть
            </div>
            <div style={{height:1,background:'rgba(255,255,255,0.07)',margin:'3px 0'}}/>
            <div className="ctx-item danger" onClick={() => { deleteOrLeave(chatCtx.c); setChatCtx(null); }}>
              <span style={{display:'inline-flex',marginRight:9}}>{I.trash}</span>
              {chatCtx.c.type === 'private' || chatCtx.c.type === 'saved' ? 'Удалить чат' : 'Покинуть'}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания группы/канала */}
      {createModal && (
        <div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(8px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={() => setCreateModal(null)}>
          <div className="glass-strong" style={{width:'100%',maxWidth:480,borderRadius:'22px 22px 0 0',padding:24}} onClick={e => e.stopPropagation()}>
            <div style={{width:36,height:4,background:'rgba(255,255,255,0.15)',borderRadius:2,margin:'0 auto 16px'}}/>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.1rem',marginBottom:16}}>
              {createModal === 'channel' ? 'Новый канал' : 'Новая группа'}
            </div>
            {formErr && <div style={{background:'rgba(239,68,68,0.1)',color:'#f87171',borderRadius:10,padding:'8px 12px',marginBottom:12,fontSize:'0.875rem'}}>{formErr}</div>}
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} placeholder="Название" className="input" style={{width:'100%',marginBottom:10}}/>
            <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc:e.target.value }))} placeholder="Описание (необязательно)" className="input" style={{width:'100%',marginBottom:10}}/>
            {createModal === 'channel' && (
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username:e.target.value.replace('@','') }))} placeholder="@username канала (необязательно)" className="input" style={{width:'100%',marginBottom:10}}/>
            )}
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              {[{v:false,l:'Приватный'},{v:true,l:'Публичный'}].map(({v,l})=>(
                <button key={l} onClick={()=>setForm(f=>({...f,isPublic:v}))} style={{flex:1,padding:'9px',borderRadius:11,border:'1px solid '+(form.isPublic===v?'#7C5CFC':'rgba(255,255,255,.1)'),background:form.isPublic===v?'rgba(124,92,252,.15)':'transparent',color:form.isPublic===v?'#7C5CFC':'rgba(240,240,255,.4)',cursor:'pointer',fontSize:'.82rem',fontWeight:form.isPublic===v?700:400}}>{l}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:9,marginTop:8}}>
              <button onClick={() => { setCreateModal(null); setFormErr(''); }} style={{flex:1,padding:12,borderRadius:13,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'rgba(240,240,255,0.4)',cursor:'pointer'}}>Отмена</button>
              <button onClick={createChat} style={{flex:2,padding:12,borderRadius:13,border:'none',background:'linear-gradient(135deg,#7C5CFC,#9B7CFF)',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'Syne,sans-serif'}}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {/* Нижний бар (мобиле) */}
      {isMobile && (
        <div style={{flexShrink:0,height:52,borderTop:'1px solid rgba(255,255,255,0.07)',background:'rgba(5,5,16,0.98)',backdropFilter:'blur(20px)',display:'flex'}}>
          {[[I.chat,'Чаты',null],[I.user,'Профиль','profile'],[I.settings,'Настройки','settings']].map(([ic,lb,ac],i) => (
            <button key={i} onClick={() => { if(ac === 'profile') onOpenProfile(); else if(ac === 'settings') onOpenSettings(); }} style={{flex:1,background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,color:'rgba(240,240,255,0.35)',padding:'6px 0',fontSize:'0.6rem'}}>
              <span style={{display:'inline-flex'}}>{ic}</span>{lb}
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
});

export default Sidebar;
