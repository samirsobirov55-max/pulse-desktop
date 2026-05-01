import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nickname:'', username:'', password:'', confirm:'' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const [twoFA, setTwoFA]       = useState('');
  const [needTwoFA, setNeedTwoFA] = useState(false);

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      if (mode === 'login') {
        if (!form.username.trim() || !form.password) return setErr('Заполните все поля');
        await login(form.username.trim(), form.password, needTwoFA ? twoFA : undefined);
      } else {
        if (!form.nickname.trim() || !form.username.trim() || !form.password) return setErr('Заполните все поля');
        if (form.password !== form.confirm) return setErr('Пароли не совпадают');
        if (form.password.length < 6) return setErr('Пароль минимум 6 символов');
        await register(form.nickname.trim(), form.username.trim(), form.password);
      }
      navigate('/');
    } catch(e) {
      if (e.frozen) { setErr(''); return; }
      if (e.response?.data?.twoFA) { setNeedTwoFA(true); setLoading(false); return; }
      setErr(e.response?.data?.message || 'Ошибка сети');
    } finally { setLoading(false); }
  };

  const inp = (placeholder, key, type='text') => (
    <input value={form[key]} onChange={e=>set(key,e.target.value)}
      onKeyDown={e=>e.key==='Enter'&&submit()}
      placeholder={placeholder} type={type} className="input"
      style={{ width:'100%', marginBottom:12, fontSize:'1rem', padding:'14px 16px' }} />
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#050510,#0d0d2b)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:72, height:72, borderRadius:24, background:'linear-gradient(135deg,#7C5CFC,#FC5CA8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 0 40px rgba(124,92,252,0.5)', fontSize:'2rem' }}>⚡</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:900, fontSize:'2.2rem', background:'linear-gradient(135deg,#7C5CFC,#FC5CA8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:4 }}>Pulse</div>
          <div style={{ color:'rgba(240,240,255,0.4)', fontSize:'0.9rem' }}>Мессенджер нового поколения</div>
        </div>

        <div className="glass-strong" style={{ borderRadius:24, padding:'28px 24px' }}>
          <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:14, padding:4, marginBottom:24 }}>
            {[['login','Войти'],['register','Регистрация']].map(([k,l])=>(
              <button key={k} onClick={()=>{setMode(k);setErr('');}} style={{ flex:1, padding:'10px', borderRadius:11, border:'none', cursor:'pointer', background:mode===k?'var(--accent)':'transparent', color:mode===k?'#fff':'rgba(240,240,255,0.4)', fontWeight:mode===k?700:400, fontSize:'0.9rem', transition:'all 0.2s' }}>{l}</button>
            ))}
          </div>

          {mode==='register' && inp('Имя','nickname')}
          {inp('Username или @username','username')}
          {inp('Пароль','password','password')}
          {mode==='register' && inp('Повторите пароль','confirm','password')}

          {needTwoFA && (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:'.8rem',color:'rgba(240,240,255,.5)',marginBottom:6,textAlign:'center'}}>
                🔐 Введите код двухфакторной аутентификации
              </div>
              <input value={twoFA} onChange={e=>setTwoFA(e.target.value)}
                placeholder="Код 2FA" type="password" className="input"
                style={{width:'100%',marginBottom:0,fontSize:'1rem',padding:'14px 16px'}}/>
            </div>
          )}
          {err && <div style={{ background:'rgba(239,68,68,0.15)', color:'#f87171', borderRadius:12, padding:'10px 14px', marginBottom:14, fontSize:'0.875rem', textAlign:'center' }}>{err}</div>}

          <button onClick={submit} disabled={loading} style={{ width:'100%', padding:'14px', borderRadius:16, border:'none', cursor:loading?'not-allowed':'pointer', background:'linear-gradient(135deg,#7C5CFC,#FC5CA8)', color:'#fff', fontWeight:700, fontSize:'1rem', fontFamily:'Syne,sans-serif', opacity:loading?0.7:1, boxShadow:'0 4px 24px rgba(124,92,252,0.4)' }}>
            {loading ? 'Загрузка...' : mode==='login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;900&display=swap');`}</style>
    </div>
  );
}
