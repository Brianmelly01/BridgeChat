import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../store/adminStore';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];

export default function ReportsPage() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', status, page],
    queryFn: () => api.get('/admin/reports', { params: { status, page } }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) => api.put(`/admin/reports/${id}`, { status: newStatus }),
    onSuccess: () => { toast.success('Report updated'); qc.invalidateQueries(['admin-reports']); },
    onError: () => toast.error('Failed to update'),
  });

  const reports = data?.reports || [];
  const totalPages = data?.totalPages || 1;

  const statusColors: Record<string, string> = {
    PENDING: 'badge-warning', REVIEWED: 'badge-primary', RESOLVED: 'badge-success', DISMISSED: 'badge-muted',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Reports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Review user-submitted reports</p>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {STATUS_OPTIONS.map(s => (
          <button key={s} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStatus(s); setPage(1); }}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Reporter</th>
              <th>Reported User</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No {status.toLowerCase()} reports</td></tr>
            ) : reports.map((r: any) => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.reporter?.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{r.reporter?.username}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.target?.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{r.target?.username}</div>
                </td>
                <td style={{ maxWidth: 200 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</div>
                </td>
                <td><span className={`badge ${statusColors[r.status] || 'badge-muted'}`}>{r.status}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {r.status === 'PENDING' && (
                      <>
                        <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', fontSize: 12 }}
                          onClick={() => updateMutation.mutate({ id: r.id, newStatus: 'RESOLVED' })}>✓ Resolve</button>
                        <button className="btn btn-sm btn-ghost" style={{ fontSize: 12 }}
                          onClick={() => updateMutation.mutate({ id: r.id, newStatus: 'DISMISSED' })}>✗ Dismiss</button>
                      </>
                    )}
                    {r.status !== 'PENDING' && (
                      <button className="btn btn-sm btn-ghost" style={{ fontSize: 12 }}
                        onClick={() => updateMutation.mutate({ id: r.id, newStatus: 'PENDING' })}>Reopen</button>
                    )}
                  </div>
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
