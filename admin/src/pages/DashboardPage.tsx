import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api } from '../store/adminStore';

const mockChartData = Array.from({ length: 14 }, (_, i) => ({
  day: `Jun ${i + 1}`,
  messages: Math.floor(Math.random() * 5000) + 1000,
  users: Math.floor(Math.random() * 200) + 50,
}));

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const stats = data || { totalUsers: 0, activeUsers: 0, totalMessages: 0, todayMessages: 0, todayUsers: 0, pendingReports: 0 };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers?.toLocaleString(), icon: '👥', color: '#6C63FF', bg: 'rgba(108,99,255,0.1)', sub: `+${stats.todayUsers} today` },
    { label: 'Online Now', value: stats.activeUsers?.toLocaleString(), icon: '🟢', color: '#10B981', bg: 'rgba(16,185,129,0.1)', sub: 'Active users' },
    { label: 'Messages Today', value: stats.todayMessages?.toLocaleString(), icon: '💬', color: '#FF6584', bg: 'rgba(255,101,132,0.1)', sub: `${stats.totalMessages?.toLocaleString()} total` },
    { label: 'Pending Reports', value: stats.pendingReports?.toLocaleString(), icon: '🚨', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', sub: 'Needs review' },
  ];

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Real-time platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-4">
        {statCards.map(card => (
          <div key={card.label} className="stat-card">
            <div>
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-sub">{card.sub}</div>
            </div>
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>📈 Message Activity (14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13 }} />
              <Area type="monotone" dataKey="messages" stroke="#6C63FF" strokeWidth={2} fill="url(#colorMsg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>👤 New Users (14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13 }} />
              <Bar dataKey="users" fill="#FF6584" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚡ Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: '🔍 Review Reports', color: '#F59E0B' },
            { label: '📢 Send Announcement', color: '#6C63FF' },
            { label: '📊 Export Data', color: '#10B981' },
            { label: '🔒 Security Audit', color: '#FF6584' },
          ].map(a => (
            <button key={a.label} className="btn btn-ghost" style={{ fontSize: 13 }}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
