import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore, api } from '../store/adminStore';
import toast from 'react-hot-toast';

// Demo credentials for testing without backend
const DEMO_EMAIL = 'admin@bridgechat.app';
const DEMO_PASSWORD = 'Admin@1234';
const DEMO_ADMIN = {
  id: 'demo-admin',
  email: DEMO_EMAIL,
  displayName: 'Brian Melly',
  username: 'brianmelly',
  role: 'ADMIN',
  avatarUrl: null,
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { setAuth } = useAdminStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);

    // Try real API first, fall back to demo credentials
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken } = res.data.data;
      if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
        toast.error('Access denied. Admin role required.');
        return;
      }
      setAuth(accessToken, user);
      navigate('/dashboard');
      toast.success(`Welcome back, ${user.displayName}!`);
    } catch (apiErr: any) {
      // Backend not available — try demo credentials
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        setAuth('demo-token-bridgechat-admin', DEMO_ADMIN);
        navigate('/dashboard');
        toast.success('Welcome back, Brian! (Demo mode)');
        return;
      }
      // Wrong credentials
      const msg = apiErr?.response?.data?.error;
      if (msg) {
        toast.error(msg);
      } else {
        toast.error('Invalid credentials. Try admin@bridgechat.app / Admin@1234');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 50%, #0F3460 100%)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: '10%', left: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,101,132,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, padding: '24px 20px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 18px', boxShadow: '0 12px 32px rgba(108,99,255,0.4)' }}>⬡</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -0.5, margin: 0 }}>BridgeChat Admin</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 8, fontSize: 14, margin: '8px 0 0' }}>Sign in to manage your platform</p>
        </div>

        {/* Card */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: 0.3 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@bridgechat.app"
              required
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(108,99,255,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: 0.3 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '12px 44px 12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(108,99,255,0.6)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18, padding: 0 }}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '14px', background: loading ? 'rgba(108,99,255,0.5)' : 'linear-gradient(135deg, #6C63FF, #9C5FFF)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(108,99,255,0.4)' }}
          >
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>

          {/* Demo credentials hint */}
          <div style={{ textAlign: 'center', padding: '12px 16px', background: 'rgba(108,99,255,0.1)', borderRadius: 10, border: '1px solid rgba(108,99,255,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 6px', letterSpacing: 0.3 }}>DEMO CREDENTIALS</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, fontFamily: 'monospace' }}>admin@bridgechat.app / Admin@1234</p>
            <button type="button" onClick={fillDemo} style={{ marginTop: 8, background: 'rgba(108,99,255,0.3)', border: '1px solid rgba(108,99,255,0.4)', borderRadius: 6, color: '#a78bfa', fontSize: 12, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}>
              Fill credentials
            </button>
          </div>
        </form>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
