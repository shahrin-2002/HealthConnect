import { useEffect, useState } from 'react';
import axios from '../services/api';

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const { data } = await axios.get('/admin/documents');
      setPending(data);
    } catch {
      setMsg('Failed to load pending documents');
    }
  };

  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    await axios.patch(`/admin/documents/${id}/verify`);
    load();
  };

  const reject = async (id) => {
    const notes = prompt('Rejection reason?') || '';
    await axios.patch(`/admin/documents/${id}/reject`, { notes });
    load();
  };

  const lockUser = async (userId) => {
    await axios.patch(`/admin/users/${userId}/lock`);
    setMsg('User locked');
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <ul>
        {pending.map(d => (
          <li key={d._id}>
            {d.user?.name} - {d.type} - {d.status} -
            <a href={`/api/documents/preview/${d.filename}`} target="_blank" rel="noreferrer">Preview</a>
            <button onClick={() => verify(d._id)}>Verify</button>
            <button onClick={() => reject(d._id)}>Reject</button>
            <button onClick={() => lockUser(d.user?._id)}>Lock User</button>
          </li>
        ))}
      </ul>
      {msg && <p>{msg}</p>}
    </div>
  );
}
