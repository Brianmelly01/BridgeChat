import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../store/adminStore';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page, filter],
    queryFn: () => api.get('/admin/users', { params: { q: search || undefined, page, isBanned: filter === 'banned' ? true : filter === 'active' ? false : undefined } }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const banMutation = useMutation({
    mutationFn: ({ id, ban }: { id: string; ban: boolean }) => api.put(`/admin/users/${id}/${ban ? 'ban' : 'unban'}`),
    onSuccess: (_, { ban }) => { toast.success(ban ? 'User banned' : 'User unbanned'); qc.invalidateQueries(['admin-users']); },
    onError: () => toast.error('Action failed'),
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  function getInitials(name: string) { return name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Users</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input className="input" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, email, username..." />
        </div>
        {['all', 'active', 'banned'].map(f => (
          <button key={f} className={`btn ${filter === f || (f === 'all' && !filter) ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}`} onClick={() => { setFilter(f === 'all' ? '' : f); setPage(1); }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} alt="" className="avatar" style={{ width: 36, height: 36 }} />
                      : <div className="avatar-initials" style={{ width: 36, height: 36, fontSize: 13 }}>{getInitials(u.displayName)}</div>}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{u.displayName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td>{u.email || '—'}</td>
                <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : u.role === 'MODERATOR' ? 'badge-warning' : 'badge-muted'}`}>{u.role}</span></td>
                <td><span className={`badge ${u.isBanned ? 'badge-error' : 'badge-success'}`}>● {u.isBanned ? 'Banned' : 'Active'}</span></td>
                <td style={{ fontSize: 13 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className={`btn btn-sm ${u.isBanned ? 'btn-ghost' : 'btn-danger'}`}
                    onClick={() => { if (confirm(`${u.isBanned ? 'Unban' : 'Ban'} ${u.displayName}?`)) banMutation.mutate({ id: u.id, ban: !u.isBanned }); }}
                  >{u.isBanned ? 'Unban' : 'Ban'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      </div>
    </div>
  );
}
