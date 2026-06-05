import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore, api } from '../store/adminStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAdminStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken } = res.data.data;
      if (!['ADMIN', 'MODERATOR'].includes(user.role)) { toast.error('Access denied. Admin role required.'); return; }
      setAuth(accessToken, user);
      navigate('/dashboard');
      toast.success(`Welcome back, ${user.displayName}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0A0A0F, #1A1A2E, #0F3460)' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }}>⬡</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>BridgeChat Admin</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Sign in to manage your platform</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 28, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bridgechat.app" className="input" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
