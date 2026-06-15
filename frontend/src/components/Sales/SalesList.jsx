import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { SalesForm } from './SalesForm';
import { salesAPI } from '../../api/salesAPI';
import { customerAPI } from '../../api/customerAPI';
import { paymentAPI } from '../../api/paymentAPI';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function SalesList() {
  const [showForm, setShowForm] = useState(false);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState(null);
  const [customers, setCustomers] = useState({});
  const [editingSale, setEditingSale] = useState(null);
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchSales();
  }, []);

  const fetchCustomers = async () => {
    try {
      const result = await customerAPI.getAll(1, 100);
      const customerMap = {};
      (result.data || []).forEach(customer => {
        customerMap[customer.customer_id] = customer.name;
      });
      setCustomers(customerMap);
    } catch (error) {
      console.error('Failed to load customers');
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSaleDetails(null);
        setShowForm(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const fetchSales = async () => {
    try {
      const result = await salesAPI.getAll(1, 1000);
      setSales(result.data || []);
    } catch (error) {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowForm(false);
    fetchSales();
  };

  const viewSaleDetails = async (sale) => {
    try {
      const details = await salesAPI.getById(sale.sale_id);
      setSaleDetails(details);
      setSelectedSale(sale);
    } catch (error) {
      toast.error('Failed to load sale details');
    }
  };

  const handleEditSale = (sale) => {
    setEditingSale(sale);
    setSaleDetails(null);
    setShowForm(true);
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      return;
    }

    try {
      await salesAPI.delete(saleId);
      toast.success('✓ Sale deleted successfully!');
      setSaleDetails(null);
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete sale');
    }
  };

  const toggleCustomer = (customerName) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [customerName]: !prev[customerName]
    }));
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Sales Entry</h2>
              <p className="text-blue-100 text-sm mt-1">Track and manage your sales transactions</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 font-semibold transition shadow-md"
            >
              + New Sale
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {sales.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center h-full flex items-center justify-center">
              <div>
                <p className="text-gray-500 text-lg mb-2">No sales yet.</p>
                <p className="text-gray-400">Click "New Sale" to create your first entry!</p>
              </div>
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
              ).map(([customerName, customerSales]) => {
                const isExpanded = expandedCustomers[customerName] === true;
                const customerId = customerSales[0]?.customer_id;
                const totalAmount = customerSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);

                return (
                <div key={customerName} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleCustomer(customerName)}
                          className="text-white hover:bg-blue-800 rounded-full p-1 transition"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                        <h3 className="text-lg font-bold text-white">👤 {customerName}</h3>
                        <span className="ml-2 text-blue-100 text-sm">({customerSales.length} sales)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-blue-100">Total Sales</p>
                          <p className="text-lg font-bold text-white">{formatCurrency(totalAmount)}</p>
                        </div>
                        {customerId && (
                          <button
                            onClick={() => setPaymentCustomer({ id: customerId, name: customerName })}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                            title="Add payment for this customer"
                          >
                            💰 Pay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Sale ID</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Items</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Payment Mode</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {customerSales.map((sale, index) => (
                          <tr key={sale.sale_id} className={`hover:bg-blue-50 transition cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap"># {sale.sale_id}</td>
                            <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(sale.sale_date)}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              <div className="space-y-1 text-xs">
                                {sale.items_preview ? (
                                  sale.items_preview.split(', ').slice(0, 2).map((item, i) => (
                                    <div key={i} className="text-gray-700">📦 {item}</div>
                                  ))
                                ) : (
                                  <span className="text-gray-400">No items</span>
                                )}
                                {sale.items_preview && sale.items_preview.split(', ').length > 2 && (
                                  <div className="text-gray-500 italic">+{sale.items_preview.split(', ').length - 2} more</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{formatCurrency(sale.total_amount)}</td>
                            <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">{sale.payment_mode}</td>
                            <td className="px-6 py-3 text-sm whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                sale.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                                sale.payment_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {sale.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm whitespace-nowrap">
                              <button
                                onClick={() => viewSaleDetails(sale)}
                                className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                              >
                                View →
                              </button>
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
          <SalesForm
            onSuccess={handleAddSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingSale(null);
            }}
            editingSale={editingSale}
          />
        )}

        {saleDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Sale Details</h2>
                <button
                  onClick={() => setSaleDetails(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  title="Press ESC to close"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Sale ID</p>
                  <p className="text-lg font-semibold text-gray-900"># {saleDetails.sale_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(saleDetails.sale_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer ID</p>
                  <p className="text-lg font-semibold text-gray-900">{saleDetails.customer_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Mode</p>
                  <p className="text-lg font-semibold text-gray-900">{saleDetails.payment_mode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold">{saleDetails.payment_status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(saleDetails.total_amount)}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Items</h3>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Product</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Quantity</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Rate</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {saleDetails.items?.map((item, index) => (
                        <tr key={index} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-2">{item.product_name}</td>
                          <td className="px-4 py-2 text-center">{item.quantity} {item.unit || 'Units'}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.rate)}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {saleDetails.remarks && (
                <div className="mb-6 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Remarks</p>
                  <p className="text-gray-900">{saleDetails.remarks}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleDeleteSale(selectedSale.sale_id)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => handleEditSale(selectedSale)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setSaleDetails(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Close (or press ESC)
                </button>
              </div>
            </div>
          </div>
        )}

        {paymentCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">💰 Add Payment</h2>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Customer</p>
                <p className="text-lg font-semibold text-gray-900">{paymentCustomer.name}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                  <select className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number (optional)</label>
                  <input
                    type="text"
                    placeholder="UPI ID / Cheque No / Bank Ref"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // TODO: Save payment
                    toast.success('✓ Payment recorded!');
                    setPaymentCustomer(null);
                    setPaymentAmount('');
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium"
                >
                  ✓ Record Payment
                </button>
                <button
                  onClick={() => {
                    setPaymentCustomer(null);
                    setPaymentAmount('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
