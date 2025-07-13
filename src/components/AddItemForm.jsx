import React, { useState } from 'react';

const AddItemForm = ({ onAddItem }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    quantity: '',
    location: '',
    vendor: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return; // basic validation

    onAddItem({
      ...formData,
      quantity: Number(formData.quantity)
    });

    setFormData({
      name: '',
      sku: '',
      quantity: '',
      location: '',
      vendor: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input name="name" placeholder="Item Name" value={formData.name} onChange={handleChange} className="p-2 border rounded" />
        <input name="sku" placeholder="SKU" value={formData.sku} onChange={handleChange} className="p-2 border rounded" />
        <input name="quantity" type="number" placeholder="Quantity" value={formData.quantity} onChange={handleChange} className="p-2 border rounded" />
        <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="p-2 border rounded" />
        <input name="vendor" placeholder="Vendor" value={formData.vendor} onChange={handleChange} className="p-2 border rounded" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Add Item
      </button>
    </form>
  );
};

export default AddItemForm;