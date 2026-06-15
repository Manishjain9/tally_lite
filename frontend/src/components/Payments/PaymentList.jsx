import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { paymentAPI } from '../../api/paymentAPI';
import { salesAPI } from '../../api/salesAPI';
import { customerAPI } from '../../api/customerAPI';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function PaymentList() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedPaymentHistory, setSelectedPaymentHistory] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [viewMode, setViewMode] = useState('outstanding'); // 'outstanding' or 'all'
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [formData, setFormData] = useState({
    amount_received: '',
    payment_type: '',
    reference_number: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowForm(false);
        setShowHistory(false);
        setEditingPayment(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all sales
      const salesResult = await salesAPI.getAll(1, 1000);
      const allSales = Array.isArray(salesResult?.data) ? salesResult.data : [];

      // Fetch customer names
      const customersResult = await customerAPI.getAll(1, 1000);
      const customerMap = {};
      (customersResult.data || []).forEach(customer => {
        customerMap[customer.customer_id] = customer.name;
      });

      setCustomers(customerMap);
      setSales(allSales);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (sale) => {
    setSelectedSale(sale);
    setEditingPayment(null);
    setShowForm(true);
    setFormData({
      amount_received: '',
      payment_type: '',
      reference_number: '',
    });
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setSelectedSale({ balance_amount: payment.amount_received, customer_name: payment.customer_name, sale_id: payment.sale_id });
    setShowForm(true);
    setFormData({
      amount_received: payment.amount_received.toString(),
      payment_type: payment.payment_type || '',
      reference_number: payment.reference_number || '',
    });
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) {
      return;
    }

    try {
      await paymentAPI.deletePayment(paymentId);
      toast.success('✓ Payment deleted successfully!');
      setShowHistory(false);
      await new Promise(r => setTimeout(r, 500));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete payment');
    }
  };

  const toggleCustomer = (customerName) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [customerName]: !prev[customerName]
    }));
  };

  const viewPaymentHistory = async (sale) => {
    try {
      const history = await paymentAPI.getHistory(sale.sale_id);
      setSelectedSale(sale);
      setSelectedPaymentHistory(Array.isArray(history) ? history : []);
      setShowHistory(true);
    } catch (error) {
      toast.error('Failed to load payment history');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount_received || parseFloat(formData.amount_received) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (formData.payment_type && formData.payment_type !== 'Cash' && !formData.reference_number.trim()) {
      toast.error(`Reference number is required for ${formData.payment_type}`);
      return;
    }

    try {
      if (editingPayment) {
        // Edit existing payment
        await paymentAPI.updatePayment(editingPayment.online_payment_id, {
          amount_received: parseFloat(formData.amount_received),
          payment_type: formData.payment_type || null,
          reference_number: formData.reference_number || null,
        });
        toast.success('✓ Payment updated successfully!');
      } else {
        // Record new payment
        if (parseFloat(formData.amount_received) > parseFloat(selectedSale.balance_amount)) {
          toast.error('Amount cannot exceed balance due');
          return;
        }

        await paymentAPI.recordPayment(selectedSale.sale_id, {
          amount_received: parseFloat(formData.amount_received),
          payment_type: formData.payment_type || null,
          reference_number: formData.reference_number || null,
        });
        toast.success('✓ Payment recorded successfully!');
      }

      setShowForm(false);
      setEditingPayment(null);
      setFormData({
        amount_received: '',
        payment_type: '',
        reference_number: '',
      });

      await new Promise(r => setTimeout(r, 500));
      fetchData();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to process payment');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">{viewMode === 'outstanding' ? 'Outstanding Payments' : 'All Payments'}</h2>
              <p className="text-blue-100 text-sm mt-1">Manage and track payment records</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('outstanding')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  viewMode === 'outstanding'
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-700 text-white hover:bg-blue-600'
                }`}
              >
                Outstanding
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  viewMode === 'all'
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-700 text-white hover:bg-blue-600'
                }`}
              >
                All Payments
              </button>
              <button
                onClick={fetchData}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 font-semibold transition"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {sales.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-500 text-lg">✓ {viewMode === 'outstanding' ? 'No outstanding sales.' : 'No sales recorded yet.'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                sales.reduce((grouped, sale) => {
                  // Filter based on view mode
                  if (viewMode === 'outstanding' && sale.payment_status === 'Paid') {
                    return grouped;
                  }

                  const customerName = customers[sale.customer_id] || 'Unknown Customer';
                  if (!grouped[customerName]) {
                    grouped[customerName] = [];
                  }
                  grouped[customerName].push(sale);
                  return grouped;
                }, {})
              ).map(([customerName, customerSales]) => {
                const isExpanded = expandedCustomers[customerName] === true;
                const totalAmount = customerSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
                const totalBalance = customerSales.reduce((sum, s) => {
                  // Calculate balance from payment_tracking info if available
                  return sum + (s.balance_amount ? parseFloat(s.balance_amount) : 0);
                }, 0);

                return (
                <div key={customerName} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleCustomer(customerName)}
                          className="text-white hover:bg-green-800 rounded-full p-1 transition"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                        <h3 className="text-lg font-bold text-white">💳 {customerName}</h3>
                        <span className="ml-2 text-green-100 text-sm">({customerSales.length} sales)</span>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-xs text-green-100">Total Sales</p>
                          <p className="font-bold text-white">{formatCurrency(totalAmount)}</p>
                        </div>
                        {viewMode === 'outstanding' && totalBalance > 0 && (
                          <div>
                            <p className="text-xs text-green-100">Pending Balance</p>
                            <p className="font-bold text-white">{formatCurrency(totalBalance)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Sale #</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Sale Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Amount</th>
                          {viewMode === 'outstanding' && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Balance Due</th>}
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {customerSales.map((sale, index) => (
                          <tr key={sale.sale_id} className={`hover:bg-green-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-3 text-sm font-semibold text-gray-900">#{sale.sale_id}</td>
                            <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(sale.sale_date)}</td>
                            <td className="px-6 py-3 text-sm font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</td>
                            {viewMode === 'outstanding' && <td className="px-6 py-3 text-sm font-bold text-red-600">{formatCurrency(sale.balance_amount || 0)}</td>}
                            <td className="px-6 py-3 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                sale.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                                sale.payment_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {sale.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm space-x-2 flex">
                              <button
                                onClick={() => viewPaymentHistory(sale)}
                                className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition text-xs"
                              >
                                History
                              </button>
                              {(sale.payment_status === 'Pending' || sale.payment_status === 'Partially Paid') && (
                                <button
                                  onClick={() => handleRecordPayment(sale)}
                                  className="text-green-600 hover:text-green-800 font-semibold hover:underline transition text-xs"
                                >
                                  Pay
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-5 text-gray-900">
                {editingPayment ? '✏️ Edit Payment' : '💳 Record Payment'}
              </h2>

              <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  Customer: <span className="font-bold text-gray-900">{selectedSale?.customer_name}</span>
                </p>
                {!editingPayment && (
                  <p className="text-sm text-gray-700 mt-2">
                    Balance Due: <span className="font-bold text-red-600 text-lg">{formatCurrency(selectedSale?.balance_amount)}</span>
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Amount {editingPayment ? 'Paid' : 'Received'} *
                    {!editingPayment && <span className="text-gray-500 font-normal ml-2">(Max: {formatCurrency(selectedSale?.balance_amount)})</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={!editingPayment ? selectedSale?.balance_amount : undefined}
                    placeholder="Enter amount"
                    value={formData.amount_received}
                    onChange={(e) => setFormData({ ...formData, amount_received: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Payment Mode</label>
                  <select
                    value={formData.payment_type}
                    onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select payment mode...</option>
                    <option value="Cash">💵 Cash</option>
                    <option value="UPI">📱 UPI</option>
                    <option value="Bank Transfer">🏦 Bank Transfer</option>
                    <option value="Cheque">📄 Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Reference Number
                    {formData.payment_type && formData.payment_type !== 'Cash' && <span className="text-red-500"> *</span>}
                    {formData.payment_type === 'Cash' && <span className="text-gray-500 font-normal">(Optional for Cash)</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={formData.payment_type === 'Cash' ? 'Leave empty for cash' : 'Transaction ID / Cheque # / Reference'}
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                  >
                    {editingPayment ? '💾 Update' : '💳 Record'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPayment(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition"
                    title="Press ESC to close"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showHistory && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedSale.customer_name}</p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  title="Press ESC to close"
                >
                  ✕
                </button>
              </div>

              {selectedPaymentHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No payment records yet</p>
              ) : (
                <div className="space-y-3">
                  {selectedPaymentHistory.map((payment, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(payment.amount_received)} received
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.payment_type && `${payment.payment_type}`}
                            {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleEditPayment(payment);
                              setShowHistory(false);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment.online_payment_id)}
                            className="text-red-600 hover:text-red-800 font-semibold text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-6 mt-6 border-t">
                <button
                  onClick={() => {
                    handleRecordPayment(selectedSale);
                    setShowHistory(false);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
                >
                  + Add Payment
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
                  title="Press ESC to close"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
