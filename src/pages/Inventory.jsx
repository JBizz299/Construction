import React, { useState } from 'react';
import InventoryTable from '../components/InventoryTable';
import AddItemForm from '../components/AddItemForm';
import ReceiptUploader from '../components/ReceiptUploader';

const Inventory = () => {
  const [items, setItems] = useState([
    { name: 'Concrete Bags', sku: 'CB-1001', quantity: 250, location: 'Warehouse A', vendor: 'BuildCo' },
    { name: 'Rebar Steel Rods', sku: 'RS-2002', quantity: 120, location: 'Yard B', vendor: 'SteelMakers' },
    { name: 'PVC Pipes', sku: 'PP-3010', quantity: 600, location: 'Warehouse A', vendor: 'PipeWorks' },
  ]);

  const addItem = (newItem) => {
    setItems([...items, newItem]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>

      {/* Inventory Section */}
      <AddItemForm onAddItem={addItem} />
      <InventoryTable data={items} />

      {/* Divider */}
      <hr className="my-8" />

      {/* Receipt Upload Section */}
      <ReceiptUploader />
    </div>
  );
};

export default Inventory;