import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { paymentAPI } from '../../api/paymentAPI';
import { salesAPI } from '../../api/salesAPI';
import { customerAPI } from '../../api/customerAPI';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function PaymentList() {
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
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

      // Fetch all payments
      const paymentsResult = await paymentAPI.getAllPayments(1, 1000);
      const allPayments = Array.isArray(paymentsResult?.data) ? paymentsResult.data : [];

      // Fetch customer names
      const customersResult = await customerAPI.getAll(1, 1000);
      const customerMap = {};
      (customersResult.data || []).forEach(customer => {
        customerMap[customer.customer_id] = customer.name;
      });

      setCustomers(customerMap);
      setSales(allSales);
      setPayments(allPayments);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (customerName, totalBalance) => {
    setSelectedCustomerForPayment({ name: customerName, totalBalance });
    setEditingPayment(null);
    setShowForm(true);
    setFormData({
      amount_received: '',
      payment_type: 'Cash',
      reference_number: '',
    });
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setSelectedSale({ balance_amount: payment.amount_received, customer_name: payment.customer_name, sale_id: payment.sale_id });
    setShowForm(true);
    setFormData({
      amount_received: payment.amount_received.toString(),
      payment_type: 'Cash',
      reference_number: '',
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


    try {
      if (editingPayment) {
        // Edit existing payment
        await paymentAPI.updatePayment(editingPayment.online_payment_id, {
          amount_received: parseFloat(formData.amount_received),
          payment_type: 'Cash',
          reference_number: null,
        });
        toast.success('✓ Payment updated successfully!');
      } else if (selectedCustomerForPayment) {
        // Customer-level payment: apply to first unpaid sale of this customer
        const customerName = selectedCustomerForPayment.name;
        const unpaidSales = sales.filter(s =>
          customers[s.customer_id] === customerName &&
          (s.balance_amount > 0)
        );

        if (unpaidSales.length === 0) {
          toast.error('No pending sales for this customer');
          return;
        }

        if (parseFloat(formData.amount_received) > parseFloat(selectedCustomerForPayment.totalBalance)) {
          toast.error('Amount cannot exceed total pending balance');
          return;
        }

        // Record payment to first unpaid sale
        const firstUnpaidSale = unpaidSales[0];
        await paymentAPI.recordPayment(firstUnpaidSale.sale_id, {
          amount_received: parseFloat(formData.amount_received),
          payment_type: 'Cash',
        });
        toast.success('✓ Payment recorded successfully!');
      } else if (selectedSale) {
        // Sale-level payment (from history modal)
        if (parseFloat(formData.amount_received) > parseFloat(selectedSale.balance_amount)) {
          toast.error('Amount cannot exceed balance due');
          return;
        }

        await paymentAPI.recordPayment(selectedSale.sale_id, {
          amount_received: parseFloat(formData.amount_received),
          payment_type: 'Cash',
          reference_number: null,
        });
        toast.success('✓ Payment recorded successfully!');
      }

      setShowForm(false);
      setEditingPayment(null);
      setSelectedCustomerForPayment(null);
      setSelectedSale(null);
      setFormData({
        amount_received: '',
        payment_type: 'Cash',
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
                  const customerName = customers[sale.customer_id] || 'Unknown Customer';
                  if (!grouped[customerName]) {
                    grouped[customerName] = [];
                  }
                  grouped[customerName].push(sale);
                  return grouped;
                }, {})
              ).sort((a, b) => a[0].localeCompare(b[0]))
              .map(([customerName, customerSales]) => {
                const isExpanded = expandedCustomers[customerName] === true;
                const totalAmount = customerSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
                const customerPayments = payments.filter(p => p.customer_name === customerName && parseFloat(p.amount_received || 0) > 0);
                const totalReceived = customerPayments.reduce((sum, p) => sum + parseFloat(p.amount_received || 0), 0);
                const totalBalance = Math.max(0, totalAmount - totalReceived);

                return (
                <div key={customerName} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div
                    onClick={() => toggleCustomer(customerName)}
                    className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 cursor-pointer hover:from-green-700 hover:to-green-800 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-white text-xl">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <h3 className="text-lg font-bold text-white">💳 {customerName}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-xs text-green-100">Total Sales</p>
                          <p className="font-bold text-white">{formatCurrency(totalAmount)}</p>
                        </div>
                        {viewMode === 'outstanding' && totalBalance > 0 && (
                          <>
                            <div>
                              <p className="text-xs text-green-100">Pending Balance</p>
                              <p className="font-bold text-white">{formatCurrency(totalBalance)}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRecordPayment(customerName, totalBalance);
                              }}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-semibold transition"
                              title="Record payment for this customer"
                            >
                              💰 Pay
                            </button>
                          </>
                        )}
                        {viewMode === 'all' && (
                          <div>
                            <p className="text-xs text-green-100">Received</p>
                            <p className="font-bold text-white">{formatCurrency(totalReceived)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="space-y-2">
                        {/* Sales */}
                        {customerSales.map((sale) => (
                          <div key={`sale-${sale.sale_id}`} className="flex justify-between items-center p-3 bg-blue-50 rounded hover:bg-blue-100 transition">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-blue-600 font-semibold px-2 py-1 bg-blue-200 rounded">SALE</span>
                              <p className="text-sm font-medium text-gray-900">{formatDate(sale.sale_date)}</p>
                            </div>
                            <p className="text-sm font-semibold text-blue-700">{formatCurrency(sale.total_amount)}</p>
                          </div>
                        ))}

                        {/* Payments */}
                        {payments.filter(p => p.customer_name === customerName && parseFloat(p.amount_received || 0) > 0).map((payment) => {
                          const paymentDate = payment.payment_date || payment.created_at || payment.date_created || payment.timestamp;
                          return (
                            <div key={`payment-${payment.online_payment_id}`} className="flex justify-between items-center p-3 bg-green-50 rounded hover:bg-green-100 transition">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-green-600 font-semibold px-2 py-1 bg-green-200 rounded">PAYMENT</span>
                                {paymentDate && <p className="text-sm font-medium text-gray-900">{formatDate(paymentDate)}</p>}
                              </div>
                              <p className="text-sm font-semibold text-green-700">{formatCurrency(payment.amount_received)}</p>
                            </div>
                          );
                        })}
                      </div>
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
                {selectedCustomerForPayment ? (
                  <>
                    <p className="text-sm text-gray-700">
                      Customer: <span className="font-bold text-gray-900">{selectedCustomerForPayment?.name}</span>
                    </p>
                    {!editingPayment && (
                      <>
                        <p className="text-sm text-gray-700 mt-2">
                          Total Pending Balance: <span className="font-bold text-red-600 text-lg">{formatCurrency(selectedCustomerForPayment?.totalBalance)}</span>
                        </p>
                        {formData.amount_received && (
                          <p className="text-sm text-gray-700 mt-2">
                            Remaining Balance: <span className="font-bold text-green-600 text-lg">
                              {formatCurrency(Math.max(0, parseFloat(selectedCustomerForPayment?.totalBalance || 0) - parseFloat(formData.amount_received || 0)))}
                            </span>
                          </p>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-700">
                      Sale Balance: <span className="font-bold text-gray-900">{formatCurrency(selectedSale?.balance_amount)}</span>
                    </p>
                    {!editingPayment && (
                      <>
                        <p className="text-sm text-gray-700 mt-2">
                          Outstanding: <span className="font-bold text-red-600 text-lg">{formatCurrency(selectedSale?.balance_amount)}</span>
                        </p>
                        {formData.amount_received && (
                          <p className="text-sm text-gray-700 mt-2">
                            Remaining: <span className="font-bold text-green-600 text-lg">
                              {formatCurrency(Math.max(0, parseFloat(selectedSale?.balance_amount || 0) - parseFloat(formData.amount_received || 0)))}
                            </span>
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Amount {editingPayment ? 'Paid' : 'Received'} *
                    {!editingPayment && <span className="text-gray-500 font-normal ml-2">(Max: {formatCurrency(selectedCustomerForPayment?.totalBalance || selectedSale?.balance_amount)})</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={!editingPayment ? (selectedCustomerForPayment?.totalBalance || selectedSale?.balance_amount) : undefined}
                    placeholder="Enter amount"
                    value={formData.amount_received}
                    onChange={(e) => setFormData({ ...formData, amount_received: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    required
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
                    setSelectedSale(null);
                    setEditingPayment(null);
                    setShowForm(true);
                    setFormData({
                      amount_received: '',
                      payment_type: '',
                      reference_number: '',
                    });
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
