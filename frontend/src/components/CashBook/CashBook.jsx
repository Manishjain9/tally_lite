import React from 'react';
import { Sidebar } from '../Layout/Sidebar';

export function CashBookPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="bg-white shadow">
          <div className="px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Cash Book</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + Daily Entry
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">No cash book entries yet. Click "Daily Entry" to record today's cash transactions!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
