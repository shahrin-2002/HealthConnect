import { useEffect, useState, useContext } from 'react';
import axios from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [form, setForm] = useState(user || {});
  const [msg, setMsg] = useState('');

  useEffect(() => setForm(user || {}), [user]);

  const save = async () => {
    setMsg('');
    try {
      const { data } = await axios.put('/users/me', form);
      setUser(data.user || data);
      setMsg('Profile updated');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Update failed');
    }
  };

  if (!user) return null;

  return (
    <div>
      <h2>My Profile</h2>
      {user.locked && <p style={{ color: 'red' }}>Your profile is locked. You cannot edit.</p>}
      <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} disabled={user.locked} />
      <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} disabled={user.locked} />
      <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} disabled={user.locked} />
      <input value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })} disabled={user.locked} />
      <button onClick={save} disabled={user.locked}>Save</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
