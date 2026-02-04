/**
 * Export Page (Admin Only)
 * Export appointments to CSV with email option
 */
import { useState } from 'react';
import { adminApi } from '../services/api';
import toast from 'react-hot-toast';
import './Export.css';

export default function Export() {
    const [recipients, setRecipients] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleExportEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailList = recipients
            .split(',')
            .map((email) => email.trim())
            .filter((email) => email);

        if (emailList.length === 0) {
            toast.error('Please enter at least one email address');
            return;
        }

        setIsLoading(true);
        try {
            const result = await adminApi.exportToEmail(
                emailList,
                startDate || undefined,
                endDate || undefined
            );
            toast.success(`Report sent to ${result.sentTo.length} recipient(s) with ${result.count} appointments`);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to export');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadCsv = async () => {
        setIsLoading(true);
        try {
            const blob = await adminApi.downloadCsv(
                startDate || undefined,
                endDate || undefined
            );

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `appointments_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success('CSV downloaded successfully');
        } catch {
            toast.error('Failed to download CSV');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="export-page">
            <div className="page-header">
                <div>
                    <h1>📤 Export Data</h1>
                    <p>Export appointments to CSV or send via email</p>
                </div>
            </div>

            <div className="export-container">
                {/* Date Filters */}
                <div className="export-card">
                    <h3>📅 Date Range (Optional)</h3>
                    <p className="card-description">Leave empty to export all appointments</p>
                    <div className="date-filters">
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Download CSV */}
                <div className="export-card">
                    <h3>💾 Download CSV</h3>
                    <p className="card-description">Download appointments directly to your computer</p>
                    <button
                        onClick={handleDownloadCsv}
                        className="btn-primary btn-large"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Downloading...' : 'Download CSV File'}
                    </button>
                </div>

                {/* Email Export */}
                <div className="export-card">
                    <h3>📧 Send via Email</h3>
                    <p className="card-description">
                        Enter email addresses separated by commas. The CSV will be sent as an attachment.
                    </p>
                    <form onSubmit={handleExportEmail}>
                        <div className="form-group">
                            <label>Email Recipients *</label>
                            <textarea
                                value={recipients}
                                onChange={(e) => setRecipients(e.target.value)}
                                placeholder="email1@example.com, email2@example.com, email3@example.com"
                                rows={3}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-primary btn-large"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send CSV via Email'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
