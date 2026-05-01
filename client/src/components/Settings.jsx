import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// SVG иконки
const IC = {
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>,
  general: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  privacy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  notif: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  appearance: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  sessions: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  block: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  star: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  business: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
};

const SECTIONS = [
  { key:'general',    icon: IC.general,    label:'Основные' },
  { key:'privacy',    icon: IC.privacy,    label:'Приватность' },
  { key:'notif',      icon: IC.notif,      label:'Уведомления' },
  { key:'appearance', icon: IC.appearance, label:'Оформление' },
  { key:'sessions',   icon: IC.sessions,   label:'Сессии' },
  { key:'blacklist',  icon: IC.block,      label:'Чёрный список' },
  { key:'premium',    icon: IC.star,       label:'Premium' },
  { key:'business',   icon: IC.business,   label:'Бизнес' },
];

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width:44, height:24, borderRadius:12, background: on ? '#7C5CFC' : 'rgba(255,255,255,0.12)', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
      <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: on ? 22 : 2, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
    </div>
  );
}

function Row({ icon, label, sub, value, onToggle, onClick, danger }) {
  return (
    <div onClick={onToggle ? () => onToggle(!value) : onClick}
      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', cursor: (onClick||onToggle) ? 'pointer' : 'default', transition:'background .12s', borderRadius: 0 }}
      onMouseEnter={e => { if(onClick||onToggle) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {icon && <span style={{ display:'inline-flex', opacity:.65, color: danger ? '#f87171' : 'inherit', flexShrink:0 }}>{icon}</span>}
        <div>
          <div style={{ fontSize:'0.9rem', fontWeight:500, color: danger ? '#f87171' : 'inherit' }}>{label}</div>
          {sub && <div style={{ fontSize:'0.75rem', color:'rgba(240,240,255,0.35)', marginTop:1 }}>{sub}</div>}
        </div>
      </div>
      {onToggle && <Toggle on={value} onChange={onToggle}/>}
      {onClick && !onToggle && <span style={{ display:'inline-flex', color:'rgba(240,240,255,0.3)' }}>{IC.arrow}</span>}
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:14, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)', marginBottom:12, ...style }}>{children}</div>;
}
function Div() { return <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'0 16px' }}/>; }

// ════════════════════════════════════════
function PremiumSection({ user, plan }) {
  const isPremium  = plan === 'premium';
  const price      = isPremium ? '1.99' : '1.49';
  const currency   = '$';
  const planName   = isPremium ? 'Pulse Premium' : 'Pulse Business';
  const color      = isPremium ? '#FFD700' : '#7C5CFC';
  const gradient   = isPremium
    ? 'linear-gradient(135deg,#FF6B00,#FFD700)'
    : 'linear-gradient(135deg,#7C5CFC,#FC5CA8)';

  const premiumFeatures = [
    '⭐ Золотая звезда рядом с именем',
    '🚀 Повышенный лимит загрузок файлов (4 ГБ)',
    '🎭 Анимированные аватарки',
    '📌 Закреплённые сообщения без ограничений',
    '🔍 Расширенный поиск по истории',
    '🎨 Эксклюзивные темы оформления',
    '📊 Статистика профиля',
  ];
  const businessFeatures = [
    '🏢 Бизнес-значок рядом с именем',
    '📢 Каналы без ограничений на подписчиков',
    '📅 Планировщик сообщений',
    '🤖 Автоответы и боты',
    '📈 Детальная аналитика канала',
    '💼 Корпоративный профиль',
    '📞 Бизнес-звонки с записью',
  ];

  const features = isPremium ? premiumFeatures : businessFeatures;
  const already = isPremium ? user?.isPremium : user?.isBusiness;

  const handleBuy = () => {
    // Используем Stripe Checkout через публичный redirect
    const stripeLinks = {
      premium:  'https://buy.stripe.com/test_pulse_premium',
      business: 'https://buy.stripe.com/test_pulse_business',
    };
    // Показываем модальное окно с инструкцией
    alert(`Для покупки ${planName} за ${currency}${price}/мес:

1. Свяжитесь с поддержкой @support
2. Или переведите на карту и отправьте чек

В будущем будет автоматическая оплата через Stripe.`);
  };

  return (
    <div>
      {/* ── Плашка: Работа над обновлениями ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(135deg, rgba(255,193,7,0.15), rgba(255,152,0,0.1))',
        border: '1px solid rgba(255,193,7,0.35)',
        borderRadius: 14, padding: '12px 16px', marginBottom: 16,
      }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>🔧</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#FFD166', marginBottom: 2 }}>
            Работа над обновлениями
          </div>
          <div style={{ fontSize: '.78rem', color: 'rgba(240,240,255,.55)', lineHeight: 1.4 }}>
            Раздел временно недоступен. Мы готовим обновления — скоро всё заработает!
          </div>
        </div>
      </div>
      <div style={{ background: gradient, borderRadius:20, padding:'28px 20px', textAlign:'center', marginBottom:16, position:'relative', overflow:'hidden' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:8 }}>{isPremium?'⭐':'🏢'}</div>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:900, fontSize:'1.6rem', color:'#fff', marginBottom:4 }}>{planName}</div>
        <div style={{ color:'rgba(255,255,255,.8)', fontSize:'.9rem', marginBottom:16 }}>
          {isPremium ? 'Максимум возможностей для общения' : 'Профессиональные инструменты для бизнеса'}
        </div>
        <div style={{ display:'inline-flex', alignItems:'baseline', gap:4, background:'rgba(0,0,0,.2)', borderRadius:12, padding:'8px 20px' }}>
          <span style={{ color:'#fff', fontFamily:'Syne,sans-serif', fontWeight:900, fontSize:'2rem' }}>{currency}{price}</span>
          <span style={{ color:'rgba(255,255,255,.7)', fontSize:'.85rem' }}>/месяц</span>
        </div>
      </div>

      <Card>
        <div style={{ padding:'14px 16px' }}>
          <div style={{ fontWeight:600, fontSize:'.85rem', color:'rgba(240,240,255,.5)', marginBottom:12, textTransform:'uppercase', letterSpacing:'.5px' }}>Что входит</div>
          {features.map((f,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i<features.length-1?'1px solid rgba(255,255,255,.05)':'none' }}>
              <span style={{ fontSize:'.9rem' }}>{f}</span>
            </div>
          ))}
        </div>
      </Card>

      {already ? (
        <div style={{ textAlign:'center', padding:'16px', color:'#4ADE80', fontWeight:600 }}>
          ✅ У вас уже есть {planName}
        </div>
      ) : (
        <button onClick={handleBuy}
          style={{ width:'100%', padding:'15px', borderRadius:16, border:'none', cursor:'pointer',
            background: gradient, color:'#fff', fontWeight:700, fontSize:'1rem',
            fontFamily:'Syne,sans-serif', boxShadow:`0 4px 24px ${color}44` }}>
          Получить {planName} за {currency}{price}/мес
        </button>
      )}

      <div style={{ textAlign:'center', marginTop:12, fontSize:'.72rem', color:'rgba(240,240,255,.3)' }}>
        Отмена в любое время · Безопасная оплата
      </div>
    </div>
  );
}

function SecuritySection({ user }) {
  const [curPwd,    setCurPwd]    = React.useState('');
  const [twoCode,   setTwoCode]   = React.useState('');
  const [twoCode2,  setTwoCode2]  = React.useState('');
  const [twoEnabled,setTwoEnabled]= React.useState(user?.twoFAEnabled || false);
  const [loading,   setLoading]   = React.useState(false);
  const [msg,       setMsg]       = React.useState('');
  const [err,       setErr]       = React.useState('');

  const flash = (t, isErr=false) => {
    isErr ? setErr(t) : setMsg(t);
    setTimeout(() => { setErr(''); setMsg(''); }, 3000);
  };

  const toggle2FA = async () => {
    if (!curPwd) return flash('Введите текущий пароль', true);
    if (!twoEnabled && !twoCode) return flash('Введите код 2FA', true);
    if (!twoEnabled && twoCode !== twoCode2) return flash('Коды не совпадают', true);
    if (!twoEnabled && twoCode.length < 4) return flash('Минимум 4 символа', true);
    setLoading(true);
    try {
      const { data } = await axios.post('/users/me/2fa', {
        enable: !twoEnabled,
        twoFACode: twoCode,
        currentPassword: curPwd,
      });
      setTwoEnabled(data.twoFAEnabled);
      setCurPwd(''); setTwoCode(''); setTwoCode2('');
      flash(data.twoFAEnabled ? '✅ Двухфакторная аутентификация включена' : '2FA отключена');
    } catch(e) { flash(e.response?.data?.message || 'Ошибка', true); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Card>
        <div style={{ padding:'14px 16px' }}>
          <div style={{ fontWeight:700, fontSize:'.9rem', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
            <span>🔐</span> Двухфакторная аутентификация
          </div>
          <div style={{ fontSize:'.78rem', color:'rgba(240,240,255,.4)', marginBottom:14, lineHeight:1.5 }}>
            {twoEnabled
              ? 'Включена. При входе потребуется дополнительный код.'
              : 'Защитите аккаунт дополнительным кодом при входе.'}
          </div>

          {msg && <div style={{ padding:'8px 12px', borderRadius:10, background:'rgba(74,222,128,.1)', color:'#4ADE80', fontSize:'.82rem', marginBottom:12 }}>{msg}</div>}
          {err && <div style={{ padding:'8px 12px', borderRadius:10, background:'rgba(239,68,68,.1)', color:'#f87171', fontSize:'.82rem', marginBottom:12 }}>{err}</div>}

          <Label>Текущий пароль</Label>
          <input value={curPwd} onChange={e=>setCurPwd(e.target.value)} type="password"
            placeholder="••••••••" className="input" style={{width:'100%',marginBottom:12}}/>

          {!twoEnabled && <>
            <Label>Код 2FA (минимум 4 символа)</Label>
            <input value={twoCode} onChange={e=>setTwoCode(e.target.value)} type="password"
              placeholder="Придумайте код" className="input" style={{width:'100%',marginBottom:12}}/>
            <Label>Повторите код 2FA</Label>
            <input value={twoCode2} onChange={e=>setTwoCode2(e.target.value)} type="password"
              placeholder="Повторите код" className="input" style={{width:'100%',marginBottom:14}}/>
          </>}

          <button onClick={toggle2FA} disabled={loading}
            style={{ width:'100%', padding:'12px', borderRadius:13, border:'none', cursor:'pointer',
              background: twoEnabled ? 'rgba(239,68,68,.15)' : 'linear-gradient(135deg,#7C5CFC,#9B7CFF)',
              color: twoEnabled ? '#f87171' : '#fff', fontWeight:700,
              opacity: loading ? .7 : 1, fontFamily:'Syne,sans-serif' }}>
            {loading ? 'Сохранение...' : twoEnabled ? 'Отключить 2FA' : 'Включить 2FA'}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [section, setSection] = useState(null);
  const isMobile = window.innerWidth < 768;

  // Privacy state
  const [priv, setPriv] = useState({
    hideLastSeen: user?.hideLastSeen || false,
    hideData: user?.hideData || false,
    twoFA: user?.twoFAEnabled || false,
  });
  const [savingPriv, setSavingPriv] = useState(false);
  const [privMsg, setPrivMsg] = useState('');

  // Notification state
  const [notifPerm, setNotifPerm] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessLoading, setSessLoading] = useState(false);

  // Blacklist state
  const [blacklist, setBlacklist] = useState([]);
  const [blLoading, setBlLoading] = useState(false);

  // Appearance
  const [accent, setAccent] = useState('#7C5CFC');

  useEffect(() => {
    if (section === 'sessions') loadSessions();
    if (section === 'blacklist') loadBlacklist();
  }, [section]);

  const loadSessions = async () => {
    setSessLoading(true);
    try { const { data } = await axios.get('/auth/sessions'); setSessions(data || []); } catch(e) { console.error('Sessions:', e); }
    finally { setSessLoading(false); }
  };

  const loadBlacklist = async () => {
    setBlLoading(true);
    try {
      // Загружаем полный профиль чтобы получить blacklist
      const { data } = await axios.get('/users/me');
      const ids = data.blacklist || [];
      if (ids.length === 0) { setBlacklist([]); return; }
      const details = await Promise.all(
        ids.map(id => axios.get(`/users/by-id/${typeof id === 'object' ? id._id||id : id}`).then(r=>r.data).catch(()=>null))
      );
      setBlacklist(details.filter(Boolean));
    } catch {}
    finally { setBlLoading(false); }
  };

  const savePrivacy = async (newPriv) => {
    setSavingPriv(true); setPrivMsg('');
    try {
      const { data } = await axios.put('/users/me/update', {
        hideLastSeen: newPriv.hideLastSeen,
        hideData: newPriv.hideData,
      });
      updateUser(data);
      setPrivMsg('Сохранено ✓');
      setTimeout(() => setPrivMsg(''), 2000);
    } catch {}
    finally { setSavingPriv(false); }
  };

  const revokeSession = async (id) => {
    try {
      await axios.delete(`/auth/sessions/${id}`);
      setSessions(prev => prev.filter(s => s._id?.toString() !== id?.toString()));
    } catch(e) { alert(e.response?.data?.message || 'Ошибка'); }
  };

  const unblock = async (userId) => {
    try {
      await axios.post(`/users/me/blacklist/${userId}`);
      setBlacklist(prev => prev.filter(u => u._id !== userId && u.id !== userId));
    } catch(e) { alert(e.response?.data?.message || 'Ошибка'); }
  };

  const requestNotif = async () => {
    if (!('Notification' in window)) return alert('Браузер не поддерживает уведомления');
    const r = await Notification.requestPermission();
    setNotifPerm(r);
    if (r === 'granted') {
      new Notification('Pulse', { body: '🔔 Уведомления включены!' });
    }
  };

  const requestPerms = async () => {
    const res = [];
    try { const r = await Notification.requestPermission(); res.push(`🔔 Уведомления: ${r === 'granted' ? '✅' : '❌'}`); } catch {}
    try { const s = await navigator.mediaDevices.getUserMedia({audio:true,video:true}); s.getTracks().forEach(t=>t.stop()); res.push('🎤 Микрофон/Камера: ✅'); } catch { res.push('🎤 Микрофон/Камера: ❌'); }
    await new Promise(resolve => navigator.geolocation.getCurrentPosition(() => { res.push('📍 Геолокация: ✅'); resolve(); }, () => { res.push('📍 Геолокация: ❌'); resolve(); }));
    alert(res.join('\n'));
  };

  // ── РЕНДЕР СЕКЦИЙ ──
  const renderSection = () => {
    switch (section) {

      case 'general': return (
        <>
          <Card>
            <Row icon={IC.general} label="Разрешения устройства" sub="Микрофон, камера, геолокация, уведомления" onClick={requestPerms}/>
            <Div/>
            <Row icon={IC.trash} label="Очистить кэш" sub="Удалить временные данные браузера" onClick={() => { localStorage.clear(); alert('Кэш очищен'); }} danger/>
          </Card>
        </>
      );

      case 'privacy': return (
        <>
          {privMsg && <div style={{ background:'rgba(74,222,128,0.12)', color:'#4ADE80', borderRadius:12, padding:'10px 14px', marginBottom:12, fontSize:'0.875rem', textAlign:'center' }}>{privMsg}</div>}
          <Card>
            <Row icon={IC.privacy} label="Скрыть время последнего визита" value={priv.hideLastSeen} onToggle={v => { const n={...priv,hideLastSeen:v}; setPriv(n); savePrivacy(n); }}/>
            <Div/>
            <Row icon={IC.block} label="Скрыть данные профиля" sub="Биография, дата рождения" value={priv.hideData} onToggle={v => { const n={...priv,hideData:v}; setPriv(n); savePrivacy(n); }}/>
          </Card>
          <Card>
            <Row icon={IC.privacy} label="Двухфакторная аутентификация" sub="Дополнительная защита аккаунта" value={priv.twoFA} onToggle={v => { setPriv(p=>({...p,twoFA:v})); alert(v ? '2FA будет добавлена в следующем обновлении' : '2FA отключена'); }}/>
          </Card>
        </>
      );

      case 'notif': return (
        <>
          <Card>
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:'0.9rem', fontWeight:500 }}>Браузерные уведомления</div>
                <div style={{ fontSize:'0.75rem', color: notifPerm==='granted'?'#4ADE80':'rgba(240,240,255,0.35)', marginTop:2 }}>
                  {notifPerm==='granted'?'✅ Включены':notifPerm==='denied'?'❌ Заблокированы браузером':'⏳ Не запрошено'}
                </div>
              </div>
              {notifPerm !== 'granted' && notifPerm !== 'denied' && (
                <button onClick={requestNotif} style={{ background:'linear-gradient(135deg,#7C5CFC,#FC5CA8)', border:'none', borderRadius:10, padding:'8px 14px', color:'#fff', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>Включить</button>
              )}
            </div>
          </Card>
          <Card>
            <Row icon={IC.notif} label="Звук уведомлений" sub="Звуковой сигнал при новом сообщении" value={true} onToggle={() => {}}/>
            <Div/>
            <Row icon={IC.notif} label="Вибрация" sub="Только на мобильных устройствах" value={true} onToggle={() => {}}/>
          </Card>
        </>
      );

      case 'appearance': return (
        <>
          <Card>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:14 }}>Тема приложения</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {[
                  { id:'dark',    label:'Тёмная',   bg:'#050510',  accent:'#7C5CFC' },
                  { id:'darker',  label:'Чёрная',   bg:'#000000',  accent:'#7C5CFC' },
                  { id:'purple',  label:'Фиолет.',  bg:'#0d0520',  accent:'#a855f7' },
                  { id:'blue',    label:'Синяя',    bg:'#050b1a',  accent:'#3b82f6' },
                  { id:'green',   label:'Зелёная',  bg:'#051a0d',  accent:'#22c55e' },
                ].map(t => {
                  const cur = localStorage.getItem('pulse_theme') || 'dark';
                  return (
                    <button key={t.id} onClick={() => {
                      localStorage.setItem('pulse_theme', t.id);
                      document.documentElement.style.setProperty('--bg-dark', t.bg);
                      document.documentElement.style.setProperty('--accent', t.accent);
                      document.documentElement.style.setProperty('--bg-base', t.bg);
                    }} style={{
                      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                      padding:'10px 14px', borderRadius:14, cursor:'pointer',
                      border: cur===t.id ? `2px solid ${t.accent}` : '2px solid rgba(255,255,255,0.08)',
                      background: cur===t.id ? `${t.accent}22` : 'rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:t.bg, border:`3px solid ${t.accent}` }}/>
                      <span style={{ fontSize:'0.72rem', color:'rgba(240,240,255,0.6)' }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
          <Card>
            <Row label="Размер текста" val={
              <input type="range" min="12" max="20" defaultValue={parseInt(localStorage.getItem('pulse_fontsize')||'15')}
                onChange={e=>{ localStorage.setItem('pulse_fontsize',e.target.value); document.documentElement.style.fontSize=e.target.value+'px'; }}
                style={{ width:120 }}/>
            }/>
          </Card>
        </>
      );
      case 'sessions': return (
        <>
          {sessLoading ? (
            <div style={{ textAlign:'center', padding:30, color:'rgba(240,240,255,0.3)' }}>Загрузка...</div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign:'center', padding:30, color:'rgba(240,240,255,0.3)', fontSize:'0.875rem' }}>Нет активных сессий</div>
          ) : (
            <>
              <Card>
                {sessions.map((s, i) => {
                  const icons = { mobile:'📱', tablet:'📟', desktop:'🖥️', web:'🌐' };
                  const icon  = icons[s.deviceType] || '💻';
                  const date  = s.lastActive ? new Date(s.lastActive) : null;
                  const dateStr = date ? date.toLocaleDateString('ru', { day:'numeric', month:'short', year:'numeric' }) + ' ' + date.toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' }) : '—';
                  return (
                    <React.Fragment key={s._id}>
                      {i > 0 && <Div/>}
                      <div style={{ display:'flex', alignItems:'flex-start', padding:'13px 16px', gap:12 }}>
                        <div style={{ width:42, height:42, borderRadius:12, background: s.isCurrent ? 'linear-gradient(135deg,#7C5CFC,#FC5CA8)' : 'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>
                          {icon}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                            <div style={{ fontWeight:600, fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {s.deviceName || 'Неизвестное устройство'}
                            </div>
                            {s.isCurrent && <span style={{ fontSize:'0.65rem', background:'rgba(74,222,128,0.15)', color:'#4ADE80', borderRadius:6, padding:'1px 6px', flexShrink:0 }}>Сейчас</span>}
                          </div>
                          <div style={{ fontSize:'0.75rem', color:'rgba(240,240,255,0.45)', marginBottom:2 }}>
                            {s.os || 'Неизвестно'}
                          </div>
                          <div style={{ fontSize:'0.72rem', color:'rgba(240,240,255,0.3)', display:'flex', gap:8, flexWrap:'wrap' }}>
                            <span>🌐 {s.ip || '—'}</span>
                            <span>🕐 {dateStr}</span>
                          </div>
                        </div>
                        {!s.isCurrent && (
                          <button onClick={() => revokeSession(s._id)}
                            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, padding:'7px 11px', color:'#f87171', cursor:'pointer', fontSize:'0.78rem', flexShrink:0, fontWeight:500 }}>
                            Завершить
                          </button>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </Card>
              {sessions.filter(s => !s.isCurrent).length > 0 && (
                <button onClick={async () => {
                  if (!window.confirm('Завершить все другие сессии?')) return;
                  try { await axios.delete('/auth/sessions'); setSessions(prev => prev.filter(s => s.isCurrent)); }
                  catch(e) { alert(e.response?.data?.message || 'Ошибка'); }
                }} style={{ width:'100%', padding:'12px', borderRadius:13, border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.08)', color:'#f87171', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', marginTop:4 }}>
                  Завершить все другие сессии
                </button>
              )}
            </>
          )}
        </>
      );

      case 'blacklist': return (
        <>
          {blLoading ? (
            <div style={{ textAlign:'center', padding:30, color:'rgba(240,240,255,0.3)' }}>Загрузка...</div>
          ) : blacklist.length === 0 ? (
            <Card>
              <div style={{ padding:'30px 16px', textAlign:'center', color:'rgba(240,240,255,0.3)' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:10, opacity:.4 }}>{IC.block}</div>
                <div style={{ fontSize:'0.875rem' }}>Заблокированных пользователей нет</div>
              </div>
            </Card>
          ) : (
            <Card>
              {blacklist.map((u, i) => (
                <React.Fragment key={u._id||u.id}>
                  {i > 0 && <Div/>}
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
                    <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#7C5CFC,#FC5CA8)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0 }}>
                      {u.avatar ? <img src={u.avatar} style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover' }}/> : (u.nickname||'?')[0]}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{u.nickname}</div>
                      <div style={{ fontSize:'0.72rem', color:'rgba(240,240,255,0.35)' }}>@{u.username}</div>
                    </div>
                    <button onClick={() => unblock(u._id||u.id)} style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:8, padding:'6px 10px', color:'#4ADE80', cursor:'pointer', fontSize:'0.78rem' }}>Разблок</button>
                  </div>
                </React.Fragment>
              ))}
            </Card>
          )}
        </>
      );

      case 'security': return (
        <SecuritySection user={user}/>
      );

      case 'premium': return (
        <PremiumSection user={user} plan="premium"/>
      );

      case 'business': return (
        <PremiumSection user={user} plan="business"/>
      );


      default: return null;
    }
  };

  // Мобиле - полноэкранный раздел
  if (isMobile && section) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ height:52, display:'flex', alignItems:'center', gap:8, padding:'0 12px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.03)', flexShrink:0 }}>
        <button onClick={() => setSection(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#7C5CFC', display:'flex', padding:'8px 4px' }}>{IC.back}</button>
        <span style={{ fontWeight:700, fontFamily:'Syne,sans-serif' }}>{SECTIONS.find(s=>s.key===section)?.label}</span>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>{renderSection()}</div>
    </div>
  );

  if (isMobile) return (
    <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.25rem', marginBottom:14, padding:'4px 4px' }}>Настройки</div>
      <Card>
        {SECTIONS.map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 && <Div/>}
            <Row icon={s.icon} label={s.label} onClick={() => setSection(s.key)}/>
          </React.Fragment>
        ))}
      </Card>
    </div>
  );

  // Десктоп - двухколоночный
  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      <div style={{ width:210, borderRight:'1px solid rgba(255,255,255,0.07)', overflowY:'auto', padding:'12px 8px', flexShrink:0, background:'rgba(255,255,255,0.01)' }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.72rem', marginBottom:12, padding:'4px 8px', color:'rgba(240,240,255,0.5)', textTransform:'uppercase', letterSpacing:'.5px' }}>Настройки</div>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, border:'none', cursor:'pointer', background: section===s.key ? 'rgba(124,92,252,0.18)' : 'transparent', color: section===s.key ? '#7C5CFC' : 'rgba(240,240,255,0.65)', marginBottom:2, textAlign:'left', transition:'all .15s', fontWeight: section===s.key ? 700 : 400, fontSize:'0.875rem', fontFamily:'DM Sans,sans-serif' }}>
            <span style={{ display:'inline-flex', flexShrink:0 }}>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
        {section ? (
          <>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.15rem', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ display:'inline-flex', opacity:.7 }}>{SECTIONS.find(s=>s.key===section)?.icon}</span>
              {SECTIONS.find(s=>s.key===section)?.label}
            </div>
            {renderSection()}
          </>
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'rgba(240,240,255,0.15)', flexDirection:'column', gap:10 }}>
            <span style={{ display:'inline-flex', opacity:.5 }}>{IC.general}</span>
            <span style={{ fontSize:'0.9rem' }}>Выберите раздел</span>
          </div>
        )}
      </div>
    </div>
  );
}
