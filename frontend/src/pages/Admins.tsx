/**
 * Admins Management Page (Admin Only)
 * Create and manage admin users
 */
import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import type { User, CreateAgentData } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './Agents.css'; // Reusing Agents CSS

export default function Admins() {
    const [admins, setAdmins] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<CreateAgentData>({
        name: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            const data = await adminApi.getAdmins();
            setAdmins(data);
        } catch {
            toast.error('Failed to load admins');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createAdmin(formData);
            toast.success('Admin created successfully!');
            setShowModal(false);
            setFormData({ name: '', email: '', password: '' });
            loadAdmins();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to create admin');
        }
    };

    if (isLoading) {
        return <div className="loading">Loading admins...</div>;
    }

    return (
        <div className="agents-page">
            <div className="page-header">
                <div>
                    <h1>🛡️ Admins</h1>
                    <p>{admins.length} admins registered</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    + Add Admin
                </button>
            </div>

            <div className="agents-grid">
                {admins.map((admin) => (
                    <div key={admin.id} className="agent-card">
                        <div className="agent-header">
                            <div className="agent-avatar" style={{ background: '#6366f1' }}>
                                {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="agent-info">
                                <h3>{admin.name}</h3>
                                <p>{admin.email}</p>
                            </div>
                        </div>
                        <div className="agent-meta">
                            <span className="status-badge active">Active</span>
                            <span className="created-date">
                                Created: {format(new Date(admin.created_at), 'MMM dd, yyyy')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Admin Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Admin</h2>
                        <p style={{ marginBottom: '1rem', color: '#666' }}>
                            Admins have full access to the system.
                        </p>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Admin Name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
