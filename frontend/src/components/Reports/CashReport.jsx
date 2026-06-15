import React, { useState, useEffect } from 'react';
import { reportAPI } from '../../api/reportAPI';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function CashReport({ onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onBack]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const result = await reportAPI.getCashReport(startDate, endDate);
      setReport(result);
    } catch (error) {
      toast.error('Failed to load cash report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading report...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Cash Report</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          title="Press ESC to go back"
        >
          Back (or press ESC)
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {report && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-semibold">Opening Balance</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(report.opening_balance || 0)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-semibold">Cash In</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(report.total_cash_in || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">{report.cash_in_count || 0} entries</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-semibold">Cash Out</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(report.total_cash_out || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">{report.cash_out_count || 0} entries</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-semibold">Closing Balance</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {formatCurrency(report.closing_balance || 0)}
              </p>
            </div>
          </div>

          {report.details && report.details.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">Cash Entries</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.details.map((entry, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-3 text-sm text-gray-600">{formatDate(entry.date)}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            entry.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {entry.type === 'in' ? 'Cash In' : 'Cash Out'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{entry.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
