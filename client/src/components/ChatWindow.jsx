import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { formatDistanceToNow, format } from 'date-fns';
import { soundManager } from '../sounds/useSounds.js';
import { ru } from 'date-fns/locale';

/* ───────── SVG иконки ───────── */
const HF_SERVER = 'https://auragram-telegram-web.hf.space';
function absUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return HF_SERVER + (url.startsWith('/') ? url : '/' + url);
}

const I = {
  back:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>,
  send:    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
  attach:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  mic:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/></svg>,
  phone:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.29 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.18 6.18l1.27-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  video:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  dots:    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>,
  close:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  photo:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  file:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  geo:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  trash:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  leave:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  block:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  snow:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 6-8 4-8-4"/><path d="m20 18-8-4-8 4"/><path d="m2 12 10 4 10-4"/></svg>,
  info:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  user:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  reply:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
  edit2:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  copy:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  members: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  mute:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
  star:    <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFD700"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  contact: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>,
  pen:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  channel: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.69 19 19.5 19.5 0 0 1 5 12.31a19.79 19.79 0 0 1-2-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11l-1.27.91a16 16 0 0 0 6.18 6.18l.91-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  camera:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  screen:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
};

const REACTIONS = ['👍','❤️','😂','😮','😢','🔥','🎉','💯'];
const ICE_CFG = {
  iceServers: [
    // Google STUN
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Cloudflare STUN (работает везде)
    { urls: 'stun:stun.cloudflare.com:3478' },
    // Open relay TURN (бесплатный, работает через NAT и файрволы)
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443',
      ],
      username:   'openrelayproject',
      credential: 'openrelayproject',
    },
    // Дополнительный TURN от metered.ca
    {
      urls: [
        'turn:a.relay.metered.ca:80',
        'turn:a.relay.metered.ca:80?transport=tcp',
        'turn:a.relay.metered.ca:443',
        'turns:a.relay.metered.ca:443',
      ],
      username:   'e8dd65f13a7e57b20ae4da17',
      credential: 'uBpT5cSQR3rZBLyT',
    },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
};

/* ── helpers ── */
function VBadge({ s=15 }) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:s,height:s,background:'#2563eb',borderRadius:'50%',flexShrink:0,marginLeft:3}}>
      <svg width={s*.62} height={s*.62} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
  );
}

function Ava({ u, size=38 }) {
  const cols=['#7C5CFC','#FC5CA8','#5CF4FC','#4ADE80','#FBBF24','#F87171'];
  const col=cols[((u?.username||'a').charCodeAt(0))%cols.length];
  if (u?.avatar) return <img src={absUrl(u.avatar)} alt="" style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>;
  return <div style={{width:size,height:size,borderRadius:'50%',background:`linear-gradient(135deg,${col},${col}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.38,fontWeight:800,color:'#fff',flexShrink:0}}>{(u?.nickname||'?')[0].toUpperCase()}</div>;
}

function Dots() {
  return <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
    {[0,1,2].map(i=><span key={i} style={{width:4,height:4,borderRadius:'50%',background:'#7C5CFC',animation:`td 1.2s ${i*.2}s ease infinite`}}/>)}
    <style>{`@keyframes td{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
  </span>;
}

function VoiceMsg({ url }) {
  const [play,setPlay]=useState(false);
  const [prog,setProg]=useState(0);
  const [dur,setDur]=useState(0);
  const [cur,setCur]=useState(0);
  const ref=useRef();
  const fmt=s=>s?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'0:00';
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:210}}>
      <audio ref={ref} src={url}
        onLoadedMetadata={e=>setDur(e.target.duration||0)}
        onEnded={()=>{setPlay(false);setProg(0);setCur(0);}}
        onTimeUpdate={e=>{const d=e.target.duration||1;setCur(e.target.currentTime);setProg(e.target.currentTime/d*100);}}/>
      <button onClick={()=>{play?ref.current?.pause():ref.current?.play();setPlay(v=>!v);}} style={{width:34,height:34,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(124,92,252,.3)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        {play?<svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>:<svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
      </button>
      <div style={{flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{flex:1,cursor:'pointer'}} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();if(ref.current)ref.current.currentTime=(e.clientX-r.left)/r.width*(ref.current.duration||0);}}>
            <div style={{height:3,background:'rgba(255,255,255,.12)',borderRadius:2}}><div style={{height:'100%',width:`${prog}%`,background:'#7C5CFC',borderRadius:2,transition:'.1s'}}/></div>
          </div>
          <a href={url} download="voice_message.webm" title="Скачать" style={{color:'rgba(255,255,255,.3)',display:'inline-flex',flexShrink:0,textDecoration:'none'}} onClick={e=>e.stopPropagation()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </a>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:2}}>
          <span style={{fontSize:'.65rem',color:'rgba(255,255,255,.35)'}}>Голосовое сообщение</span>
          <span style={{fontSize:'.65rem',color:'rgba(255,255,255,.25)'}}>{play?fmt(cur):fmt(dur)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Профиль пользователя (снизу) ── */
function UserSheet({ u, isOnline, onClose, onBlock, isBlocked, onFreeze, isAdmin, inContacts, onToggleContact, localName, onSaveLocalName }) {
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal]   = useState(localName || '');

  const saveLocalName = async () => {
    await onSaveLocalName(nameVal.trim());
    setEditName(false);
  };

  const displayName = localName || u.nickname;

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,.65)',backdropFilter:'blur(8px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={onClose}>
      <div className="glass-strong" style={{width:'100%',maxWidth:480,borderRadius:'22px 22px 0 0',padding:24,maxHeight:'88vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>

        {/* Аватар и имя */}
        <div style={{textAlign:'center',paddingBottom:20,borderBottom:'1px solid rgba(255,255,255,.07)',marginBottom:16}}>
          <Ava u={u} size={90}/>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.25rem',marginTop:12,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
            {displayName}
            {u.isVerified&&<VBadge s={20}/>}
            {u.isPremium&&<span style={{marginLeft:4,display:'inline-flex'}}>{I.star}</span>}
            {u.isFrozen&&<span style={{marginLeft:4,display:'inline-flex',opacity:.75}}>{I.snow}</span>}
          </div>
          {localName && <div style={{fontSize:'.8rem',color:'rgba(240,240,255,.35)',marginTop:2}}>наст. имя: {u.nickname}</div>}
          <div style={{color:'rgba(240,240,255,.4)',marginTop:3,fontSize:'.85rem'}}>@{u.username}</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:isOnline?'#4ADE80':'rgba(255,255,255,.2)'}}/>
            <span style={{fontSize:'.8rem',color:'rgba(240,240,255,.4)'}}>{isOnline?'в сети':'недавно в сети'}</span>
          </div>
          {u.bio&&<div style={{marginTop:12,padding:'10px 14px',background:'rgba(255,255,255,.05)',borderRadius:12,fontSize:'.875rem',color:'rgba(240,240,255,.5)',textAlign:'left'}}>{u.bio}</div>}
        </div>

        {/* Кастомное имя для контакта */}
        {inContacts && (
          <div style={{marginBottom:12,padding:'12px 14px',background:'rgba(255,255,255,.04)',borderRadius:14,border:'1px solid rgba(255,255,255,.07)'}}>
            <div style={{fontSize:'.72rem',color:'rgba(240,240,255,.35)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Своё имя для контакта</div>
            {editName ? (
              <div style={{display:'flex',gap:8}}>
                <input value={nameVal} onChange={e=>setNameVal(e.target.value)} placeholder={u.nickname} className="input" style={{flex:1,fontSize:'.9rem',padding:'8px 12px'}} autoFocus onKeyDown={e=>{if(e.key==='Enter')saveLocalName();if(e.key==='Escape')setEditName(false);}}/>
                <button onClick={saveLocalName} style={{padding:'8px 14px',borderRadius:10,border:'none',background:'#7C5CFC',color:'#fff',cursor:'pointer',fontSize:'.85rem',fontWeight:600}}>ОК</button>
                <button onClick={()=>setEditName(false)} style={{padding:'8px 10px',borderRadius:10,border:'1px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(240,240,255,.4)',cursor:'pointer'}}>✕</button>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:'.9rem',color:localName?'#fff':'rgba(240,240,255,.3)'}}>{localName||'Не задано'}</span>
                <button onClick={()=>{setNameVal(localName||'');setEditName(true);}} style={{background:'rgba(124,92,252,.15)',border:'1px solid rgba(124,92,252,.3)',borderRadius:8,padding:'5px 10px',color:'#7C5CFC',cursor:'pointer',fontSize:'.78rem',display:'flex',alignItems:'center',gap:4}}>
                  {I.pen} Изменить
                </button>
              </div>
            )}
          </div>
        )}

        {/* Кнопки */}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <button onClick={onToggleContact} style={{padding:'12px',borderRadius:14,border:`1px solid ${inContacts?'rgba(239,68,68,.3)':'rgba(74,222,128,.3)'}`,background:inContacts?'rgba(239,68,68,.08)':'rgba(74,222,128,.08)',color:inContacts?'#f87171':'#4ADE80',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontWeight:600,fontSize:'.9rem'}}>
            {I.contact} {inContacts?'Убрать из контактов':'Добавить в контакты'}
          </button>
          <button onClick={onBlock} style={{padding:'12px',borderRadius:14,border:`1px solid ${isBlocked?'rgba(74,222,128,.3)':'rgba(239,68,68,.3)'}`,background:isBlocked?'rgba(74,222,128,.08)':'rgba(239,68,68,.08)',color:isBlocked?'#4ADE80':'#f87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontWeight:600,fontSize:'.9rem'}}>
            {I.block} {isBlocked?'Разблокировать':'Заблокировать'}
          </button>
          {isAdmin&&<button onClick={onFreeze} style={{padding:'12px',borderRadius:14,border:'1px solid rgba(99,102,241,.3)',background:'rgba(99,102,241,.08)',color:'#818cf8',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontWeight:600,fontSize:'.9rem'}}>
            {I.snow} {u.isFrozen?'Разморозить аккаунт':'Заморозить аккаунт'}
          </button>}
          <button onClick={onClose} style={{padding:'12px',borderRadius:14,border:'1px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(240,240,255,.4)',cursor:'pointer',fontSize:'.9rem'}}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

/* ── Инфо группы/канала ── */
function GroupSheet({ chat: initChat, currentUserId, onClose, onLeave, onChatUpdated }) {
  const [chat, setChat]         = useState(initChat);
  const [tab, setTab]           = useState('info'); // info | members | edit
  const [editName, setEditName] = useState(initChat.name||'');
  const [editDesc, setEditDesc] = useState(initChat.description||'');
  const [editUser, setEditUser] = useState(initChat.username||'');
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [avatarPrev, setAvatarPrev] = useState(null);
  const [addSearch, setAddSearch]   = useState('');
  const [addResults, setAddResults] = useState([]);
  const fileRef = useRef();
  const debRef  = useRef();

  const myId    = currentUserId?.toString();
  const ownerId = chat.owner?._id?.toString() || chat.owner?.toString();
  const adminIds= (chat.admins||[]).map(a=>(a._id||a).toString());
  const amOwner = myId === ownerId;
  const amAdmin = amOwner || adminIds.includes(myId);

  const flash = (t) => { setMsg(t); setTimeout(()=>setMsg(''),2500); };

  // Аватар чата
  const pickAvatar = () => fileRef.current?.click();
  const onAvatarFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      setAvatarPrev(ev.target.result);
      try {
        const fd = new FormData(); fd.append('avatar', file);
        const {data} = await axios.post(`/chats/${chat._id}/avatar`, fd, {headers:{'Content-Type':'multipart/form-data'}});
        setChat(prev=>({...prev, avatar: data.avatar}));
        onChatUpdated?.({...chat, avatar: data.avatar});
        flash('Аватар обновлён ✓');
      } catch {
        // fallback base64
        try {
          const {data} = await axios.post(`/chats/${chat._id}/avatar`, {avatar: ev.target.result});
          setChat(prev=>({...prev, avatar: data.avatar}));
          onChatUpdated?.({...chat, avatar: data.avatar});
          flash('Аватар обновлён ✓');
        } catch(err) { flash('Ошибка загрузки'); setAvatarPrev(null); }
      }
    };
    reader.readAsDataURL(file);
  };

  // Сохранить изменения
  const saveEdit = async () => {
    setSaving(true);
    try {
      const {data} = await axios.put(`/chats/${chat._id}`, {
        name: editName.trim(), description: editDesc, username: editUser.replace('@','')
      });
      setChat(data);
      onChatUpdated?.(data);
      flash('Сохранено ✓');
      setTab('info');
    } catch(e) { flash(e.response?.data?.message||'Ошибка'); }
    finally { setSaving(false); }
  };

  // Поиск для добавления участников
  const searchAdd = (val) => {
    setAddSearch(val);
    clearTimeout(debRef.current);
    if (!val.trim()) { setAddResults([]); return; }
    debRef.current = setTimeout(async () => {
      try {
        const {data} = await axios.get(`/users/search?q=${encodeURIComponent(val)}`);
        const memberIds = (chat.members||[]).map(m=>(m._id||m).toString());
        setAddResults((data.users||[]).filter(u => !memberIds.includes(u._id.toString())));
      } catch {}
    }, 300);
  };

  const addMember = async (userId) => {
    try {
      const {data} = await axios.post(`/chats/${chat._id}/members`, {userId});
      setChat(data);
      onChatUpdated?.(data);
      setAddSearch(''); setAddResults([]);
      flash('Участник добавлен ✓');
    } catch(e) { flash(e.response?.data?.message||'Ошибка'); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Удалить участника?')) return;
    try {
      await axios.delete(`/chats/${chat._id}/members/${userId}`);
      setChat(prev=>({...prev, members:(prev.members||[]).filter(m=>(m._id||m).toString()!==userId)}));
      onChatUpdated?.({...chat, members:(chat.members||[]).filter(m=>(m._id||m).toString()!==userId)});
      flash('Удалён ✓');
    } catch(e) { flash(e.response?.data?.message||'Ошибка'); }
  };

  const toggleAdmin = async (userId, isAdm) => {
    try {
      const {data} = await axios.post(`/chats/${chat._id}/admins`, {userId, action: isAdm?'remove':'add'});
      setChat(data);
      onChatUpdated?.(data);
      flash(isAdm ? 'Права сняты' : 'Назначен админом ✓');
    } catch(e) { flash(e.response?.data?.message||'Ошибка'); }
  };

  const avatarSrc = avatarPrev || (chat.avatar ? absUrl(chat.avatar) : null);
  const isChannel = chat.type === 'channel';

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={onClose}>
      <div className="glass-strong" style={{width:'100%',maxWidth:480,borderRadius:'22px 22px 0 0',maxHeight:'90vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>

        {/* Шапка */}
        <div style={{padding:'20px 20px 12px',textAlign:'center',position:'relative'}}>
          {/* Аватар */}
          <div style={{position:'relative',display:'inline-block',marginBottom:12}}>
            <div style={{width:84,height:84,borderRadius:'50%',overflow:'hidden',border:'3px solid rgba(124,92,252,.4)',cursor:amAdmin?'pointer':'default'}} onClick={amAdmin?pickAvatar:undefined}>
              {avatarSrc
                ? <img src={avatarSrc} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#7C5CFC,#FC5CA8)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>{isChannel?I.channel:I.members}</div>
              }
            </div>
            {amAdmin && (
              <button onClick={pickAvatar} style={{position:'absolute',bottom:2,right:2,width:26,height:26,borderRadius:'50%',background:'linear-gradient(135deg,#7C5CFC,#FC5CA8)',border:'2px solid #0a0a1a',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
                {I.camera}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onAvatarFile}/>
          </div>

          <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.2rem'}}>{chat.name}</div>
          {chat.username&&<div style={{color:'rgba(240,240,255,.4)',fontSize:'.85rem',marginTop:2}}>@{chat.username}</div>}
          <div style={{color:'rgba(240,240,255,.35)',fontSize:'.8rem',marginTop:3}}>{chat.members?.length||0} {isChannel?'подписчиков':'участников'}</div>
          {msg&&<div style={{marginTop:8,padding:'6px 12px',background:'rgba(74,222,128,.12)',color:'#4ADE80',borderRadius:10,fontSize:'.8rem',display:'inline-block'}}>{msg}</div>}
        </div>

        {/* Табы */}
        <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,.07)',flexShrink:0}}>
          {[['info','Инфо'],...(!isChannel||amAdmin?[['members',isChannel?'Подписчики':'Участники']]:[]),...(amAdmin ? [['edit','Управление']] : [])].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'10px 4px',border:'none',cursor:'pointer',background:'transparent',color:tab===k?'#7C5CFC':'rgba(240,240,255,.35)',fontWeight:tab===k?700:400,fontSize:'.82rem',borderBottom:tab===k?'2px solid #7C5CFC':'2px solid transparent',transition:'all .15s'}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'14px 20px 20px'}}>

          {/* ── ИНФО ── */}
          {tab==='info'&&(
            <>
              {chat.description&&<div style={{padding:'12px 14px',background:'rgba(255,255,255,.05)',borderRadius:12,fontSize:'.875rem',color:'rgba(240,240,255,.5)',marginBottom:12,lineHeight:1.5}}>{chat.description}</div>}
              {chat.inviteLink&&(
                <div style={{padding:'10px 14px',background:'rgba(124,92,252,.1)',borderRadius:12,fontSize:'.82rem',color:'#7C5CFC',cursor:'pointer',marginBottom:12,display:'flex',alignItems:'center',gap:8}}
                  onClick={()=>{navigator.clipboard?.writeText(`https://auragram-telegram-web.hf.space/join/${chat.inviteLink}`);flash('Ссылка скопирована!');}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Скопировать ссылку-приглашение
                </div>
              )}
              {/* Список админов — в каналах скрыт от обычных подписчиков */}
              {(chat.admins||[]).length>0&&(!isChannel||amAdmin)&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:'.68rem',color:'rgba(240,240,255,.3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Администраторы</div>
                  {(chat.admins||[]).map(a=>{
                    const adm = typeof a==='object'?a:{_id:a,nickname:'Admin'};
                    return (
                      <div key={adm._id||a} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0'}}>
                        <Ava u={adm} size={32}/>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:'.82rem',display:'flex',alignItems:'center'}}>
                            {adm.nickname||'Admin'}{adm.isVerified&&<VBadge s={12}/>}
                            {(adm._id||a).toString()===ownerId&&<span style={{marginLeft:4,fontSize:'.65rem',color:'#FFD700',fontWeight:700}}>Владелец</span>}
                          </div>
                        </div>
                        <span style={{fontSize:'.68rem',color:'rgba(124,92,252,.8)',background:'rgba(124,92,252,.1)',padding:'2px 8px',borderRadius:6}}>Админ</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── УЧАСТНИКИ ── */}
          {tab==='members'&&(
            <>
              {/* Поиск для добавления */}
              {amAdmin&&(
                <div style={{marginBottom:12}}>
                  <input value={addSearch} onChange={e=>searchAdd(e.target.value)} placeholder="Добавить участника..." className="input" style={{width:'100%',fontSize:'.875rem'}}/>
                  {addResults.map(u=>(
                    <div key={u._id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.04)',cursor:'pointer'}}
                      onClick={()=>addMember(u._id)}>
                      <Ava u={u} size={34}/>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:'.85rem'}}>{u.nickname}</div>
                        <div style={{fontSize:'.72rem',color:'rgba(240,240,255,.3)'}}>@{u.username}</div>
                      </div>
                      <span style={{color:'#4ADE80',fontSize:'.8rem',fontWeight:600}}>+ Добавить</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Список участников */}
              {(chat.members||[]).map(m=>{
                const mid   = (m._id||m).toString();
                const isOwn = mid === ownerId;
                const isAdm = adminIds.includes(mid);
                const isSelf= mid === myId;
                return (
                  <div key={mid} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                    <div style={{position:'relative',flexShrink:0}}>
                      <Ava u={m} size={38}/>
                      {m.isOnline&&<div style={{position:'absolute',bottom:0,right:0,width:9,height:9,borderRadius:'50%',background:'#4ADE80',border:'2px solid #0a0a1a'}}/>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:'.875rem',display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>
                        {m.nickname||mid}{m.isVerified&&<VBadge s={13}/>}
                        {isOwn&&<span style={{fontSize:'.65rem',color:'#FFD700',fontWeight:700}}>Владелец</span>}
                        {isAdm&&!isOwn&&<span style={{fontSize:'.65rem',color:'#7C5CFC',fontWeight:700}}>Админ</span>}
                        {isSelf&&<span style={{fontSize:'.65rem',color:'rgba(240,240,255,.3)'}}>Вы</span>}
                      </div>
                      <div style={{fontSize:'.72rem',color:'rgba(240,240,255,.3)'}}>@{m.username||'...'}</div>
                    </div>
                    {/* Кнопки управления */}
                    {amOwner && !isSelf && !isOwn &&(
                      <div style={{display:'flex',gap:4,flexShrink:0}}>
                        <button onClick={()=>toggleAdmin(mid, isAdm)} title={isAdm?'Снять права':'Сделать админом'}
                          style={{width:28,height:28,borderRadius:8,border:`1px solid ${isAdm?'rgba(239,68,68,.3)':'rgba(124,92,252,.3)'}`,background:isAdm?'rgba(239,68,68,.1)':'rgba(124,92,252,.1)',color:isAdm?'#f87171':'#7C5CFC',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem'}}>
                          {isAdm?'−':'⚡'}
                        </button>
                        <button onClick={()=>removeMember(mid)} title="Удалить из группы"
                          style={{width:28,height:28,borderRadius:8,border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.08)',color:'#f87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {I.trash}
                        </button>
                      </div>
                    )}
                    {amAdmin && !amOwner && !isSelf && !isOwn && !isAdm &&(
                      <button onClick={()=>removeMember(mid)} title="Удалить из группы"
                        style={{width:28,height:28,borderRadius:8,border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.08)',color:'#f87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {I.trash}
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ── УПРАВЛЕНИЕ ── */}
          {tab==='edit'&&amAdmin&&(
            <>
              <div style={{fontSize:'.68rem',color:'rgba(240,240,255,.35)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Название</div>
              <input value={editName} onChange={e=>setEditName(e.target.value)} className="input" style={{width:'100%',marginBottom:12,fontSize:'.9rem'}}/>
              <div style={{fontSize:'.68rem',color:'rgba(240,240,255,.35)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Описание</div>
              <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} className="input" style={{width:'100%',minHeight:70,resize:'vertical',marginBottom:12,fontSize:'.9rem'}}/>
              {isChannel&&(
                <>
                  <div style={{fontSize:'.68rem',color:'rgba(240,240,255,.35)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Username канала</div>
                  <div style={{position:'relative',marginBottom:16}}>
                    <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'rgba(240,240,255,.3)',fontSize:'.9rem',pointerEvents:'none'}}>@</span>
                    <input value={editUser} onChange={e=>setEditUser(e.target.value.replace('@',''))} className="input" style={{width:'100%',paddingLeft:26,fontSize:'.9rem'}}/>
                  </div>
                </>
              )}
              <button onClick={saveEdit} disabled={saving} style={{width:'100%',padding:'12px',borderRadius:13,border:'none',background:'linear-gradient(135deg,#7C5CFC,#9B7CFF)',color:'#fff',fontWeight:700,cursor:saving?'not-allowed':'pointer',opacity:saving?.7:1,fontFamily:'Syne,sans-serif',marginBottom:12}}>
                {saving?'Сохранение...':'Сохранить изменения'}
              </button>
            </>
          )}
        </div>

        {/* Кнопки снизу */}
        <div style={{padding:'8px 20px 24px',borderTop:'1px solid rgba(255,255,255,.07)',display:'flex',gap:8,flexShrink:0}}>
          <button onClick={onLeave} style={{flex:1,padding:'11px',borderRadius:13,border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.08)',color:'#f87171',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:'.875rem'}}>
            {I.leave} Покинуть
          </button>
          <button onClick={onClose} style={{flex:1,padding:'11px',borderRadius:13,border:'1px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(240,240,255,.4)',cursor:'pointer',fontSize:'.875rem'}}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

/* ── Звонок ── */
function CallScreen({ peer, isVideo, local, remote, onEnd, muted, onMute, camOff, onCam, sharing, onScreen, callStatus }) {
  const rvRef = React.useRef(null);
  const lvRef = React.useRef(null);

  React.useEffect(() => {
    if (rvRef.current && remote) {
      rvRef.current.srcObject = remote;
      rvRef.current.muted = false;
      rvRef.current.volume = 1;
      rvRef.current.play().catch(() => {
        const f = () => rvRef.current?.play().catch(()=>{});
        document.addEventListener('click', f, {once:true});
        document.addEventListener('touchstart', f, {once:true});
      });
    }
  }, [remote]);

  React.useEffect(() => {
    if (lvRef.current && local) {
      lvRef.current.srcObject = local;
      lvRef.current.play().catch(()=>{});
    }
  }, [local]);

  const connected = !!remote;

  return (
    <div className="call-appear" style={{position:'fixed',inset:0,zIndex:500,display:'flex',flexDirection:'column',
      background:isVideo?'#000':'linear-gradient(160deg,#0d0520 0%,#050510 50%,#07071a 100%)'}}>

      {isVideo ? (
        <div style={{flex:1,position:'relative',background:'#111'}}>
          <video ref={rvRef} autoPlay playsInline
            style={{width:'100%',height:'100%',objectFit:'cover',display:remote?'block':'none'}}/>
          {!remote && (
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:16,
              background:'linear-gradient(160deg,#0d0520,#050510)'}}>
              <Ava u={peer} size={90}/>
              <div style={{color:'rgba(255,255,255,.8)',fontSize:'.95rem'}}>{callStatus||'Вызов...'}</div>
            </div>
          )}
          {local && (
            <video ref={lvRef} autoPlay playsInline muted
              style={{position:'absolute',bottom:16,right:16,width:90,height:128,
                objectFit:'cover',borderRadius:12,border:'2px solid rgba(255,255,255,.3)',zIndex:2}}/>
          )}
          <div style={{position:'absolute',top:16,left:0,right:0,textAlign:'center',zIndex:3}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:'1.05rem',fontFamily:'Syne,sans-serif',
              textShadow:'0 1px 8px rgba(0,0,0,.9)'}}>{peer?.nickname}</div>
            <div style={{color:connected?'#4ADE80':'rgba(255,255,255,.6)',fontSize:'.85rem',marginTop:3,
              textShadow:'0 1px 4px rgba(0,0,0,.8)'}}>{callStatus||(connected?'Соединено':'Вызов...')}</div>
          </div>
        </div>
      ) : (
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
          justifyContent:'center',gap:22}}>
          <audio ref={rvRef} autoPlay playsInline style={{position:'absolute',opacity:0,width:1,height:1}}/>
          <div style={{position:'relative'}}>
            {connected && <>
              <div style={{position:'absolute',inset:-18,borderRadius:'50%',
                border:'2px solid rgba(74,222,128,.3)',animation:'pr 2s ease infinite'}}/>
              <div style={{position:'absolute',inset:-36,borderRadius:'50%',
                border:'2px solid rgba(74,222,128,.15)',animation:'pr 2s .4s ease infinite'}}/>
            </>}
            <Ava u={peer} size={110}/>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'1.5rem',fontWeight:800,color:'#fff',marginBottom:6}}>
              {peer?.nickname}
            </div>
            <div style={{color:connected?'#4ADE80':'rgba(240,240,255,.5)',fontSize:'.95rem'}}>
              {callStatus||(connected?'Соединено':'Вызов...')}
            </div>
          </div>
          {connected && <CallTimer/>}
        </div>
      )}

      <div style={{padding:'20px 0 42px',display:'flex',justifyContent:'center',
        alignItems:'center',gap:18,
        background:'linear-gradient(to top,rgba(0,0,0,.85) 0%,transparent 100%)',
        backdropFilter:'blur(16px)'}}>
        <Btn46 onClick={onMute} active={muted}>{I.mute}</Btn46>
        {isVideo && <Btn46 onClick={onCam} active={camOff}>{I.video}</Btn46>}
        {isVideo && <Btn46 onClick={onScreen} active={sharing}>{I.screen}</Btn46>}
        <button onClick={onEnd}
          style={{width:62,height:62,borderRadius:'50%',border:'none',cursor:'pointer',
            background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'#fff',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 4px 24px rgba(239,68,68,.55)'}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" transform="rotate(135,12,12)"/>
          </svg>
        </button>
      </div>
      <style>{`@keyframes pr{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.45);opacity:0}}`}</style>
    </div>
  );
}

function CallTimer() {
  const [sec, setSec] = React.useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec(s=>s+1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = String(Math.floor(sec/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  return <div style={{color:'rgba(255,255,255,.5)',fontSize:'.875rem'}}>{m}:{s}</div>;
}

// ── Галочки статуса сообщения ──
function MsgTicks({ msg, myId }) {
  if (!myId || msg.sender?._id?.toString() !== myId?.toString()) return null;
  const isRead = msg.readBy?.some(id => id.toString() !== myId?.toString());
  return (
    <span style={{display:'inline-flex',alignItems:'center',marginLeft:3,flexShrink:0}}>
      {isRead ? (
        // ✓✓ синие — прочитано
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <path d="M1 5l3 3L11 1" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 5l3 3L16 1" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        // ✓ серая — доставлено
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3L9 1" stroke="rgba(240,240,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </span>
  );
}

function Btn46({ onClick, active, children }) {
  return <button onClick={onClick} style={{width:46,height:46,borderRadius:'50%',border:'none',cursor:'pointer',background:active?'rgba(239,68,68,.2)':'rgba(255,255,255,.1)',color:active?'#f87171':'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{children}</button>;
}

function IncomingCall({ caller, isVideo, onAccept, onReject }) {
  return (
    <div className="incoming-appear" style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:500,width:'min(calc(100%-32px),380px)'}}>
      <div className="glass-strong" style={{borderRadius:18,padding:'12px 16px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 8px 40px rgba(0,0,0,.6)'}}>
        <Ava u={{nickname:caller.callerName,avatar:caller.callerAvatar}} size={46}/>
        <div style={{flex:1}}><div style={{fontWeight:700}}>{caller.callerName}</div><div style={{fontSize:'.78rem',color:'rgba(240,240,255,.4)'}}>{isVideo?'Видеовызов':'Голосовой звонок'}</div></div>
        <button onClick={onReject} style={{width:42,height:42,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(239,68,68,.18)',color:'#f87171',display:'flex',alignItems:'center',justifyContent:'center'}}>{I.close}</button>
        <button onClick={onAccept} style={{width:42,height:42,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(74,222,128,.18)',color:'#4ADE80',display:'flex',alignItems:'center',justifyContent:'center'}}>{I.phone}</button>
      </div>
    </div>
  );
}

/* ── Сообщение ── */
function Msg({ msg, isMine, onReact, onReply, onDelete, onEdit, chatType, isUserAdmin }) {
  const [ctx,setCtx]=useState(null);
  const lt=useRef();
  const t = msg.createdAt ? format(new Date(msg.createdAt),'HH:mm') : '';
  const open=(x,y)=>setCtx({x:Math.min(Math.max(x,6),window.innerWidth-220),y:Math.min(Math.max(y,6),window.innerHeight-270)});

  const body=()=>{
    if(msg.isDeleted) return <span style={{color:'rgba(255,255,255,.28)',fontStyle:'italic',fontSize:'.85rem'}}>Сообщение удалено</span>;
    switch(msg.type){
      case 'image': return msg.fileUrl ? <img src={absUrl(msg.fileUrl)} alt="" style={{maxWidth:'100%',borderRadius:10,display:'block',cursor:'pointer',maxHeight:280}} onClick={()=>window.open(absUrl(msg.fileUrl),'_blank')}/> : <span style={{color:'rgba(255,255,255,.4)',fontSize:'.85rem'}}>Фото недоступно</span>;
      case 'video': return msg.fileUrl ? (
        <div className="video-appear">
          <video src={absUrl(msg.fileUrl)} controls playsInline style={{maxWidth:'100%',borderRadius:10,display:'block',maxHeight:260,background:'#000'}}/>
          <a href={absUrl(msg.fileUrl)} download={msg.fileName||'video'} target="_blank" rel="noreferrer"
            style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:5,color:'rgba(240,240,255,.45)',fontSize:'.75rem',textDecoration:'none'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Скачать видео
          </a>
        </div>
      ) : <span style={{color:'rgba(255,255,255,.4)',fontSize:'.85rem'}}>Видео недоступно</span>;
      case 'voice': return <VoiceMsg url={absUrl(msg.fileUrl)} fileName={msg.fileName}/>;
      case 'system': return null;
      case 'file':  return (
        <a href={absUrl(msg.fileUrl)} download={msg.fileName} target="_blank" rel="noreferrer"
          style={{color:'#7C5CFC',display:'flex',gap:8,alignItems:'center',textDecoration:'none',
            background:'rgba(124,92,252,.08)',border:'1px solid rgba(124,92,252,.2)',
            borderRadius:12,padding:'10px 14px',minWidth:180}}>
          <span style={{display:'inline-flex',opacity:.7}}>{I.file}</span>
          <div><div style={{fontWeight:600,fontSize:'.875rem'}}>{msg.fileName||'Файл'}</div>{msg.fileSize&&<div style={{fontSize:'.7rem',color:'rgba(255,255,255,.3)'}}>{(msg.fileSize/1024).toFixed(0)} KB</div>}</div>
        </a>
      );
      case 'geo': return (
        <div style={{borderRadius:10,overflow:'hidden',maxWidth:260}}>
          <iframe src={`https://maps.google.com/maps?q=${msg.geo?.lat},${msg.geo?.lng}&z=15&output=embed`} width="260" height="145" style={{border:'none',display:'block'}} title="map"/>
          <a href={`https://www.google.com/maps?q=${msg.geo?.lat},${msg.geo?.lng}`} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',background:'rgba(0,0,0,.4)',color:'#7C5CFC',fontSize:'.78rem',textDecoration:'none'}}>{I.geo} Открыть в картах</a>
        </div>
      );
      default: return <span style={{wordBreak:'break-word',lineHeight:1.55,whiteSpace:'pre-wrap'}}>{msg.content}</span>;
    }
  };

  return (
    <>
      {msg.type==='system' ? (
        <div style={{display:'flex',justifyContent:'center',margin:'6px 10px'}}>
          <div style={{background:'rgba(124,92,252,.13)',border:'1px solid rgba(124,92,252,.18)',borderRadius:14,padding:'3px 14px',fontSize:'.72rem',color:'rgba(240,240,255,.45)',userSelect:'none'}}>
            {msg.content}
          </div>
        </div>
      ) : (
      <div className="msg-appear" style={{display:'flex',flexDirection:'column',alignItems:isMine?'flex-end':'flex-start',marginBottom:1,padding:'1px 10px'}}
        onContextMenu={e=>{e.preventDefault();open(e.clientX,e.clientY);}}
        onTouchStart={e=>{const t2=e.touches[0];lt.current=setTimeout(()=>open(t2.clientX,t2.clientY),500);}}
        onTouchEnd={()=>clearTimeout(lt.current)} onTouchMove={()=>clearTimeout(lt.current)}>
        {!isMine&&msg.sender&&(
          <div style={{fontSize:'.7rem',color:msg.sender.nameColor||'#7C5CFC',fontWeight:700,marginBottom:2,paddingLeft:2,display:'flex',alignItems:'center'}}>
            {msg.sender.nickname}{msg.sender.isVerified&&<VBadge s={12}/>}{msg.sender.isPremium&&<span style={{marginLeft:3,display:'inline-flex'}}>{I.star}</span>}
          </div>
        )}
        {msg.replyTo&&(
          <div style={{background:isMine?'rgba(124,92,252,.18)':'rgba(255,255,255,.05)',borderLeft:'3px solid #7C5CFC',borderRadius:6,padding:'3px 8px',marginBottom:3,fontSize:'.75rem',color:'rgba(240,240,255,.4)',maxWidth:'75%'}}>
            <div style={{color:'#7C5CFC',fontWeight:600,fontSize:'.68rem',marginBottom:1}}>{msg.replyTo.sender?.nickname}</div>
            <div style={{display:'flex',alignItems:'center',gap:5,color:'rgba(240,240,255,.45)'}}>
              {msg.replyTo.type==='voice' ? <><span style={{display:'inline-flex',opacity:.75}}>{I.mic}</span> Голосовое</> :
               msg.replyTo.type==='video' ? <><span style={{display:'inline-flex',opacity:.75}}>{I.video}</span> Видео</> :
               msg.replyTo.type==='file'  ? <><span style={{display:'inline-flex',opacity:.75}}>{I.file}</span> {msg.replyTo.fileName||'Файл'}</> :
               msg.replyTo.type==='geo'   ? <><span style={{display:'inline-flex',opacity:.75}}>{I.geo}</span> Геопозиция</> :
               msg.replyTo.type==='image' ? <><span style={{display:'inline-flex',opacity:.75}}>{I.photo}</span> Фото</> :
               msg.replyTo.content?.slice(0,50)}
            </div>
          </div>
        )}
        <div className={`bubble ${isMine?'sent':'recv'}`} style={{maxWidth:'min(78%,340px)',padding:['geo','image','video'].includes(msg.type)?'4px':undefined}}>
          {body()}
          {!msg.isDeleted&&msg.type!=='sticker'&&(
            <div style={{display:'flex',alignItems:'center',gap:3,justifyContent:'flex-end',marginTop:['geo'].includes(msg.type)?0:2}}>
              {msg.editedAt&&<span style={{fontSize:'.6rem',color:'rgba(255,255,255,.28)'}}>изм.</span>}
              <span style={{fontSize:'.65rem',color:'rgba(255,255,255,.35)'}}>{t}</span>
              {isMine&&<span style={{color:'rgba(124,92,252,.8)',display:'inline-flex'}}>{I.check}</span>}
            </div>
          )}
        </div>
        {msg.reactions?.filter(r=>r.users?.length>0).length>0&&(
          <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:3}}>
            {msg.reactions.filter(r=>r.users?.length>0).map(r=>(
              <span key={r.emoji} className="reaction-pill" onClick={()=>onReact(msg._id,r.emoji)}>
                {r.emoji}{r.users.length>1&&<span style={{fontSize:'.68rem',marginLeft:2}}>{r.users.length}</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {ctx&&(
        <div style={{position:'fixed',inset:0,zIndex:200}} onClick={()=>setCtx(null)}>
          <div className="glass ctx-menu" style={{position:'absolute',top:ctx.y,left:ctx.x,minWidth:200,zIndex:201}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',gap:5,padding:'8px 10px 10px',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
              {REACTIONS.map(e=>(
                <span key={e} style={{fontSize:'1.3rem',cursor:'pointer',display:'inline-block',transition:'.15s'}}
                  onMouseEnter={ev=>ev.currentTarget.style.transform='scale(1.4)'}
                  onMouseLeave={ev=>ev.currentTarget.style.transform='none'}
                  onClick={()=>{onReact(msg._id,e);setCtx(null);}}>{e}</span>
              ))}
            </div>
            <div className="ctx-item" onClick={()=>{onReply(msg);setCtx(null);}}><span style={{display:'inline-flex',marginRight:8,opacity:.7}}>{I.reply}</span>Ответить</div>
            {(!msg.type||msg.type==='text')&&<div className="ctx-item" onClick={()=>{navigator.clipboard?.writeText(msg.content);setCtx(null);}}><span style={{display:'inline-flex',marginRight:8,opacity:.7}}>{I.copy}</span>Копировать</div>}
            {isMine&&(!msg.type||msg.type==='text')&&<div className="ctx-item" onClick={()=>{onEdit(msg);setCtx(null);}}><span style={{display:'inline-flex',marginRight:8,opacity:.7}}>{I.edit2}</span>Изменить</div>}
            <div style={{height:1,background:'rgba(255,255,255,.07)',margin:'4px 0'}}/>
            {/* Удалить для всех: для каналов — только админам; для групп — автор или админ */}
            {(isMine||isUserAdmin)&&chatType!=='channel'&&<div className="ctx-item danger" onClick={()=>{onDelete(msg._id,true);setCtx(null);}}><span style={{display:'inline-flex',marginRight:8}}>{I.trash}</span>Удалить для всех</div>}
            {isUserAdmin&&chatType==='channel'&&<div className="ctx-item danger" onClick={()=>{onDelete(msg._id,true);setCtx(null);}}><span style={{display:'inline-flex',marginRight:8}}>{I.trash}</span>Удалить для всех</div>}
            {/* Удалить у себя: запрещено в каналах для не-админов */}
            {(chatType!=='channel'||isUserAdmin)&&<div className="ctx-item danger" onClick={()=>{onDelete(msg._id,false);setCtx(null);}}><span style={{display:'inline-flex',marginRight:8}}>{I.trash}</span>Удалить у меня</div>}
          </div>
        </div>
      )}
      )}
    </>
  );
}

/* ════════════════════════════════════════════
   ГЛАВНЫЙ КОМПОНЕНТ
════════════════════════════════════════════ */
export default function ChatWindow({ chat, onBack, onDeleteChat }) {
  const { user } = useAuth();
  const { socket } = useSocket() || {};
  const [msgs, setMsgs]             = useState([]);
  const [input, setInput]           = useState('');
  const [replyTo, setReplyTo]       = useState(null);
  const [editMsg, setEditMsg]       = useState(null);
  const [typing, setTyping]         = useState([]);
  const [otherUser, setOtherUser]   = useState(null);
  const [isOnline, setIsOnline]     = useState(false);
  const [isBlocked, setIsBlocked]   = useState(false);
  const [inContacts, setInContacts] = useState(false);
  const [localName, setLocalName]   = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [showUserSheet, setShowUserSheet]   = useState(false);
  const [showGroupSheet, setShowGroupSheet] = useState(false);
  const [chatData, setChatData] = useState(chat);
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem('wallpaper_' + chat?._id) || '');
  const [uploading, setUploading]   = useState(false);
  // WebRTC
  const [callScreen, setCallScreen] = useState(null);
  const [incoming, setIncoming]     = useState(null);
  const [localStream, setLocalStream]   = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState]       = useState('calling'); // calling|ringing|unavailable|failed|connected
  const [muted, setMuted]     = useState(false);
  const [camOff, setCamOff]   = useState(false);
  const [sharing, setSharing] = useState(false);
  const sharingRef = useRef(false);
  const screenStreamRef = useRef(null);
  const pcRef       = useRef(null);
  // Отслеживание параметров звонка для системных сообщений
  const callDirectionRef  = useRef('outgoing'); // 'outgoing' | 'incoming'
  const callConnectedRef  = useRef(false);
  const callStartTimeRef  = useRef(null);
  // Voice
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime]     = useState(0);
  const mrRef    = useRef(null);
  const rtRef    = useRef(null);
  const chunks   = useRef([]);

  const bottomRef    = useRef(null);
  const wallpaperRef = useRef(null);
  const myIdStr    = (user?.id || user?._id)?.toString();
  const inputRef   = useRef(null);
  const typingRef  = useRef(null);
  const [mentionList, setMentionList] = useState([]);  // список для @mention
  const [mentionIdx,  setMentionIdx]  = useState(0);
  const sending    = useRef(false);
  const [sendAnim, setSendAnim] = useState(false);
  const isMobile   = window.innerWidth < 768;
  const myId       = user?.id || user?._id;
  const isAdmin    = user?.username === 'zxcswatme';
  // В канале писать могут только админы и владелец
  const chatAdminIds = (chatData?.admins||chat?.admins||[]).map(a=>(a._id||a).toString());
  const chatOwnerId  = (chatData?.owner?._id||chatData?.owner||chat?.owner?._id||chat?.owner||'').toString();
  const canWrite     = chat.type !== 'channel' || chatAdminIds.includes(myId?.toString()) || chatOwnerId === myId?.toString();
  const amChatAdmin  = chatAdminIds.includes(myId?.toString()) || chatOwnerId === myId?.toString();
  const isPulseBot   = chat.type === 'private' && (chat.members||[]).some(m => (m.username||m) === 'pulse');
  const canSend      = canWrite && !isPulseBot;

  // Загрузка чата
  useEffect(() => {
    if (!chat?._id) return;
    setMsgs([]); setInput(''); setReplyTo(null); setEditMsg(null);
    setShowUserSheet(false); setShowGroupSheet(false); setChatData(chat);
    loadMsgs();
    if (chat.type === 'private') {
      const o = chat.members?.find(m => {
        const mid = (m._id||m)?.toString();
        return mid !== myId?.toString() && mid !== user?._id?.toString();
      });
      setOtherUser(o || null);
      setIsOnline(o?.isOnline || false);
      setLocalName(o?.localName || null);
      // Загружаем актуальный статус контакта с сервера
      if (o?._id) {
        axios.get(`/users/${o.username}`).then(r => {
          setInContacts(r.data?.inContacts || false);
          setLocalName(r.data?.localName || null);
        }).catch(() => setInContacts(o?.inContacts || false));
      }
      setIsBlocked(false);
    } else {
      setOtherUser(null); setIsOnline(false);
    }
    socket?.emit('chat:join', chat._id);
    return () => socket?.emit('chat:leave', chat._id);
  }, [chat?._id]);

  // Sockets
  useEffect(() => {
    if (!socket || !chat?._id) return;
    const cid = chat._id;

    const onMsg = (msg) => {
      const msgCid = msg.chat || msg.chatId;
      if (msgCid?.toString() !== cid?.toString()) return;
      setMsgs(prev => prev.some(m=>m._id===msg._id) ? prev : [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({behavior:'smooth'}), 60);
      soundManager.receive();
      markRead();
      if (document.hidden && Notification.permission==='granted')
        new Notification(msg.sender?.nickname||'Сообщение',{body:msg.content||'📎',icon:'/favicon.ico'});
    };
    const onEdited = (msg) => {
      if (msg.chat?.toString() !== cid.toString()) return;
      setMsgs(prev => prev.map(m => m._id===msg._id ? msg : m));
    };
    const onReacted = (msg) => {
      if (msg.chat?.toString() !== cid.toString()) return;
      setMsgs(prev => prev.map(m => m._id===msg._id ? msg : m));
    };
    const onDel = ({messageId}) => setMsgs(prev=>prev.map(m=>m._id===messageId?{...m,isDeleted:true,content:''}:m));
    const onTStart = ({userId,nickname,chatId}) => {
      if (chatId!==cid) return;
      if (userId===myId?.toString()) return;
      setTyping(prev=>[...new Set([...prev, nickname||'Кто-то'])]);
    };
    const onTStop = ({userId,chatId}) => {
      if (chatId!==cid) return;
      const o = chat.members?.find(m=>(m._id||m).toString()===userId);
      if (o) setTyping(prev=>prev.filter(n=>n!==(o.nickname||'Кто-то')));
    };
    const onStatus = ({userId,isOnline:on}) => {
      if (otherUser && (otherUser._id||otherUser).toString()===userId) setIsOnline(on);
    };
    const onIncoming  = d => { setIncoming(d); soundManager.startRingtone(); };
    const onRinging   = () => { setCallState('ringing'); };
    const onAnswered = async ({ answer }) => {
      try {
        if (!pcRef.current) return;
        console.log('[WebRTC] Got answer, setting remote description');
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setCallState('connected');
        callConnectedRef.current = true;
        callStartTimeRef.current = Date.now();
        console.log('[WebRTC] Remote description set from answer');
      } catch(e) { console.error('[WebRTC] Error setting answer:', e); }
    };
    const onIce = async ({ candidate }) => {
      try {
        if (!pcRef.current || !candidate) return;
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[WebRTC] ICE candidate added');
      } catch(e) { console.error('[WebRTC] Error adding ICE candidate:', e); }
    };
    const onForceOut  = () => { endCallRef.current?.(); };

    socket.on('message:new', onMsg);
    socket.on('message:edited', onEdited);
    socket.on('message:reacted', onReacted);
    // Обновление данных чата (аватар, участники, название)
    const onChatUpd = (upd) => { if ((upd._id||upd)===chat?._id) setChatData(prev=>({...prev,...upd})); };
    // Обновляем readBy в сообщениях
    const onMsgsRead = ({ chatId, userId }) => {
      if (chatId !== chat?._id?.toString()) return;
      setMsgs(prev => prev.map(m =>
        m.sender?._id?.toString() === myIdStr && !m.readBy?.includes(userId)
          ? { ...m, readBy: [...(m.readBy||[]), userId] }
          : m
      ));
    };
    socket.on('messages:read', onMsgsRead);
    socket.on('chat:updated', onChatUpd);
    const onRemoved = ({chatId}) => { if (chatId===chat?._id) { setChatData(null); } };
    socket.on('chat:removed', onRemoved);
    socket.on('message:deleted', onDel);
    socket.on('typing:start', onTStart);
    socket.on('typing:stop', onTStop);
    socket.on('user:status', onStatus);
    socket.on('call:incoming', onIncoming);
    socket.on('call:ringing', onRinging);
    socket.on('call:answered', onAnswered);
    socket.on('call:ice', onIce);
    socket.on('call:unavailable', () => setCallState('failed'));
    socket.on('call:rejected', () => endCallRef.current?.());
    socket.on('call:ended', () => endCallRef.current?.());
    socket.on('force:logout', onForceOut);

    return () => {
      ['message:new','message:edited','message:reacted','message:deleted','chat:updated','chat:removed','messages:read',
       'typing:start','typing:stop','user:status',
       'call:incoming','call:ringing','call:unavailable','call:answered','call:ice','call:rejected','call:ended','force:logout']
        .forEach(e => socket.off(e));
    };
  }, [socket, chat?._id, otherUser, myId]);

  const markRead = () => {
    if (!chat?._id || !socketRef.current) return;
    socketRef.current.emit('messages:read', { chatId: chat._id.toString() });
  };

  const loadMsgs = async () => {
    try {
      const {data} = await axios.get(`/messages/${chat._id}`);
      setMsgs(data);
    setTimeout(markRead, 300);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
    } catch {}
  };

  const sendMsg = useCallback(async (type='text', extra={}) => {
    if (sending.current) return;
    const content = input.trim();
    if (!content && type==='text') return;
    sending.current = true;
    try {
      if (editMsg) {
        const {data} = await axios.put(`/messages/${editMsg._id}/edit`, {content});
        setMsgs(prev => prev.map(m => m._id===editMsg._id ? data : m));
        setEditMsg(null); setInput('');
        socket?.emit('message:edit', { chatId: chat._id, message: data });
        soundManager.send();
        return;
      }
      const body = { content: content || extra.fileName || '', type, ...extra };
      if (replyTo) body.replyTo = replyTo._id;
      const {data} = await axios.post(`/messages/${chat._id}`, body);
      setMsgs(prev => prev.some(m=>m._id===data._id) ? prev : [...prev, data]);
      setInput(''); setReplyTo(null);
      setSendAnim(true); setTimeout(() => setSendAnim(false), 230);
      soundManager.send();
      setTimeout(() => bottomRef.current?.scrollIntoView({behavior:'smooth'}), 60);
    } catch(e) { alert(e.response?.data?.message || 'Ошибка отправки'); }
    finally { sending.current = false; }
  }, [input, editMsg, replyTo, chat?._id, socket]);

  const uploadFile = async (file, typeHint) => {
    setUploading(true);
    // Определяем тип по mime
    const mime = file.type || '';
    const type = mime.startsWith('image/') ? 'image'
                : mime.startsWith('video/') ? 'video'
                : mime.startsWith('audio/') ? 'voice'
                : typeHint || 'file';
    try {
      const fd = new FormData(); fd.append('file', file);
      const {data} = await axios.post('/messages/upload', fd, {
        headers:{'Content-Type':'multipart/form-data'},
        timeout: 120000, // 2 мин для больших файлов
      });
      await sendMsg(type, {fileUrl: data.url, fileName: file.name, fileSize: file.size});
    } catch(err) {
      // Fallback base64 только для изображений (видео слишком большие)
      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = async ev => await sendMsg(type, {fileUrl: ev.target.result, fileName: file.name, fileSize: file.size});
        reader.readAsDataURL(file);
      } else {
        alert('Ошибка загрузки: ' + (err.response?.data?.message || err.message));
      }
    } finally { setUploading(false); }
  };

  const pickFile = (accept, type) => {
    const inp = document.createElement('input'); inp.type='file'; inp.accept=accept;
    inp.onchange = e => { const f=e.target.files?.[0]; if(f) uploadFile(f,type); };
    inp.click(); setShowAttach(false);
  };

  const sendGeo = () => {
    setShowAttach(false);
    navigator.geolocation?.getCurrentPosition(async pos => {
      const {latitude:lat,longitude:lng} = pos.coords;
      let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try { const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`); const d=await r.json(); address=d.display_name?.split(',').slice(0,3).join(',').trim(); } catch {}
      await sendMsg('geo', {geo:{lat,lng,address}, content:address});
    }, () => alert('Нет доступа к геолокации'));
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const mr = new MediaRecorder(stream); chunks.current=[];
      mr.ondataavailable = e => chunks.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks.current,{type:'audio/webm'});
        await uploadFile(new File([blob],`voice_${Date.now()}.webm`,{type:'audio/webm'}),'voice');
        stream.getTracks().forEach(t=>t.stop());
      };
      mr.start(); mrRef.current=mr; setRecording(true); setRecTime(0);
      rtRef.current = setInterval(()=>setRecTime(v=>v+1),1000);
    } catch { alert('Разрешите доступ к микрофону'); }
  };
  const stopRec = () => { mrRef.current?.stop(); clearInterval(rtRef.current); setRecording(false); };

  // WebRTC
  // Refs для WebRTC чтобы избежать stale closure
  const otherUserRef = useRef(null);
  const socketRef    = useRef(null);
  const endCallRef   = useRef(null);
  useEffect(() => { otherUserRef.current = otherUser; }, [otherUser]);
  useEffect(() => { socketRef.current = socket; },       [socket]);

  const remoteTracksRef = useRef([]);

  const makePC = () => {
    const pc = new RTCPeerConnection(ICE_CFG);

    // ICE кандидаты — используем refs (не closure) чтобы не потерять актуальные значения
    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const ou = otherUserRef.current;
      const sk = socketRef.current;
      if (ou && sk) {
        sk.emit('call:ice', { targetId: (ou._id || ou).toString(), candidate: e.candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
    };

    // ontrack — строим MediaStream из треков вручную
    remoteTracksRef.current = [];
    pc.ontrack = (e) => {
      console.log('[WebRTC] ontrack:', e.track.kind);
      remoteTracksRef.current.push(e.track);
      const ms = new MediaStream(remoteTracksRef.current);
      setRemoteStream(ms);
    };

    pcRef.current = pc;
    return pc;
  };
  const startCall = async (isVideo=false) => {
    if (!otherUser) return;
    try {
      callDirectionRef.current = 'outgoing';
      callConnectedRef.current = false;
      callStartTimeRef.current = null;
      const constraints = { audio: true, video: isVideo ? { width:640, height:480 } : false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[WebRTC] Got local stream, tracks:', stream.getTracks().map(t=>t.kind));
      setLocalStream(stream);
      const pc = makePC();
      stream.getTracks().forEach(t => {
        pc.addTrack(t, stream);
        console.log('[WebRTC] Added track:', t.kind);
      });
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: isVideo });
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] Offer created, sending...');
      socketRef.current?.emit('call:offer', {
        targetId: (otherUser._id||otherUser).toString(),
        offer: pc.localDescription,
        isVideo,
      });
      setCallState('calling');
      setCallScreen({ isVideo });
    } catch(e) { alert('Ошибка звонка: ' + e.message); }
  };
  const acceptCall = async () => {
    soundManager.stopRingtone();
    if (!incoming) return;
    callDirectionRef.current = 'incoming';
    callConnectedRef.current = false;
    callStartTimeRef.current = null;
    const inc = incoming;
    setIncoming(null);
    try {
      const constraints = { audio: true, video: inc.isVideo ? { width:640, height:480 } : false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[WebRTC] Accept: got local stream, tracks:', stream.getTracks().map(t=>t.kind));
      setLocalStream(stream);
      const pc = makePC();
      // Сначала добавляем треки
      stream.getTracks().forEach(t => {
        pc.addTrack(t, stream);
        console.log('[WebRTC] Accept: added track:', t.kind);
      });
      // Потом устанавливаем remote description
      await pc.setRemoteDescription(new RTCSessionDescription(inc.offer));
      console.log('[WebRTC] Accept: remote description set');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[WebRTC] Accept: answer created, sending...');
      socketRef.current?.emit('call:answer', {
        targetId: inc.callerId,
        answer: pc.localDescription,
      });
      setCallScreen({ isVideo: inc.isVideo });
    } catch(e) { alert('Ошибка при ответе: ' + e.message); }
  };
  async function endCall() {
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    remoteTracksRef.current = [];
    localStream?.getTracks().forEach(t => { try { t.stop(); } catch {} });
    screenStreamRef.current?.getTracks().forEach(t => { try { t.stop(); } catch {} });
    screenStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallScreen(null);
    setIncoming(null);
    setCallState('calling');
    setMuted(false);
    setCamOff(false);
    sharingRef.current = false; setSharing(false);
    const ou = otherUserRef.current;
    const sk = socketRef.current;
    if (ou && sk) sk.emit('call:end', { targetId: (ou._id || ou).toString() });
    // Системное сообщение о звонке
    const chatId = chat?._id;
    if (chatId) {
      const dir = callDirectionRef.current;
      const connected = callConnectedRef.current;
      const durSec = connected && callStartTimeRef.current ? Math.round((Date.now()-callStartTimeRef.current)/1000) : 0;
      const durStr = durSec>0 ? ` (${Math.floor(durSec/60)}:${String(durSec%60).padStart(2,'0')})` : '';
      let content;
      if (!connected) {
        content = dir==='outgoing' ? '📵 Не удалось подключиться' : '📵 Пропущенный вызов';
      } else {
        content = dir==='outgoing' ? `📞 Исходящий вызов${durStr}` : `📞 Входящий вызов${durStr}`;
      }
      callDirectionRef.current = 'outgoing';
      callConnectedRef.current = false;
      callStartTimeRef.current = null;
      try {
        const { data } = await axios.post(`/messages/${chatId}`, { content, type: 'system' });
        setMsgs(prev => prev.some(m=>m._id===data._id) ? prev : [...prev, data]);
        setTimeout(() => bottomRef.current?.scrollIntoView({behavior:'smooth'}), 60);
      } catch {}
    }
  }
  endCallRef.current = endCall;

  async function toggleScreenShare() {
    if (sharingRef.current) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      sharingRef.current = false; setSharing(false);
      // Restore camera track if video call
      if (callScreen?.isVideo && localStream) {
        const camTrack = localStream.getVideoTracks()[0];
        if (camTrack && pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack);
        }
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        }
        screenTrack.onended = () => { sharingRef.current = false; setSharing(false); screenStreamRef.current = null; };
        sharingRef.current = true; setSharing(true);
      } catch (e) {
        console.warn('[ScreenShare] cancelled or failed', e);
      }
    }
  }

  const toggleBlock = async () => {
    if (!otherUser) return;
    try { const {data}=await axios.post(`/users/me/blacklist/${otherUser._id||otherUser}`); setIsBlocked(data.blocked); }
    catch(e){ alert(e.response?.data?.message||'Ошибка'); }
  };
  const freezeUser = async () => {
    if (!otherUser) return;
    try { const {data}=await axios.post(`/users/admin/freeze/${otherUser._id||otherUser}`); alert((data.isFrozen?'🧊 Заморожен: ':'✅ Разморожен: ')+data.nickname); }
    catch(e){ alert(e.response?.data?.message||'Нет прав'); }
  };
  const toggleContact = async () => {
    if (!otherUser) return;
    try { const {data}=await axios.post(`/users/contacts/${otherUser._id||otherUser}`); setInContacts(data.inContacts); }
    catch(e){ alert(e.response?.data?.message||'Ошибка'); }
  };
  const saveLocalName = async (name) => {
    if (!otherUser) return;
    try { const {data}=await axios.put(`/users/contacts/${otherUser._id||otherUser}/localname`,{name}); setLocalName(data.localName); }
    catch(e){ alert(e.response?.data?.message||'Ошибка'); }
  };
  const deleteChat = async () => {
    if (!window.confirm('Удалить чат?')) return;
    try { await axios.delete(`/chats/${chat._id}`); onDeleteChat?.(chat._id); } catch(e){alert(e.response?.data?.message||'Ошибка');}
  };
  const leaveChat = async () => {
    if (!window.confirm(`Покинуть ${chat.type==='channel'?'канал':'группу'}?`)) return;
    try { await axios.post(`/chats/${chat._id}/leave`); onDeleteChat?.(chat._id); } catch(e){alert(e.response?.data?.message||'Ошибка');}
  };
  const handleTyping = (val) => {
    setInput(val);
    if (!socket) return;
    socket.emit('typing:start',{chatId:chat._id});
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(()=>socket.emit('typing:stop',{chatId:chat._id}),1500);
    // @mention автодополнение
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch && chat.type !== 'private') {
      const q = atMatch[1].toLowerCase();
      const members = chat.members||[];
      const filtered = members.filter(m => m.nickname?.toLowerCase().includes(q) || m.username?.toLowerCase().includes(q));
      setMentionList(filtered.slice(0,5));
      setMentionIdx(0);
    } else {
      setMentionList([]);
    }
  };
  const handleReact = async (id,emoji) => {
    try { const {data}=await axios.put(`/messages/${id}/react`,{emoji}); setMsgs(prev=>prev.map(m=>m._id===id?data:m)); } catch {}
  };
  const handleDelete = async (id,forAll) => {
    try {
      await axios.delete(`/messages/${id}`,{data:{forAll}});
      if(forAll) setMsgs(prev=>prev.map(m=>m._id===id?{...m,isDeleted:true,content:''}:m));
      else setMsgs(prev=>prev.filter(m=>m._id!==id));
      if(forAll) socket?.emit('message:delete',{chatId:chat._id,messageId:id});
    } catch {}
  };

  // Имя чата с учётом localName
  const displayedName = chat.type==='private' && localName ? localName
    : chat.type==='saved' ? '⭐ Избранное'
    : chat.type==='private' ? (otherUser?.nickname||'Пользователь')
    : (chat.name||'Группа');

  const statusEl = typing.length > 0
    ? <span style={{display:'flex',alignItems:'center',gap:4}}><Dots/><span style={{fontSize:'.7rem',color:'#7C5CFC'}}>печатает...</span></span>
    : chat.type==='private' && otherUser
      ? <span style={{fontSize:'.75rem',fontWeight:500,color:isOnline?'#4ADE80':'rgba(240,240,255,.4)',letterSpacing:'.01em'}}>{isOnline?'в сети':otherUser.lastSeen?(()=>{
            const ls = new Date(otherUser.lastSeen);
            const now = new Date();
            const diff = now - ls;
            const mins = Math.floor(diff/60000);
            const hrs  = Math.floor(diff/3600000);
            const days = Math.floor(diff/86400000);
            if (otherUser?.hideLastSeen) return 'Был(а) недавно';
            if (mins < 1)  return 'только что';
            if (mins < 60) return `${mins} мин. назад`;
            if (hrs < 24)  return `сегодня в ${ls.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}`;
            if (days === 1) return `вчера в ${ls.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}`;
            return ls.toLocaleDateString('ru',{day:'numeric',month:'long'});
          })():'давно не было'}</span>
      : <span style={{fontSize:'.7rem',color:'rgba(240,240,255,.35)'}}>{chat.members?.length||0} {chat.type==='channel'?'подписчиков':'участников'}</span>;

  const menuItems = [
    chat.type==='private'
      ? {icon:I.user,    label:'Профиль',     action:()=>setShowUserSheet(true)}
      : {icon:I.info,    label:`О ${chat.type==='channel'?'канале':'группе'}`, action:()=>setShowGroupSheet(true)},
      {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>, label:'Обои чата', action:()=>{ wallpaperRef.current?.click(); }},
      {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>, label:'Убрать обои', action:()=>{ localStorage.removeItem('wallpaper_'+chat._id); setWallpaper(''); }},
    {divider:true},
    ...(chat.type!=='channel'||amChatAdmin ? [{icon:I.trash, label:'Очистить историю', danger:true, action:async()=>{if(!window.confirm('Очистить историю?'))return;try{await axios.delete(`/chats/${chat._id}/messages`);setMsgs([]);}catch{}}}] : []),
    {icon:I.trash, label:'Удалить чат',       danger:true, action:deleteChat},
    ...(chat.type!=='private'
      ? [{icon:I.leave, label:'Покинуть', danger:true, action:leaveChat}]
      : [
          {icon:I.block, label:isBlocked?'Разблокировать':'Заблокировать', danger:true, action:toggleBlock},
          ...(isAdmin&&otherUser ? [{icon:I.snow, label:'Заморозить', danger:true, action:freezeUser}] : []),
        ]
    ),
  ];

  return (
    <>
      {callScreen && <CallScreen peer={otherUser || {nickname: chat?.name || "Собеседник", avatar: chat?.avatar}} isVideo={callScreen.isVideo} local={localStream} remote={remoteStream} onEnd={endCall} muted={muted} onMute={()=>{localStream?.getAudioTracks().forEach(t=>t.enabled=!t.enabled);setMuted(v=>!v);}} camOff={camOff} onCam={()=>{localStream?.getVideoTracks().forEach(t=>t.enabled=!t.enabled);setCamOff(v=>!v);}} sharing={sharing} onScreen={toggleScreenShare}
          callStatus={
            callState==='calling'     ? 'Запрос...' :
            callState==='ringing'     ? 'Вызов...' :
            callState==='unavailable' ? 'Недоступен' :
            callState==='failed'      ? 'Не удалось подключиться' :
            callState==='connected'   ? 'Соединено' :
            remoteStream              ? 'Соединено' : 'Вызов...'
          }/>}
      {incoming && <IncomingCall caller={incoming} isVideo={incoming.isVideo} onAccept={acceptCall} onReject={()=>{socket?.emit('call:reject',{targetId:incoming.callerId}); soundManager.stopRingtone(); setIncoming(null);}}/>}
      {showUserSheet && otherUser && (
        <UserSheet u={otherUser} isOnline={isOnline} onClose={()=>setShowUserSheet(false)}
          onBlock={toggleBlock} isBlocked={isBlocked}
          onFreeze={freezeUser} isAdmin={isAdmin}
          inContacts={inContacts} onToggleContact={toggleContact}
          localName={localName} onSaveLocalName={saveLocalName}/>
      )}
      {/* Скрытый input для обоев */}
      <input ref={wallpaperRef} type="file" accept="image/*" style={{display:'none'}}
        onChange={e=>{
          const f=e.target.files?.[0]; if(!f) return;
          const r=new FileReader();
          r.onload=ev=>{ localStorage.setItem('wallpaper_'+chat._id,ev.target.result); setWallpaper(ev.target.result); };
          r.readAsDataURL(f);
          e.target.value='';
        }}/>
      {showGroupSheet && <GroupSheet chat={chatData} currentUserId={myId} onClose={()=>setShowGroupSheet(false)} onLeave={leaveChat} onChatUpdated={d=>{setChatData(d);}}/>}

      <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',position:'relative'}}>
        {/* TOP BAR */}
        <div style={{flexShrink:0,height:56,padding:'0 10px',borderBottom:'1px solid rgba(255,255,255,.07)',display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.03)',backdropFilter:'blur(24px)'}}>
          {isMobile&&<button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'#7C5CFC',padding:'8px 4px',display:'flex',alignItems:'center'}}>{I.back}</button>}
          <div style={{display:'flex',alignItems:'center',gap:10,flex:1,overflow:'hidden',cursor:'pointer'}} onClick={()=>chat.type==='private'?setShowUserSheet(true):setShowGroupSheet(true)}>
            <div style={{position:'relative',flexShrink:0}}>
              {chat.type==='saved'
                ?<div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#FFD700,#FFA500)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}}>⭐</div>
                :chat.type==='private'
                  ?<Ava u={otherUser} size={40}/>
                  :(chatData?.avatar
                    ?<img src={absUrl(chatData.avatar)} alt="" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}}/>
                    :<div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#7C5CFC,#FC5CA8)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>{chat.type==='channel'?I.channel:I.members}</div>
                  )
              }
              {chat.type==='private'&&isOnline&&<div style={{position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',background:'#4ADE80',border:'2px solid #0a0a1a'}}/>}
            </div>
            <div style={{overflow:'hidden'}}>
              <div style={{fontWeight:700,fontSize:'.93rem',fontFamily:'Syne,sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center'}}>
                {displayedName}{otherUser?.isVerified&&<VBadge s={15}/>}{otherUser?.isPremium&&<span style={{marginLeft:4,display:'inline-flex'}}>{I.star}</span>}{otherUser?.isFrozen&&<span style={{marginLeft:4,display:'inline-flex',opacity:.7}}>{I.snow}</span>}
              </div>
              <div>{statusEl}</div>
            </div>
          </div>
          {chat.type==='private'&&otherUser?.username!=='pulse'&&otherUser?.username!=='support'&&<>
            <button onClick={()=>startCall(false)} title="Голосовой" style={{width:38,height:38,borderRadius:12,background:'rgba(74,222,128,.1)',border:'1px solid rgba(74,222,128,.2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#4ADE80',flexShrink:0}}>{I.phone}</button>
            <button onClick={()=>startCall(true)} title="Видео" style={{width:38,height:38,borderRadius:12,background:'rgba(124,92,252,.1)',border:'1px solid rgba(124,92,252,.2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#7C5CFC',flexShrink:0}}>{I.video}</button>
          </>}
          <div style={{position:'relative',flexShrink:0}}>
            <button onClick={e=>{e.stopPropagation();setShowMenu(v=>!v);}} style={{width:38,height:38,borderRadius:12,background:showMenu?'rgba(124,92,252,.15)':'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(240,240,255,.5)'}}>{I.dots}</button>
            {showMenu&&(
              <div style={{position:'fixed',inset:0,zIndex:150}} onClick={()=>setShowMenu(false)}>
                <div className="glass ctx-menu" style={{position:'absolute',top:58,right:10,minWidth:220,zIndex:151}} onClick={e=>e.stopPropagation()}>
                  {menuItems.map((item,i)=>item.divider
                    ?<div key={i} style={{height:1,background:'rgba(255,255,255,.07)',margin:'4px 0'}}/>
                    :<div key={i} className={`ctx-item${item.danger?' danger':''}`} onClick={()=>{item.action();setShowMenu(false);}}>
                      <span style={{display:'inline-flex',marginRight:8,opacity:.8}}>{item.icon}</span>{item.label}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MESSAGES */}
        <div style={{flex:1,overflowY:'auto',paddingTop:8,paddingBottom:4,
          ...(wallpaper ? {
            backgroundImage:`url(${wallpaper})`,
            backgroundSize:'cover',
            backgroundPosition:'center',
            backgroundAttachment:'local',
          } : {})
        }} onClick={()=>{setShowAttach(false);setShowMenu(false);}}>
          {msgs.length===0&&<div style={{textAlign:'center',padding:'50px 20px',color:'rgba(240,240,255,.18)'}}>
            <div style={{marginBottom:10,opacity:.3}}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div><div>Начните общение!</div>
          </div>}
          {msgs.map(m=>(
            <Msg key={m._id} msg={m}
              isMine={m.sender?._id?.toString()===myId?.toString()||m.sender?.toString()===myId?.toString()}
              onReact={handleReact} onReply={setReplyTo} onDelete={handleDelete}
              onEdit={m=>{setEditMsg(m);setInput(m.content);inputRef.current?.focus();}}
              chatType={chat.type} isUserAdmin={amChatAdmin}/>
          ))}
          <div ref={bottomRef}/>
        </div>

        {/* REPLY/EDIT */}
        {(replyTo||editMsg)&&(
          <div style={{flexShrink:0,margin:'0 8px',padding:'8px 14px',background:'rgba(255,255,255,.05)',borderRadius:'12px 12px 0 0',borderLeft:`3px solid ${editMsg?'#FBBF24':'#7C5CFC'}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{overflow:'hidden'}}>
              <div style={{fontSize:'.7rem',color:editMsg?'#FBBF24':'#7C5CFC',fontWeight:700,marginBottom:2,display:'flex',alignItems:'center',gap:5}}>
                <span style={{display:'inline-flex'}}>{editMsg?I.edit2:I.reply}</span>{editMsg?'Редактирование':(replyTo?.sender?.nickname||'Ответ')}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:'.8rem',color:'rgba(240,240,255,.35)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {(editMsg||replyTo)?.type==='voice' ? <><span style={{display:'inline-flex',opacity:.7,flexShrink:0}}>{I.mic}</span> Голосовое</> :
                 (editMsg||replyTo)?.type==='video'  ? <><span style={{display:'inline-flex',opacity:.7,flexShrink:0}}>{I.video}</span> Видео</> :
                 (editMsg||replyTo)?.type==='file'   ? <><span style={{display:'inline-flex',opacity:.7,flexShrink:0}}>{I.file}</span> {(editMsg||replyTo)?.fileName||'Файл'}</> :
                 (editMsg||replyTo)?.type==='geo'    ? <><span style={{display:'inline-flex',opacity:.7,flexShrink:0}}>{I.geo}</span> Геопозиция</> :
                 (editMsg||replyTo)?.type==='image'  ? <><span style={{display:'inline-flex',opacity:.7,flexShrink:0}}>{I.photo}</span> Фото</> :
                 (editMsg||replyTo)?.content?.slice(0,55)}
              </div>
            </div>
            <button onClick={()=>{setReplyTo(null);setEditMsg(null);setInput('');}} style={{background:'none',border:'none',color:'rgba(240,240,255,.35)',cursor:'pointer',display:'flex',padding:4}}>{I.close}</button>
          </div>
        )}

        {/* @mention popup */}
        {mentionList.length>0&&(
          <div style={{flexShrink:0,margin:'0 8px 2px',background:'rgba(18,14,36,0.97)',borderRadius:12,border:'1px solid rgba(255,255,255,.08)',overflow:'hidden'}}>
            {mentionList.map((m,i)=>(
              <div key={m._id} onClick={()=>{
                const newVal = input.replace(/@\w*$/, '@'+m.username+' ');
                setInput(newVal); setMentionList([]); inputRef.current?.focus();
              }} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',cursor:'pointer',background:i===mentionIdx?'rgba(124,92,252,.15)':'transparent'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(124,92,252,.1)'}
                onMouseLeave={e=>e.currentTarget.style.background=i===mentionIdx?'rgba(124,92,252,.15)':'transparent'}>
                <Ava u={m} size={28}/>
                <div>
                  <div style={{fontWeight:600,fontSize:'.82rem'}}>{m.nickname}</div>
                  <div style={{fontSize:'.7rem',color:'rgba(240,240,255,.35)'}}>@{m.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Канал — только для чтения если не админ */}
        {(!canWrite||isPulseBot)&&(
          <div style={{flexShrink:0,padding:'10px 14px',borderTop:'1px solid rgba(255,255,255,.07)',background:'rgba(5,5,16,.97)',textAlign:'center',color:'rgba(240,240,255,.3)',fontSize:'.82rem'}}>
            {isPulseBot?"Это служебный чат Pulse":"Только администраторы могут писать в этот канал"}
          </div>
        )}

        {/* INPUT */}
        {canSend&&<div style={{flexShrink:0,padding:'8px 10px',borderTop:'1px solid rgba(255,255,255,.07)',background:'rgba(5,5,16,.97)',backdropFilter:'blur(24px)',display:'flex',alignItems:'flex-end',gap:8}}>
          <div style={{position:'relative',flexShrink:0}}>
            <button onClick={e=>{e.stopPropagation();setShowAttach(v=>!v);}} style={{width:42,height:42,borderRadius:13,background:showAttach?'rgba(124,92,252,.15)':'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:showAttach?'#7C5CFC':'rgba(240,240,255,.4)'}}>{I.attach}</button>
            {showAttach&&(
              <div style={{position:'fixed',inset:0,zIndex:50}} onClick={()=>setShowAttach(false)}>
                <div className="glass" style={{position:'absolute',bottom:72,left:10,borderRadius:14,padding:6,minWidth:195,boxShadow:'0 8px 32px rgba(0,0,0,.6)',zIndex:51}} onClick={e=>e.stopPropagation()}>
                  <button className="ctx-item" style={{width:'100%',textAlign:'left'}} onClick={()=>pickFile('image/*','image')}><span style={{display:'inline-flex',marginRight:8,opacity:.7}}>{I.photo}</span>Фото</button>
                  <button className="ctx-item" style={{width:'100%',textAlign:'left'}} onClick={()=>pickFile('video/*','video')}><span style={{display:'inline-flex',marginRight:8,opacity:.7}}>{I.video}</span>Видео</button>
                  <button className="ctx-item" style={{width:'100%',textAlign:'left'}} onClick={()=>pickFile('*/*','file')}><span style={{display:'inline-flex',marginRight:8,opacity:.7}}>{I.file}</span>Документ</button>
                  <button className="ctx-item" style={{width:'100%',textAlign:'left'}} onClick={sendGeo}><span style={{display:'inline-flex',marginRight:8,opacity:.7}}>{I.geo}</span>Геопозиция</button>
                  <button className="ctx-item" style={{width:'100%',textAlign:'left'}} onClick={()=>{setShowAttach(false);startRec();}}><span style={{display:'inline-flex',marginRight:8,opacity:.7}}>{I.mic}</span>Записать голос</button>
                </div>
              </div>
            )}
          </div>

          {recording?(
            <div style={{flex:1,display:'flex',alignItems:'center',gap:10,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',borderRadius:13,padding:'0 14px',height:42}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#f87171',animation:'pulse2 1s infinite'}}/>
              <span style={{fontSize:'.875rem',color:'#f87171',fontFamily:'monospace'}}>{String(Math.floor(recTime/60)).padStart(2,'0')}:{String(recTime%60).padStart(2,'0')}</span>
              <span style={{flex:1,fontSize:'.8rem',color:'rgba(240,240,255,.3)'}}>Запись...</span>
              <button onClick={stopRec} style={{background:'#f87171',border:'none',borderRadius:8,color:'#fff',cursor:'pointer',padding:'4px 10px',fontSize:'.8rem'}}>Стоп</button>
            </div>
          ):(
            <textarea ref={inputRef} value={input} onChange={e=>handleTyping(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}}
              placeholder={uploading?'Загрузка файла...':'Сообщение...'} rows={1} disabled={uploading}
              style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.08)',borderRadius:13,padding:'10px 14px',color:'#F0F0FF',fontFamily:'DM Sans,sans-serif',fontSize:'.95rem',resize:'none',outline:'none',minHeight:42,maxHeight:120,overflowY:'auto',lineHeight:1.5}}
              onFocus={e=>e.target.style.borderColor='rgba(124,92,252,.5)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.08)'}/>
          )}

          {input.trim()?(
            <button onMouseDown={e=>e.preventDefault()} onClick={()=>sendMsg()} className={sendAnim?'send-pulse':''} style={{width:42,height:42,borderRadius:13,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#7C5CFC,#9B7CFF)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 16px rgba(124,92,252,.4)'}}>{I.send}</button>
          ):(
            <button onMouseDown={e=>e.preventDefault()} onTouchStart={startRec} onTouchEnd={stopRec}
              onClick={recording?stopRec:startRec}
              style={{width:42,height:42,borderRadius:13,border:'none',cursor:'pointer',background:recording?'rgba(239,68,68,.18)':'rgba(255,255,255,.05)',color:recording?'#f87171':'rgba(240,240,255,.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{I.mic}</button>
          )}
        </div>}
      </div>
      <style>{`@keyframes pulse2{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </>
  );
}
