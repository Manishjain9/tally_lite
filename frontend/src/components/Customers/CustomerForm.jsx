import React, { useState, useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { customerAPI } from '../../api/customerAPI';
import toast from 'react-hot-toast';

export function CustomerForm({ onSuccess, onCancel, editingCustomer }) {
  const { values, handleChange, handleSubmit } = useForm(
    {
      name: editingCustomer?.name || '',
      mobile: editingCustomer?.mobile || '',
      company_name: editingCustomer?.company_name || '',
      address: editingCustomer?.address || '',
      city: editingCustomer?.city || '',
      gst_number: editingCustomer?.gst_number || '',
      notes: editingCustomer?.notes || '',
    },
    async (formValues) => {
      try {
        if (editingCustomer) {
          await customerAPI.update(editingCustomer.customer_id, formValues);
          toast.success('✓ Customer updated successfully!');
        } else {
          await customerAPI.create(formValues);
          toast.success('✓ Customer added successfully!');
        }
        onSuccess();
      } catch (error) {
        toast.error(error.response?.data?.message || `Failed to ${editingCustomer ? 'update' : 'add'} customer`);
      }
    }
  );

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {editingCustomer ? `✏️ Edit Customer` : '👥 Add Customer'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name *"
            value={values.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="tel"
            name="mobile"
            placeholder="Mobile (10 digits)"
            value={values.mobile}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="company_name"
            placeholder="Company Name"
            value={values.company_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={values.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="city"
            placeholder="City"
            value={values.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="gst_number"
            placeholder="GST Number (optional)"
            value={values.gst_number}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            name="notes"
            placeholder="Notes"
            value={values.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
            >
              {editingCustomer ? '💾 Update Customer' : '✅ Save Customer'}
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
