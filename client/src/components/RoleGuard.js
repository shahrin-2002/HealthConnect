import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function RoleGuard({ role, children }) {
  const { user } = useContext(AuthContext);
  return user?.role === role ? children : <div>Access denied</div>;
}
