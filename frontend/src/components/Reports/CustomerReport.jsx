import React, { useState, useEffect } from 'react';
import { reportAPI } from '../../api/reportAPI';
import { customerAPI } from '../../api/customerAPI';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function CustomerReport({ onBack }) {
  const [report, setReport] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onBack]);

  const fetchCustomers = async () => {
    try {
      const result = await customerAPI.getAll(1, 100);
      setCustomers(result.data || []);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase()) ||
        c.mobile?.includes(value)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers([]);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer.customer_id);
    setSearchTerm(customer.name);
    setFilteredCustomers([]);
    fetchCustomerReport(customer.customer_id);
  };

  const fetchCustomerReport = async (customerId) => {
    try {
      setLoading(true);
      const result = await reportAPI.getCustomerReport(customerId);
      setReport(result);
    } catch (error) {
      toast.error('Failed to load customer report');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Report</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          title="Press ESC to go back"
        >
          Back (or press ESC)
        </button>
      </div>

      <div className="mb-6 relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
        <input
          type="text"
          placeholder="Search customer by name or mobile..."
          value={searchTerm}
          onChange={handleCustomerSearch}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {filteredCustomers.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b max-h-48 overflow-y-auto z-10 shadow-lg mt-0">
            {filteredCustomers.map(c => (
              <div
                key={c.customer_id}
                onClick={() => selectCustomer(c)}
                className="px-3 py-2 cursor-pointer hover:bg-blue-50"
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-500">{c.mobile || 'No mobile'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {report && selectedCustomer && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-semibold">Total Sales</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(report.total_sales || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">{report.transaction_count || 0} transactions</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-semibold">Amount Paid</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(report.amount_paid || 0)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-semibold">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(report.outstanding_balance || 0)}
              </p>
            </div>
          </div>

          {report.transactions && report.transactions.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sale ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Paid</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.transactions.map((txn, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900"># {txn.sale_id}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{new Date(txn.sale_date).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">{formatCurrency(txn.total_amount)}</td>
                        <td className="px-6 py-3 text-sm text-green-600">{formatCurrency((parseFloat(txn.total_amount) || 0) - (parseFloat(txn.balance_amount) || 0))}</td>
                        <td className="px-6 py-3 text-sm font-bold text-red-600">{formatCurrency(txn.balance_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedCustomer && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Select a customer to view their report</p>
        </div>
      )}
    </div>
  );
}
