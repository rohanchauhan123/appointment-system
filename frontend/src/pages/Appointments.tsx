/**
 * Appointments Page
 * Main view for managing appointments with search, filters, and pagination
 */
import { useState, useEffect } from 'react';
import { appointmentsApi, adminApi } from '../services/api';
import type { Appointment, CreateAppointmentData } from '../services/api';
import { socketService } from '../services/socket';
import type { SocketEvent } from '../services/socket';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './Appointments.css';

export default function Appointments() {
    // Pagination & Filter State
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Default to today's date for filter
    const todayStr = new Date().toISOString().split('T')[0];
    const [dateFilter, setDateFilter] = useState(todayStr);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ text: string; type: 'name' | 'phone' }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Admin Agent Assignment State
    const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [formData, setFormData] = useState<CreateAppointmentData>({
        patient_name: '',
        test_name: '',
        branch_location: '',
        appointment_date: '',
        amount: 0,
        advance_amount: 0,
        pro_details: '',
        contact_number: '',
        agent_id: '',
    });

    // Check admin status and fetch agents
    useEffect(() => {
        const checkAdminAndFetchAgents = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role === 'admin') {
                    setIsAdmin(true);
                    try {
                        const agentsList = await adminApi.getAgents();
                        setAgents(agentsList);
                    } catch (err) {
                        console.error('Failed to fetch agents', err);
                    }
                }
            }
        };
        checkAdminAndFetchAgents();
    }, []);

    // Debounced search suggestions
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                try {
                    const results = await appointmentsApi.getSuggestions(searchQuery);
                    setSuggestions(results);
                    if (results.length > 0) setShowSuggestions(true);
                } catch {
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load appointments when page or date filter changes
    useEffect(() => {
        loadAppointments();
    }, [page, dateFilter]);

    // Subscribe to real-time updates
    useEffect(() => {
        const unsubCreate = socketService.subscribe('appointment_created', (event: SocketEvent) => {
            loadAppointments();
            toast.success(`New appointment created: ${event.data.patient_name}`);
        });

        const unsubUpdate = socketService.subscribe('appointment_updated', (event: SocketEvent) => {
            setAppointments((prev) =>
                prev.map((apt) => (apt.id === event.data.id ? event.data : apt))
            );
            toast.success(`Appointment updated: ${event.data.patient_name}`);
        });

        const unsubDelete = socketService.subscribe('appointment_deleted', (event: SocketEvent) => {
            setAppointments((prev) => prev.filter((apt) => apt.id !== event.data.id));
            toast.success('An appointment was deleted');
        });

        return () => {
            unsubCreate();
            unsubUpdate();
            unsubDelete();
        };
    }, []);

    const loadAppointments = async () => {
        setIsLoading(true);
        try {
            const params: any = { page, limit };

            if (dateFilter) {
                params.startDate = new Date(dateFilter + 'T00:00:00').toISOString();
                params.endDate = new Date(dateFilter + 'T23:59:59').toISOString();
            }

            if (searchQuery) {
                params.search = searchQuery;
            }

            const response: any = await appointmentsApi.getAll(params);

            if (Array.isArray(response)) {
                setAppointments(response);
                setTotal(response.length);
                setTotalPages(1);
            } else if (response && Array.isArray(response.data)) {
                setAppointments(response.data);
                setTotal(response.total || response.data.length);
                setTotalPages(response.totalPages || 1);
            } else {
                setAppointments([]);
            }
        } catch {
            toast.error('Failed to load appointments');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        setShowSuggestions(false);
        setPage(1);
        if (dateFilter) {
            setDateFilter('');
        } else {
            loadAppointments();
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearchQuery(suggestion);
        setShowSuggestions(false);
        setPage(1);
        setDateFilter('');
    };

    const clearFilters = () => {
        setSearchQuery('');
        setDateFilter('');
        setPage(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAppointment) {
                // Remove agent_id from update payload if it's empty to avoid issues
                const payload = { ...formData };
                if (!payload.agent_id) delete payload.agent_id;

                await appointmentsApi.update(editingAppointment.id, payload);
                toast.success('Appointment updated!');
            } else {
                const payload = { ...formData };
                if (!payload.agent_id) delete payload.agent_id;

                await appointmentsApi.create(payload);
                toast.success('Appointment created!');
            }
            closeModal();
            loadAppointments();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const openCreateModal = () => {
        setEditingAppointment(null);
        setFormData({
            patient_name: '',
            test_name: '',
            branch_location: '',
            appointment_date: new Date().toISOString().slice(0, 16),
            amount: 0,
            advance_amount: 0,
            pro_details: '',
            contact_number: '',
            agent_id: '',
        });
        setShowModal(true);
    };

    const openEditModal = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setFormData({
            patient_name: appointment.patient_name,
            test_name: appointment.test_name,
            branch_location: appointment.branch_location,
            appointment_date: appointment.appointment_date.slice(0, 16),
            amount: appointment.amount,
            advance_amount: appointment.advance_amount,
            pro_details: appointment.pro_details || '',
            contact_number: appointment.contact_number,
            agent_id: appointment.agent?.id || '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAppointment(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const calculatedBalance = formData.amount - (formData.advance_amount || 0);

    return (
        <div className="appointments-page">
            <div className="page-header">
                <div>
                    <h1>📅 Appointments</h1>
                    <p>{total} total appointments found</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary">
                    + New Appointment
                </button>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search patient or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                            onFocus={() => {
                                if (suggestions.length > 0) setShowSuggestions(true);
                            }}
                            onBlur={() => {
                                setTimeout(() => setShowSuggestions(false), 200);
                            }}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="suggestions-dropdown">
                                {suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        className="suggestion-item"
                                        onMouseDown={() => handleSuggestionClick(s.text)}
                                    >
                                        <span className="suggestion-icon">{s.type === 'name' ? '👤' : '📞'}</span>
                                        {s.text}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                <div className="date-filter">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => {
                            setDateFilter(e.target.value);
                            setPage(1);
                        }}
                        className="date-input"
                    />
                    {dateFilter && (
                        <button onClick={() => setDateFilter('')} className="btn-text" title="Clear Date">
                            ✖
                        </button>
                    )}
                </div>

                <button onClick={clearFilters} className="btn-secondary btn-sm">
                    Reset Filters
                </button>
            </div>

            <div className="table-container">
                {isLoading ? (
                    <div className="loading">Loading appointments...</div>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Patient Name</th>
                                    <th>Test</th>
                                    <th>Branch</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Advance</th>
                                    <th>Balance</th>
                                    <th>Contact</th>
                                    <th>Agent</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((apt) => (
                                    <tr key={apt.id}>
                                        <td className="patient-name">{apt.patient_name}</td>
                                        <td>{apt.test_name}</td>
                                        <td>{apt.branch_location}</td>
                                        <td>{format(new Date(apt.appointment_date), 'MMM dd, yyyy HH:mm')}</td>
                                        <td className="amount">₹{apt.amount}</td>
                                        <td className="amount">₹{apt.advance_amount}</td>
                                        <td className="balance">₹{apt.balance_amount}</td>
                                        <td>{apt.contact_number}</td>
                                        <td>{apt.agent?.name || 'N/A'}</td>
                                        <td>
                                            <button onClick={() => openEditModal(apt)} className="btn-edit">
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {appointments.length === 0 && (
                            <div className="empty-state">
                                <p>No appointments match your filters.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="btn-pagination"
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="btn-pagination"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingAppointment ? 'Edit Appointment' : 'New Appointment'}</h2>
                        <form onSubmit={handleSubmit}>
                            {/* Agent Selection for Admins */}
                            {isAdmin && !editingAppointment && (
                                <div className="form-group">
                                    <label>Assign to Agent</label>
                                    <select
                                        name="agent_id"
                                        value={formData.agent_id || ''}
                                        onChange={handleInputChange}
                                        className="select-input"
                                    >
                                        <option value="">Assign to me (Self)</option>
                                        {agents.map((agent) => (
                                            <option key={agent.id} value={agent.id}>
                                                {agent.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Patient Name *</label>
                                    <input
                                        name="patient_name"
                                        value={formData.patient_name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Number *</label>
                                    <input
                                        name="contact_number"
                                        value={formData.contact_number}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Test Name *</label>
                                    <input
                                        name="test_name"
                                        value={formData.test_name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Branch Location *</label>
                                    <input
                                        name="branch_location"
                                        value={formData.branch_location}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Appointment Date *</label>
                                <input
                                    type="datetime-local"
                                    name="appointment_date"
                                    value={formData.appointment_date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Amount (₹) *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Advance (₹)</label>
                                    <input
                                        type="number"
                                        name="advance_amount"
                                        value={formData.advance_amount}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Balance (₹)</label>
                                    <input
                                        type="number"
                                        value={calculatedBalance}
                                        disabled
                                        className="balance-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Pro Details</label>
                                <textarea
                                    name="pro_details"
                                    value={formData.pro_details}
                                    onChange={handleInputChange}
                                    rows={3}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingAppointment ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
