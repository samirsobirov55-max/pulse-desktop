import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function Stories() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    if (!viewing) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { setViewing(null); return 0; }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [viewing?._id]);

  const loadStories = async () => {
    try { const { data } = await axios.get('/stories'); setStories(data); } catch {}
  };

  // Group by author
  const grouped = stories.reduce((acc, s) => {
    const key = s.author._id;
    if (!acc[key]) acc[key] = { author: s.author, stories: [] };
    acc[key].stories.push(s);
    return acc;
  }, {});

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 20 }}>📖 Истории</h2>

      {/* Add story */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', border: '2px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>+</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Добавить</span>
        </div>

        {Object.values(grouped).map(({ author, stories: authorStories }) => (
          <div key={author._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }} onClick={() => setViewing(authorStories[0])}>
            <div className="story-ring" style={{ width: 64, height: 64, padding: 3 }}>
              <div className="avatar" style={{ width: '100%', height: '100%', fontSize: '1.2rem', background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}>
                {author.nickname?.charAt(0)}
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: 64, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{author.nickname}</span>
          </div>
        ))}
      </div>

      {stories.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>📖</div>
          <div>Нет историй</div>
        </div>
      )}

      {/* Story viewer modal */}
      {viewing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewing(null)}>
          <div style={{ width: '100%', maxWidth: 380, position: 'relative' }} onClick={e => e.stopPropagation()}>
            {/* Progress bar */}
            <div style={{ position: 'absolute', top: -8, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#fff', borderRadius: 3, transition: '0.1s linear' }} />
            </div>

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.9rem', background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}>
                {viewing.author?.nickname?.charAt(0)}
              </div>
              <span style={{ fontWeight: 600, color: '#fff' }}>{viewing.author?.nickname}</span>
            </div>

            {/* Content */}
            <div style={{ background: 'var(--glass)', borderRadius: 20, minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              {viewing.type === 'text' ? (
                <p style={{ fontSize: '1.2rem', textAlign: 'center', color: '#fff' }}>{viewing.content}</p>
              ) : viewing.mediaUrl ? (
                <img src={viewing.mediaUrl} alt="" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 12, objectFit: 'cover' }} />
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>История</div>
              )}
            </div>

            {/* Reactions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
              {['❤️','😂','😮','🔥','👏'].map(emoji => (
                <span key={emoji} style={{ fontSize: '1.5rem', cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', transition: '0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>{emoji}</span>
              ))}
            </div>

            <button style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setViewing(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
