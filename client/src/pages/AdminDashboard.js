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
            <div style={{ marginTop: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button
                className="btn-submit"
                style={{ padding: '15px 25px', backgroundColor: '#3498db', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => navigate('/admin/lab-tests')}
              >
                🧪 Manage Tests
              </button>
              <button
                className="btn-submit"
                style={{ padding: '15px 25px', backgroundColor: '#e67e22', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => navigate('/admin/lab-tests')}
              >
                📋 Manage Bookings
              </button>
              <button
                className="btn-submit"
                style={{ padding: '15px 25px', backgroundColor: '#27ae60', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => navigate('/admin/lab-tests')}
              >
                🏠 Home Collections
              </button>
              <button
                className="btn-submit"
                style={{ padding: '15px 25px', backgroundColor: '#8e44ad', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => navigate('/admin/medicine-orders')}
              >
                💊 Medicine Orders
              </button>
            </div>
            <p style={{ marginTop: '20px', color: '#666' }}>Hospital and Doctor management coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
