import React, { useEffect, useState } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { dashboardAPI } from '../../api/dashboardAPI';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

function Dashboard() {
  const [summary, setSummary] = useState({
    today_sales: { count: 0, total: 0 },
    today_expenses: { count: 0, total: 0 },
    cash_in_hand: 0,
    outstanding_payments: 0,
    today_profit_loss: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await dashboardAPI.getTodaysSummary();
      console.log('[Dashboard] Received data:', data);
      setSummary(data || {
        today_sales: { count: 0, total: 0 },
        today_expenses: { count: 0, total: 0 },
        cash_in_hand: 0,
        outstanding_payments: 0,
        today_profit_loss: 0,
      });
      console.log('[Dashboard] Set summary:', data);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold text-white">Dashboard</h2>
              <p className="text-blue-100 text-sm mt-1">Welcome back! Here's your business summary</p>
            </div>
            <button
              onClick={fetchSummary}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition shadow-md"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Today's Sales Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md hover:shadow-lg transition p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-green-700 text-sm font-semibold mb-1">Today's Sales</p>
                  <p className="text-4xl font-bold text-green-600">
                    {formatCurrency(summary?.today_sales?.total || 0)}
                  </p>
                  <p className="text-xs text-green-600 mt-3">
                    📊 {summary?.today_sales?.count || 0} transactions
                  </p>
                </div>
                <span className="text-4xl">💰</span>
              </div>
            </div>

            {/* Today's Expenses Card */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md hover:shadow-lg transition p-6 border-l-4 border-red-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-red-700 text-sm font-semibold mb-1">Today's Expenses</p>
                  <p className="text-4xl font-bold text-red-600">
                    {formatCurrency(summary?.today_expenses?.total || 0)}
                  </p>
                  <p className="text-xs text-red-600 mt-3">
                    📝 {summary?.today_expenses?.count || 0} entries
                  </p>
                </div>
                <span className="text-4xl">💸</span>
              </div>
            </div>

            {/* Cash in Hand Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md hover:shadow-lg transition p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-blue-700 text-sm font-semibold mb-1">Cash in Hand</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {formatCurrency(summary?.cash_in_hand || 0)}
                  </p>
                  <p className="text-xs text-blue-600 mt-3">💵 Available</p>
                </div>
                <span className="text-4xl">🏦</span>
              </div>
            </div>

            {/* Pending Payments Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md hover:shadow-lg transition p-6 border-l-4 border-orange-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-orange-700 text-sm font-semibold mb-1">Pending Payments</p>
                  <p className="text-4xl font-bold text-orange-600">
                    {formatCurrency(summary?.outstanding_payments || 0)}
                  </p>
                  <p className="text-xs text-orange-600 mt-3">⏳ To be received</p>
                </div>
                <span className="text-4xl">⚠️</span>
              </div>
            </div>
          </div>

          {/* Profit/Loss Section */}
          <div className={`bg-gradient-to-br rounded-xl shadow-md p-8 border-l-4 ${
            (summary?.today_profit_loss || 0) >= 0
              ? 'from-emerald-50 to-emerald-100 border-emerald-500'
              : 'from-rose-50 to-rose-100 border-rose-500'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-sm font-semibold mb-2 ${
                  (summary?.today_profit_loss || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  Today's Profit/Loss
                </p>
                <p className={`text-5xl font-bold ${
                  (summary?.today_profit_loss || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {formatCurrency(summary?.today_profit_loss || 0)}
                </p>
              </div>
              <span className="text-6xl">
                {(summary?.today_profit_loss || 0) >= 0 ? '📈' : '📉'}
              </span>
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600 text-sm">Total Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency((summary?.today_sales?.total || 0) + (summary?.cash_in_hand || 0))}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600 text-sm">Net Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(Math.max(0, (summary?.today_profit_loss || 0)))}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600 text-sm">Items to Collect</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(summary?.outstanding_payments || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
