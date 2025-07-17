// src/pages/Inventory.jsx - Updated to use Enhanced Inventory Manager
import React, { useEffect, useState } from 'react';
import EnhancedInventoryManager from '../components/EnhancedInventoryManager';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SecurityUtils } from '../utils/SecurityUtils';

const Inventory = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time inventory listener
  useEffect(() => {
    if (!user) return;

    const userInventoryRef = collection(db, 'users', user.uid, 'inventoryItems');

    const unsubscribe = onSnapshot(
      userInventoryRef,
      (snapshot) => {
        try {
          const inventoryData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setItems(inventoryData);
          setError(null);
        } catch (err) {
          console.error('Error processing inventory data:', err);
          setError('Failed to load inventory data');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to inventory:', err);
        setError('Failed to connect to inventory database');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Add new inventory item
  const handleAddItem = async (newItem) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      // Sanitize input data
      const sanitizedItem = {
        name: SecurityUtils.sanitizeInput(newItem.name),
        description: SecurityUtils.sanitizeInput(newItem.description || ''),
        category: newItem.category,
        quantity: parseInt(newItem.quantity) || 0,
        unit: newItem.unit || 'each',
        unitCost: parseFloat(newItem.unitCost) || 0,
        supplier: SecurityUtils.sanitizeInput(newItem.supplier || ''),
        location: SecurityUtils.sanitizeInput(newItem.location || ''),
        reorderPoint: parseInt(newItem.reorderPoint) || 10,
        maxStock: parseInt(newItem.maxStock) || 100,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        createdBy: user.uid
      };

      const userInventoryRef = collection(db, 'users', user.uid, 'inventoryItems');
      await addDoc(userInventoryRef, sanitizedItem);

      // Log the action for audit
      await SecurityUtils.logSecurityEvent('inventory_item_added', {
        itemName: sanitizedItem.name,
        category: sanitizedItem.category
      });

    } catch (error) {
      console.error('Failed to add inventory item:', error);
      setError('Failed to add item. Please try again.');
    }
  };

  // Update existing inventory item
  const handleUpdateItem = async (itemId, updatedData) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      // Sanitize input data
      const sanitizedData = {
        name: SecurityUtils.sanitizeInput(updatedData.name),
        description: SecurityUtils.sanitizeInput(updatedData.description || ''),
        category: updatedData.category,
        quantity: parseInt(updatedData.quantity) || 0,
        unit: updatedData.unit || 'each',
        unitCost: parseFloat(updatedData.unitCost) || 0,
        supplier: SecurityUtils.sanitizeInput(updatedData.supplier || ''),
        location: SecurityUtils.sanitizeInput(updatedData.location || ''),
        reorderPoint: parseInt(updatedData.reorderPoint) || 10,
        maxStock: parseInt(updatedData.maxStock) || 100,
        lastUpdated: serverTimestamp()
      };

      const itemRef = doc(db, 'users', user.uid, 'inventoryItems', itemId);
      await updateDoc(itemRef, sanitizedData);

      // Log the action for audit
      await SecurityUtils.logSecurityEvent('inventory_item_updated', {
        itemId,
        itemName: sanitizedData.name
      });

    } catch (error) {
      console.error('Failed to update inventory item:', error);
      setError('Failed to update item. Please try again.');
    }
  };

  // Delete inventory item
  const handleDeleteItem = async (itemId) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      const itemRef = doc(db, 'users', user.uid, 'inventoryItems', itemId);
      await deleteDoc(itemRef);

      // Log the action for audit
      await SecurityUtils.logSecurityEvent('inventory_item_deleted', {
        itemId
      });

    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      setError('Failed to delete item. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading inventory...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
            Inventory Management
          </h1>
          <p className={`text-lg mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
            Track materials, tools, and supplies across all your projects
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Enhanced Inventory Manager Component */}
        <EnhancedInventoryManager
          items={items}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
        />
      </div>
    </div>
  );
};

export default Inventory;