import { useEffect, useState, useContext } from 'react';
import axios from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Documents() {
  const { user } = useContext(AuthContext);
  const [list, setList] = useState([]);
  const [type, setType] = useState('NID');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const { data } = await axios.get('/users/me');
      setList(data.documents || []);
    } catch {
      setMsg('Failed to load documents');
    }
  };

  useEffect(() => { load(); }, []);

  const upload = async () => {
    setMsg('');
    if (!file) return setMsg('Select a file first');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      await axios.post('/documents', formData);
      setFile(null);
      load();
      setMsg('Uploaded');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Upload failed');
    }
  };

  const remove = async (id) => {
    setMsg('');
    try {
      await axios.delete(`/documents/${id}`);
      load();
      setMsg('Deleted');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <h2>My Documents</h2>
      <select value={type} onChange={e => setType(e.target.value)} disabled={user?.locked}>
        <option>NID</option>
        <option>Passport</option>
        <option>License</option>
      </select>
      <input type="file" onChange={e => setFile(e.target.files[0])} disabled={user?.locked} />
      <button onClick={upload} disabled={user?.locked}>Upload</button>

      <ul>
        {list.map(doc => (
          <li key={doc._id || doc.id}>
            {doc.type} - {doc.status} -
            <a href={`/api/documents/preview/${doc.filename}`} target="_blank" rel="noreferrer">Preview</a>
            <button onClick={() => remove(doc._id || doc.id)} disabled={user?.locked || doc.status === 'verified'}>Delete</button>
          </li>
        ))}
      </ul>

      {msg && <p>{msg}</p>}
    </div>
  );
}
