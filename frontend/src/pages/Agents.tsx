/**
 * Agents Management Page (Admin Only)
 * Create and manage agents
 */
import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import type { User, CreateAgentData } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './Agents.css';

export default function Agents() {
    const [agents, setAgents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<CreateAgentData>({
        name: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            const data = await adminApi.getAgents();
            setAgents(data);
        } catch {
            toast.error('Failed to load agents');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createAgent(formData);
            toast.success('Agent created successfully!');
            setShowModal(false);
            setFormData({ name: '', email: '', password: '' });
            loadAgents();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to create agent');
        }
    };

    const toggleStatus = async (agent: User) => {
        try {
            await adminApi.updateAgentStatus(agent.id, !agent.is_active);
            toast.success(`Agent ${agent.is_active ? 'deactivated' : 'activated'}`);
            setAgents((prev) =>
                prev.map((a) => (a.id === agent.id ? { ...a, is_active: !a.is_active } : a))
            );
        } catch {
            toast.error('Failed to update agent status');
        }
    };

    if (isLoading) {
        return <div className="loading">Loading agents...</div>;
    }

    return (
        <div className="agents-page">
            <div className="page-header">
                <div>
                    <h1>👥 Agents</h1>
                    <p>{agents.length} agents registered</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    + Add Agent
                </button>
            </div>

            <div className="agents-grid">
                {agents.map((agent) => (
                    <div key={agent.id} className={`agent-card ${!agent.is_active ? 'inactive' : ''}`}>
                        <div className="agent-header">
                            <div className="agent-avatar">
                                {agent.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="agent-info">
                                <h3>{agent.name}</h3>
                                <p>{agent.email}</p>
                            </div>
                        </div>
                        <div className="agent-meta">
                            <span className={`status-badge ${agent.is_active ? 'active' : 'inactive'}`}>
                                {agent.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="created-date">
                                Created: {format(new Date(agent.created_at), 'MMM dd, yyyy')}
                            </span>
                        </div>
                        <div className="agent-actions">
                            <button
                                onClick={() => toggleStatus(agent)}
                                className={agent.is_active ? 'btn-deactivate' : 'btn-activate'}
                            >
                                {agent.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {agents.length === 0 && (
                <div className="empty-state">
                    <p>No agents yet. Create your first agent!</p>
                </div>
            )}

            {/* Create Agent Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Agent</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
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
                                    Create Agent
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
