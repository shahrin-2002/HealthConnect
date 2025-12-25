import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/documents');
      setPending(data.documents || []);
    } catch {
      setMsg('Failed to load pending documents');
    }
  };

  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    await api.patch(`/admin/documents/${id}/verify`);
    load();
  };

  const reject = async (id) => {
    const notes = prompt('Rejection reason?') || '';
    await api.patch(`/admin/documents/${id}/reject`, { notes });
    load();
  };

  const lockUser = async (userId) => {
    await api.patch(`/admin/users/${userId}/lock`);
    setMsg('User locked');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Admin Dashboard</h2>
        <ul>
          {pending.map(d => (
            <li key={d._id}>
              {d.user?.name} – {d.originalName} – {d.verified ? '✅ Verified' : '⏳ Pending'} –
              <a href={`/api/documents/preview/${d.filename}`} target="_blank" rel="noreferrer">Preview</a>
              {!d.verified && (
                <>
                  <button onClick={() => verify(d._id)}>Verify</button>
                  <button onClick={() => reject(d._id)}>Reject</button>
                </>
              )}
              <button onClick={() => lockUser(d.user?._id)}>Lock User</button>
            </li>
          ))}
        </ul>
        {msg && <p>{msg}</p>}
      </div>
    </div>
  );
}
