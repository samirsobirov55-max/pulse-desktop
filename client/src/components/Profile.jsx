import React, { useState, useRef } from 'react';
import axios from 'axios';

const HF = 'https://auragram-telegram-web.hf.space';
const absUrl = url => (!url || url.startsWith('http') || url.startsWith('data:')) ? url : HF + url;
import { useAuth } from '../contexts/AuthContext';

const IC = {
  camera: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  check: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>,
  star:  <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFD700"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  shield:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

function Avatar({ u, size = 88 }) {
  const cols = ['#7C5CFC','#FC5CA8','#5CF4FC','#4ADE80','#FBBF24','#F87171'];
  const col = cols[((u?.username||'a').charCodeAt(0)) % cols.length];
  if (u?.avatar) return (
    <img src={absUrl(u.avatar)} alt="" style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', display:'block' }}/>
  );
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`linear-gradient(135deg,${col},${col}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.38, fontWeight:800, color:'#fff' }}>
      {(u?.nickname||'?')[0].toUpperCase()}
    </div>
  );
}

function VBadge() {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:20, height:20, background:'#2563eb', borderRadius:'50%', flexShrink:0, marginLeft:4 }}>
      {IC.check}
    </span>
  );
}

function Label({ children }) {
  return <div style={{ fontSize:'0.68rem', color:'rgba(240,240,255,0.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.6px', marginBottom:6 }}>{children}</div>;
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab]     = useState('info');
  const [nick, setNick]   = useState(user?.nickname || '');
  const [uname, setUname] = useState(user?.username || '');
  const [bio, setBio]     = useState(user?.bio || '');
  const [cur, setCur]     = useState('');
  const [np, setNp]       = useState('');
  const [cp, setCp]       = useState('');
  const [msg, setMsg]     = useState('');
  const [err, setErr]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]   = useState(null);
  const fileRef = useRef();

  const flash = (text, isErr = false) => {
    if (isErr) { setErr(text); setMsg(''); }
    else { setMsg(text); setErr(''); }
    setTimeout(() => { setMsg(''); setErr(''); }, 3000);
  };

  // ── Выбор и загрузка аватара ──
  const pickAvatar = () => fileRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Показываем превью сразу
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    // Загружаем на сервер
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await axios.post('/users/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data);
      setPreview(null);
      flash('Аватар обновлён ✓');
    } catch (ex) {
      setPreview(null);
      // Fallback: base64
      try {
        const reader2 = new FileReader();
        reader2.onload = async ev => {
          const { data } = await axios.put('/users/me/update', { avatar: ev.target.result });
          updateUser(data);
          flash('Аватар обновлён ✓');
        };
        reader2.readAsDataURL(file);
      } catch { flash('Ошибка загрузки аватара', true); }
    } finally { setUploading(false); }
  };

  const saveInfo = async () => {
    if (!nick.trim()) return flash('Имя не может быть пустым', true);
    setLoading(true);
    try {
      const { data } = await axios.put('/users/me/update', {
        nickname: nick.trim(),
        username: uname.trim().replace('@', ''),
        bio,
      });
      updateUser(data);
      flash('Сохранено ✓');
    } catch (e) { flash(e.response?.data?.message || 'Ошибка', true); }
    finally { setLoading(false); }
  };

  const savePwd = async () => {
    if (!cur) return flash('Введите текущий пароль', true);
    if (np.length < 6) return flash('Новый пароль минимум 6 символов', true);
    if (np !== cp) return flash('Пароли не совпадают', true);
    setLoading(true);
    try {
      await axios.put('/users/me/update', { currentPassword: cur, newPassword: np });
      flash('Пароль изменён ✓');
      setCur(''); setNp(''); setCp('');
    } catch (e) { flash(e.response?.data?.message || 'Ошибка', true); }
    finally { setLoading(false); }
  };

  const avatarSrc = preview || (user?.avatar ? absUrl(user.avatar) : null);

  return (
    <div style={{ flex:1, overflowY:'auto', padding:16 }}>

      {/* ── Шапка ── */}
      <div style={{ background:'linear-gradient(135deg,rgba(124,92,252,0.18),rgba(252,92,168,0.1))', borderRadius:22, padding:'28px 16px 20px', textAlign:'center', marginBottom:20, position:'relative' }}>
        {/* Аватар с кнопкой камеры */}
        <div style={{ position:'relative', display:'inline-block', marginBottom:14 }}>
          <div style={{ width:96, height:96, borderRadius:'50%', overflow:'hidden', border:'3px solid rgba(124,92,252,0.4)', position:'relative' }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <Avatar u={user} size={96}/>
            }
            {uploading && (
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:24, height:24, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
              </div>
            )}
          </div>
          {/* Кнопка камеры */}
          <button onClick={pickAvatar} style={{ position:'absolute', bottom:2, right:2, width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#7C5CFC,#FC5CA8)', border:'2px solid #0a0a1a', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            {IC.camera}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onFileChange}/>
          {/* Verified badge */}
          {user?.isVerified && (
            <span style={{ position:'absolute', top:2, right:2, width:24, height:24, background:'#2563eb', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #0a0a1a' }}>
              {IC.check}
            </span>
          )}
        </div>

        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          {user?.nickname}
          {user?.isVerified && <VBadge/>}
          {user?.isPremium && <span style={{ marginLeft:4, display:'inline-flex' }}>{IC.star}</span>}
        </div>
        <div style={{ color:'rgba(240,240,255,0.4)', fontSize:'0.85rem', marginTop:3 }}>@{user?.username}</div>
        {user?.bio && <div style={{ color:'rgba(240,240,255,0.45)', fontSize:'0.82rem', marginTop:8 }}>{user.bio}</div>}
        {user?.isAdmin && (
          <div style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.12)', color:'#f87171', borderRadius:20, padding:'4px 12px', fontSize:'0.72rem', fontWeight:700 }}>
            {IC.shield} Администратор
          </div>
        )}
        <div style={{ marginTop:10, fontSize:'0.72rem', color:'rgba(240,240,255,0.25)' }}>
          Нажмите на аватар чтобы изменить фото
        </div>
      </div>

      {/* ── Уведомление ── */}
      {(msg || err) && (
        <div style={{ padding:'10px 14px', borderRadius:12, marginBottom:14, background: err ? 'rgba(239,68,68,0.12)' : 'rgba(74,222,128,0.12)', color: err ? '#f87171' : '#4ADE80', fontSize:'0.875rem', textAlign:'center' }}>
          {msg || err}
        </div>
      )}

      {/* ── Табы ── */}
      <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:12, padding:3, marginBottom:18, border:'1px solid rgba(255,255,255,0.07)' }}>
        {[['info','Профиль'],['pwd','Пароль']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:'10px 6px', borderRadius:10, border:'none', cursor:'pointer', background: tab===k ? '#7C5CFC' : 'transparent', color: tab===k ? '#fff' : 'rgba(240,240,255,0.4)', fontWeight: tab===k ? 700 : 400, fontSize:'0.875rem', transition:'all .2s', fontFamily:'DM Sans,sans-serif' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Профиль ── */}
      {tab === 'info' && (
        <div>
          <Label>Отображаемое имя</Label>
          <input value={nick} onChange={e => setNick(e.target.value)} placeholder="Ваше имя" className="input" style={{ width:'100%', marginBottom:14 }}/>

          <Label>Username</Label>
          <div style={{ position:'relative', marginBottom:14 }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(240,240,255,0.3)', fontSize:'0.9rem', pointerEvents:'none' }}>@</span>
            <input value={uname} onChange={e => setUname(e.target.value.replace('@',''))} placeholder="username" className="input" style={{ width:'100%', paddingLeft:28 }}/>
          </div>

          <Label>О себе</Label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Расскажите о себе..." className="input" style={{ width:'100%', minHeight:80, resize:'vertical', marginBottom:18 }}/>

          <button onClick={saveInfo} disabled={loading} style={{ width:'100%', padding:'13px', borderRadius:14, border:'none', cursor: loading ? 'not-allowed' : 'pointer', background:'linear-gradient(135deg,#7C5CFC,#9B7CFF)', color:'#fff', fontWeight:700, fontFamily:'Syne,sans-serif', fontSize:'0.95rem', opacity: loading ? .7 : 1, boxShadow:'0 4px 20px rgba(124,92,252,0.35)' }}>
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      )}

      {/* ── Пароль ── */}
      {tab === 'pwd' && (
        <div>
          <Label>Текущий пароль</Label>
          <input value={cur} onChange={e => setCur(e.target.value)} type="password" placeholder="••••••••" className="input" style={{ width:'100%', marginBottom:14 }}/>

          <Label>Новый пароль</Label>
          <input value={np} onChange={e => setNp(e.target.value)} type="password" placeholder="••••••••" className="input" style={{ width:'100%', marginBottom:14 }}/>

          <Label>Повторите новый пароль</Label>
          <input value={cp} onChange={e => setCp(e.target.value)} type="password" placeholder="••••••••" className="input" style={{ width:'100%', marginBottom:18 }}/>

          <button onClick={savePwd} disabled={loading} style={{ width:'100%', padding:'13px', borderRadius:14, border:'none', cursor: loading ? 'not-allowed' : 'pointer', background:'linear-gradient(135deg,#7C5CFC,#9B7CFF)', color:'#fff', fontWeight:700, fontFamily:'Syne,sans-serif', fontSize:'0.95rem', opacity: loading ? .7 : 1 }}>
            {loading ? 'Сохранение...' : 'Сменить пароль'}
          </button>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
