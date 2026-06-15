import React, { useState, useEffect } from 'react';
import { reportAPI } from '../../api/reportAPI';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function DailyReport({ onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReport();
  }, [selectedDate]);

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
      const result = await reportAPI.getDailyReport(selectedDate);
      setReport(result);
    } catch (error) {
      toast.error('Failed to load daily report');
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
        <h2 className="text-2xl font-bold text-gray-900">Daily Report</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          title="Press ESC to go back"
        >
          Back (or press ESC)
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 font-semibold">Total Sales</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(report.sales_summary?.total_sales || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {report.sales_summary?.count || 0} transactions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 font-semibold">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {formatCurrency(report.expense_summary?.total_expenses || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {report.expense_summary?.count || 0} expenses
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 font-semibold">Cash In</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {formatCurrency(report.cash_summary?.cash_in || 0)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 font-semibold">Cash Out</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {formatCurrency(report.cash_summary?.cash_out || 0)}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
        <div className="space-y-3">
          {report && Object.entries(report.summary || {}).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
