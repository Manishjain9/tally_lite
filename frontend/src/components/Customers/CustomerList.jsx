import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { CustomerForm } from './CustomerForm';
import { customerAPI } from '../../api/customerAPI';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function CustomerList() {
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setCustomerDetails(null);
        setShowForm(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

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

  const handleAddSuccess = () => {
    setShowForm(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const viewCustomerDetails = async (customer) => {
    try {
      const [transactions, balance] = await Promise.all([
        customerAPI.getTransactions(customer.customer_id),
        customerAPI.getOutstandingBalance(customer.customer_id)
      ]);

      setSelectedCustomer(customer);
      setCustomerDetails({
        transactions: transactions || [],
        outstanding_balance: balance?.outstanding_balance || 0,
      });
    } catch (error) {
      toast.error('Failed to load customer details');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      await customerAPI.delete(customerId);
      toast.success('✓ Customer deleted successfully!');
      setCustomerDetails(null);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    }
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Customers</h2>
              <p className="text-purple-100 text-sm mt-1">Manage your customer relationships</p>
            </div>
            <button
              onClick={() => {
                setEditingCustomer(null);
                setShowForm(true);
              }}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg hover:bg-purple-50 font-semibold transition shadow-md"
            >
              + Add Customer
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {customers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center h-full flex items-center justify-center">
              <div>
                <p className="text-gray-500 text-lg mb-2">No customers yet.</p>
                <p className="text-gray-400">Click "Add Customer" to get started!</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Mobile</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Company</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">City</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Pending Payment</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...customers].sort((a, b) => a.name.localeCompare(b.name)).map((customer, index) => (
                      <tr key={customer.customer_id} className={`hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{customer.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{customer.mobile || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{customer.company_name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{customer.city || '—'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-600 whitespace-nowrap">{formatCurrency(customer.outstanding_balance || 0)}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => viewCustomerDetails(customer)}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <CustomerForm
            onSuccess={handleAddSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingCustomer(null);
            }}
            editingCustomer={editingCustomer}
          />
        )}

        {customerDetails && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                  <p className="text-sm text-gray-600">{selectedCustomer.mobile}</p>
                </div>
                <button
                  onClick={() => setCustomerDetails(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  title="Press ESC to close"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCustomer.company_name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCustomer.city || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">GST Number</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCustomer.gst_number || '—'}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg border-2 border-red-300">
                  <p className="text-sm text-red-700 font-semibold">Pending Payment</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(customerDetails.outstanding_balance)}</p>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div className="mb-6 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 font-semibold">Notes</p>
                  <p className="text-gray-900">{selectedCustomer.notes}</p>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Transaction History</h3>
                {customerDetails.transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-4">
                    {customerDetails.transactions.map((txn, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">Sale # {txn.sale_id}</p>
                            <p className="text-sm text-gray-600">{formatDate(txn.sale_date)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${
                            txn.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                            txn.payment_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {txn.payment_status}
                          </span>
                        </div>
                        
                        <div className="mb-3 bg-gray-50 rounded p-2 text-sm">
                          <p className="font-semibold text-gray-700 mb-2">Items:</p>
                          {txn.items?.map((item, i) => (
                            <p key={i} className="text-gray-600">
                              • {item.product_name} ({item.quantity} {item.unit || 'Units'} × ₹{formatCurrency(item.rate)})
                            </p>
                          )) || <p className="text-gray-600">No items details available</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(txn.total_amount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Balance Due</p>
                            <p className="font-bold text-red-600">{formatCurrency(txn.balance_amount || 0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Paid</p>
                            <p className="font-semibold text-green-600">{formatCurrency((parseFloat(txn.total_amount) || 0) - (parseFloat(txn.balance_amount) || 0))}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-2">
                <button
                  onClick={() => handleDeleteCustomer(selectedCustomer.customer_id)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
                >
                  🗑️ Delete Customer
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCustomer(selectedCustomer);
                      setCustomerDetails(null);
                      setShowForm(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setCustomerDetails(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    Close (or press ESC)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
