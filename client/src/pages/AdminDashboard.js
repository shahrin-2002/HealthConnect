import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <button className="hamburger-menu">☰</button>
        <h1>HealthConnect</h1>
        <div></div>
      </div>

      <nav className="auth-nav">
        <div className="nav-logo">
          <span>🏥</span>
        </div>
        <ul className="nav-links">
          <li><a href="/hospitals">Hospitals</a></li>
          <li><a href="/doctors">Doctors</a></li>
        </ul>
        <div className="nav-buttons">
          <button className="btn-dark" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="auth-content">
        <div className="auth-card">
          <h2>Admin Dashboard</h2>
          {user && (
            <div style={{ marginTop: '20px' }}>
              <p><strong>Welcome,</strong> {user.name}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          )}
          <div style={{ marginTop: '30px' }}>
            <h3>Admin Features</h3>
            <p>Hospital and Doctor management coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
