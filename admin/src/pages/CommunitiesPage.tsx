import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../store/adminStore';
import toast from 'react-hot-toast';

export default function CommunitiesPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-communities', page],
    queryFn: () => api.get('/admin/communities', { params: { page } }).then(r => r.data.data),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/communities/${id}`),
    onSuccess: () => { toast.success('Community deleted'); qc.invalidateQueries(['admin-communities']); },
    onError: () => toast.error('Failed to delete'),
  });

  const groups = data?.groups || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  function getInitials(name: string) { return name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Communities</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{total.toLocaleString()} communities</p>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Community</th>
              <th>Owner</th>
              <th>Members</th>
              <th>Type</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No communities found</td></tr>
            ) : groups.map((g: any) => (
              <tr key={g.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {g.avatarUrl
                      ? <img src={g.avatarUrl} alt="" className="avatar" style={{ width: 36, height: 36 }} />
                      : <div className="avatar-initials" style={{ width: 36, height: 36, fontSize: 13, borderRadius: 10 }}>{getInitials(g.name)}</div>}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.description || '—'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 13 }}>{g.owner?.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{g.owner?.username}</div>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>👥 {g.memberCount?.toLocaleString()}</span>
                </td>
                <td>
                  <span className={`badge ${g.isPublic ? 'badge-success' : 'badge-muted'}`}>
                    {g.isPublic ? '🌐 Public' : '🔒 Private'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(g.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => { if (confirm(`Delete community "${g.name}"? This cannot be undone.`)) deleteMutation.mutate(g.id); }}
                  >🗑 Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
