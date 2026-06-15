import React, { useState } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { DailyReport } from './DailyReport';
import { MonthlyReport } from './MonthlyReport';
import { CustomerReport } from './CustomerReport';
import { CashReport } from './CashReport';

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState(null);

  if (activeReport === 'daily') {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="bg-white shadow sticky top-0 z-10">
            <div className="px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
            </div>
          </div>
          <div className="p-6">
            <DailyReport onBack={() => setActiveReport(null)} />
          </div>
        </div>
      </div>
    );
  }

  if (activeReport === 'monthly') {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="bg-white shadow sticky top-0 z-10">
            <div className="px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
            </div>
          </div>
          <div className="p-6">
            <MonthlyReport onBack={() => setActiveReport(null)} />
          </div>
        </div>
      </div>
    );
  }

  if (activeReport === 'customer') {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="bg-white shadow sticky top-0 z-10">
            <div className="px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
            </div>
          </div>
          <div className="p-6">
            <CustomerReport onBack={() => setActiveReport(null)} />
          </div>
        </div>
      </div>
    );
  }

  if (activeReport === 'cash') {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="bg-white shadow sticky top-0 z-10">
            <div className="px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
            </div>
          </div>
          <div className="p-6">
            <CashReport onBack={() => setActiveReport(null)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 shadow-lg sticky top-0 z-10">
          <div className="px-8 py-6">
            <h2 className="text-3xl font-bold text-white">Reports</h2>
            <p className="text-indigo-100 text-sm mt-1">Comprehensive business analytics and insights</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => setActiveReport('daily')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-8 cursor-pointer hover:shadow-xl transition border border-blue-200 hover:border-blue-400"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-5xl">📅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Daily Report</h3>
              <p className="text-sm text-gray-600 mt-3">View today's sales, expenses, and cash summary</p>
              <p className="text-sm text-blue-600 font-semibold mt-4">View Details →</p>
            </div>
            <div
              onClick={() => setActiveReport('monthly')}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-8 cursor-pointer hover:shadow-xl transition border border-green-200 hover:border-green-400"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-5xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Monthly Report</h3>
              <p className="text-sm text-gray-600 mt-3">View this month's financial summary</p>
              <p className="text-sm text-green-600 font-semibold mt-4">View Details →</p>
            </div>
            <div
              onClick={() => setActiveReport('customer')}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-8 cursor-pointer hover:shadow-xl transition border border-purple-200 hover:border-purple-400"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-5xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Customer Report</h3>
              <p className="text-sm text-gray-600 mt-3">View sales and outstanding payments by customer</p>
              <p className="text-sm text-purple-600 font-semibold mt-4">View Details →</p>
            </div>
            <div
              onClick={() => setActiveReport('cash')}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md p-8 cursor-pointer hover:shadow-xl transition border border-orange-200 hover:border-orange-400"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-5xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Cash Report</h3>
              <p className="text-sm text-gray-600 mt-3">View detailed cash in and cash out records</p>
              <p className="text-sm text-orange-600 font-semibold mt-4">View Details →</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
