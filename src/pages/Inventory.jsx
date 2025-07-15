import React, { useEffect, useState } from 'react';
import InventoryTable from '../components/InventoryTable';
import AddItemForm from '../components/AddItemForm';
import ReceiptUploader from '../components/ReceiptUploader';
import { db } from '../firebase';
import { collection, addDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Inventory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;

    const userInventoryRef = collection(db, 'users', user.uid, 'inventoryItems');

    // Real-time listener (or use getDocs for one-time fetch)
    const unsubscribe = onSnapshot(userInventoryRef, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(inventoryData);
    });

    return () => unsubscribe();
  }, [user]);

  const addItem = async (newItem) => {
    if (!user) return;

    const userInventoryRef = collection(db, 'users', user.uid, 'inventoryItems');
    await addDoc(userInventoryRef, newItem); // Firebase will auto-merge with real-time listener
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
      <AddItemForm onAddItem={addItem} />
      <InventoryTable data={items} />
      <hr className="my-8" />
      <ReceiptUploader />
    </div>
  );
};

export default Inventory;
