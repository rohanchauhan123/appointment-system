/**
 * Activity Logs Page (Admin Only)
 * View full audit trail
 */
import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import type { ActivityLog } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './ActivityLogs.css';

export default function ActivityLogs() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            const data = await adminApi.getActivityLogs();
            setLogs(data);
        } catch {
            toast.error('Failed to load activity logs');
        } finally {
            setIsLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE':
                return 'action-create';
            case 'UPDATE':
                return 'action-update';
            case 'DELETE':
                return 'action-delete';
            default:
                return '';
        }
    };

    if (isLoading) {
        return <div className="loading">Loading activity logs...</div>;
    }

    return (
        <div className="activity-logs-page">
            <div className="page-header">
                <div>
                    <h1>📋 Activity Logs</h1>
                    <p>{logs.length} total actions recorded</p>
                </div>
            </div>

            <div className="logs-list">
                {logs.map((log) => (
                    <div key={log.id} className="log-item">
                        <div
                            className="log-header"
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                            <div className="log-info">
                                <span className={`action-badge ${getActionColor(log.action)}`}>
                                    {log.action}
                                </span>
                                <span className="agent-name">{log.agent?.name || 'Unknown'}</span>
                                <span className="log-separator">→</span>
                                <span className="appointment-info">
                                    {(log.new_data as { patient_name?: string })?.patient_name || 'N/A'}
                                </span>
                            </div>
                            <div className="log-meta">
                                <span className="log-time">
                                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                                </span>
                                <span className="expand-icon">{expandedLog === log.id ? '▼' : '▶'}</span>
                            </div>
                        </div>

                        {expandedLog === log.id && (
                            <div className="log-details">
                                {log.old_data && (
                                    <div className="data-section">
                                        <h4>Old Data</h4>
                                        <pre>{JSON.stringify(log.old_data, null, 2)}</pre>
                                    </div>
                                )}
                                <div className="data-section">
                                    <h4>New Data</h4>
                                    <pre>{JSON.stringify(log.new_data, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {logs.length === 0 && (
                <div className="empty-state">
                    <p>No activity logs yet.</p>
                </div>
            )}
        </div>
    );
}
