import React, { useState, useEffect } from 'react';
import { salesAPI } from '../../api/salesAPI';
import { customerAPI } from '../../api/customerAPI';
import toast from 'react-hot-toast';

export function SalesForm({ onSuccess, onCancel, editingSale }) {
  const getFormattedDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    // Ensure date is in YYYY-MM-DD format
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      return dateStr.split('T')[0]; // Remove time if present
    }
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    customer_id: editingSale?.customer_id || '',
    sale_date: getFormattedDate(editingSale?.sale_date),
    payment_mode: editingSale?.payment_mode || 'Cash',
    payment_status: editingSale?.payment_status || 'Pending',
    remarks: editingSale?.remarks || '',
  });

  const [items, setItems] = useState(editingSale?.items?.map(item => ({
    product_name: item.product_name,
    quantity: item.quantity.toString(),
    rate: item.rate.toString(),
    unit: item.unit || 'Units'
  })) || [{ product_name: '', quantity: '', rate: '', unit: 'Units' }]);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [productHistory, setProductHistory] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState({});
  const [selectedProductIndex, setSelectedProductIndex] = useState({});
  const [showProductSuggestions, setShowProductSuggestions] = useState({});

  useEffect(() => {
    fetchCustomers();
    loadProductHistory();
  }, []);

  useEffect(() => {
    if (editingSale && customers.length > 0) {
      const customer = customers.find(c => c.customer_id === editingSale.customer_id);
      if (customer) {
        setSearchTerm(customer.name);
      }
    }
  }, [editingSale, customers]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const fetchCustomers = async () => {
    try {
      const result = await customerAPI.getAll(1, 100);
      setCustomers(result.data || []);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const loadProductHistory = () => {
    const saved = localStorage.getItem('productHistory');
    if (saved) {
      setProductHistory(JSON.parse(saved));
    }
  };

  const saveProductHistory = (products) => {
    const unique = [...new Set(products)];
    localStorage.setItem('productHistory', JSON.stringify(unique.slice(0, 50)));
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
      setShowCustomerDropdown(true);
    } else {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
    }
  };

  const selectCustomer = (customer) => {
    setFormData(prev => ({ ...prev, customer_id: customer.customer_id }));
    setSearchTerm(customer.name);
    setShowCustomerDropdown(false);
  };

  const createNewCustomer = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a customer name');
      return;
    }

    try {
      const newCustomer = await customerAPI.create({
        name: searchTerm.trim(),
        mobile: '',
        company_name: '',
        address: '',
        city: '',
        gst_number: '',
        notes: ''
      });

      // Update customers list
      setCustomers([...customers, newCustomer]);
      // Select the newly created customer
      selectCustomer(newCustomer);
      toast.success('✓ Customer created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'product_name') {
      if (value.trim()) {
        // Filter products
        const searchTerm = value.trim().toLowerCase();
        const filtered = productHistory.filter(p =>
          p.toLowerCase().startsWith(searchTerm) || p.toLowerCase().includes(searchTerm)
        );

        // Show filtered or recent products
        setFilteredProducts(prev => ({
          ...prev,
          [index]: filtered.length > 0 ? filtered : productHistory.slice(0, 20)
        }));

        // Add new product to history
        if (!productHistory.some(p => p.toLowerCase().trim() === searchTerm)) {
          const trimmedValue = value.trim();
          const updated = [trimmedValue, ...productHistory].filter((p, i, arr) =>
            arr.findIndex(x => x.toLowerCase() === p.toLowerCase()) === i
          );
          const limited = updated.slice(0, 100);
          setProductHistory(limited);
          saveProductHistory(limited);
        }
      } else {
        // Show recent products when empty
        setFilteredProducts(prev => ({ ...prev, [index]: productHistory.slice(0, 20) }));
      }
    }

    setItems(newItems);
  };

  const selectProduct = (index, product) => {
    const newItems = [...items];
    newItems[index].product_name = product;
    setItems(newItems);
    setFilteredProducts(prev => ({ ...prev, [index]: [] }));
    setSelectedProductIndex(prev => ({ ...prev, [index]: -1 }));
  };

  const handleProductKeyDown = (e, index) => {
    const filtered = filteredProducts[index] || [];
    const current = selectedProductIndex[index] ?? -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedProductIndex(prev => ({
          ...prev,
          [index]: Math.min(current + 1, filtered.length - 1)
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedProductIndex(prev => ({
          ...prev,
          [index]: Math.max(current - 1, -1)
        }));
        break;
      case 'Enter':
        e.preventDefault();
        if (current >= 0 && current < filtered.length) {
          selectProduct(index, filtered[current]);
        }
        break;
      default:
        break;
    }
  };

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: '', rate: '', unit: 'Units' }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0));
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }

    if (items.length === 0 || items.some((item) => !item.product_name || !item.quantity || !item.rate)) {
      toast.error('Please fill all item details');
      return;
    }

    try {
      if (editingSale) {
        // Update existing sale
        await salesAPI.update(editingSale.sale_id, {
          ...formData,
          items,
        });
        toast.success('✓ Sale updated successfully!');
      } else {
        // Create new sale
        await salesAPI.create({
          ...formData,
          items,
        });
        // Save products to history
        const productNames = items.map(item => item.product_name);
        saveProductHistory([...productHistory, ...productNames]);
        toast.success('✓ Sale created successfully!');
      }

      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editingSale ? 'update' : 'create'} sale`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl my-8">
        <h2 className="text-2xl font-bold mb-4">
          {editingSale ? `✏️ Edit Sale #${editingSale.sale_id}` : '📝 New Sales Entry'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                name="sale_date"
                value={formData.sale_date}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-1">Customer *</label>
              <input
                type="text"
                placeholder="Search customer..."
                value={searchTerm}
                onChange={handleCustomerSearch}
                onFocus={() => searchTerm && setShowCustomerDropdown(true)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {showCustomerDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b max-h-48 overflow-y-auto z-10 shadow-lg">
                  {filteredCustomers.length > 0 ? (
                    <>
                      {filteredCustomers.map(c => (
                        <div
                          key={c.customer_id}
                          onClick={() => selectCustomer(c)}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b"
                        >
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.mobile || 'No mobile'}</div>
                        </div>
                      ))}
                    </>
                  ) : searchTerm.trim() ? (
                    <div
                      onClick={createNewCustomer}
                      className="px-3 py-2 cursor-pointer hover:bg-green-50 text-green-700 font-medium border-b"
                    >
                      ➕ Create new customer: "{searchTerm}"
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment Mode</label>
              <select
                name="payment_mode"
                value={formData.payment_mode}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment Status</label>
              <select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Paid</option>
                <option>Partially Paid</option>
                <option>Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Items *</label>
            <div className="space-y-2 border p-3 rounded bg-gray-50">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <div className="col-span-3 relative">
                    <input
                      type="text"
                      placeholder="Product Name (type to autocomplete)"
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      onKeyDown={(e) => handleProductKeyDown(e, index)}
                      onFocus={() => {
                        setShowProductSuggestions(prev => ({ ...prev, [index]: true }));
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowProductSuggestions(prev => ({ ...prev, [index]: false }));
                        }, 200);
                      }}
                      className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    {showProductSuggestions[index] && filteredProducts[index]?.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b max-h-40 overflow-y-auto z-20 shadow-md">
                        {filteredProducts[index].map((product, i) => (
                          <div
                            key={i}
                            onClick={() => selectProduct(index, product)}
                            className={`px-2 py-1 cursor-pointer text-sm border-b last:border-b-0 ${
                              selectedProductIndex[index] === i ? 'bg-blue-500 text-white' : 'hover:bg-blue-50'
                            }`}
                          >
                            {product}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="col-span-2 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <select
                    value={item.unit || 'Units'}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    className="col-span-2 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="Units">Units</option>
                    <option value="Meter">Meter (M)</option>
                    <option value="Kg">Kilogram (Kg)</option>
                    <option value="Gm">Gram (Gm)</option>
                    <option value="L">Liter (L)</option>
                    <option value="Ml">Milliliter (Ml)</option>
                    <option value="Cm">Centimeter (Cm)</option>
                    <option value="Roll">Roll</option>
                    <option value="Box">Box</option>
                    <option value="Pair">Pair</option>
                    <option value="Dozen">Dozen</option>
                    <option value="Pack">Pack</option>
                    <option value="Sheet">Sheet</option>
                    <option value="Docs">Docs</option>
                    <option value="Piece">Piece</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    className="col-span-2 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <div className="col-span-2 px-2 py-1 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded">
                    ₹ {(parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)).toFixed(2)}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="col-span-1 text-red-600 hover:text-red-800 text-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Item
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 my-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Total Amount:</span>
              <span className="text-3xl font-bold text-blue-600">₹ {calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <textarea
            name="remarks"
            placeholder="Remarks (optional)"
            value={formData.remarks}
            onChange={handleFormChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
          />

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
            >
              {editingSale ? '💾 Update Sale' : '✅ Create Sale'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
              title="Press ESC to close"
            >
              Cancel (or press ESC)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
