import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path) => location.pathname === path ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-screen">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">Sales & Expense</h1>
        <p className="text-xs text-gray-500">Management App</p>
      </div>

      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        <Link to="/dashboard" className={`block px-4 py-2 rounded ${isActive('/dashboard')}`}>
          📊 Dashboard
        </Link>
        <Link to="/customers" className={`block px-4 py-2 rounded ${isActive('/customers')}`}>
          👥 Customers
        </Link>
        <Link to="/sales" className={`block px-4 py-2 rounded ${isActive('/sales')}`}>
          💰 Sales Entry
        </Link>
        <Link to="/payments" className={`block px-4 py-2 rounded ${isActive('/payments')}`}>
          💳 Payments
        </Link>
      </nav>

      <div className="p-4 border-t bg-white">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
