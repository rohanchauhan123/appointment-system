/**
 * Dashboard Layout
 * Main layout with sidebar navigation
 */
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>🏥 Diagnostic</h2>
                    <span className="role-badge">{user?.role}</span>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" className="nav-link">
                        📅 Appointments
                    </NavLink>

                    {isAdmin && (
                        <>
                            <NavLink to="/agents" className="nav-link">
                                👥 Agents
                            </NavLink>
                            <NavLink to="/admins" className="nav-link">
                                🛡️ Admins
                            </NavLink>
                            <NavLink to="/activity-logs" className="nav-link">
                                📋 Activity Logs
                            </NavLink>
                            <NavLink to="/export" className="nav-link">
                                📤 Export Data
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-email">{user?.email}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
