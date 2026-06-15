import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { ExpenseForm } from './ExpenseForm';
import { expenseAPI } from '../../api/expenseAPI';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function ExpenseList() {
  const [showForm, setShowForm] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowForm(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const fetchExpenses = async () => {
    try {
      const result = await expenseAPI.getAll();
      setExpenses(result.data || []);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowForm(false);
    fetchExpenses();
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <div className="bg-gradient-to-r from-red-600 to-red-800 shadow-lg sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Expenses</h2>
              <p className="text-red-100 text-sm mt-1">Track and categorize your business expenses</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-red-600 px-6 py-2 rounded-lg hover:bg-red-50 font-semibold transition shadow-md"
            >
              + Add Expense
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {expenses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center h-full flex items-center justify-center">
              <div>
                <p className="text-gray-500 text-lg mb-2">No expenses yet.</p>
                <p className="text-gray-400">Click "Add Expense" to track your first expense!</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expenses.map((expense, index) => (
                      <tr key={expense.expense_id} className={`hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{formatDate(expense.expense_date)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{expense.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {showForm && <ExpenseForm onSuccess={handleAddSuccess} onCancel={() => setShowForm(false)} />}
      </div>
    </div>
  );
}
