// src/components/EnhancedInventoryManager.jsx
import React, { useState, useEffect } from 'react';
import {
    Package,
    AlertTriangle,
    TrendingDown,
    Search,
    Filter,
    Plus,
    Edit3,
    Trash2,
    Download,
    Upload,
    BarChart3,
    MapPin
} from 'lucide-react';

export default function EnhancedInventoryManager({ items, onAddItem, onUpdateItem, onDeleteItem }) {
    const [filteredItems, setFilteredItems] = useState(items);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [showLowStock, setShowLowStock] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Categories for construction materials
    const categories = [
        'all', 'lumber', 'hardware', 'electrical', 'plumbing',
        'drywall', 'flooring', 'roofing', 'insulation', 'tools', 'other'
    ];

    // Filter and search logic
    useEffect(() => {
        let filtered = items;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(item => item.category === filterCategory);
        }

        // Low stock filter
        if (showLowStock) {
            filtered = filtered.filter(item =>
                item.quantity <= (item.reorderPoint || 10)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'quantity':
                    return b.quantity - a.quantity;
                case 'value':
                    return (b.quantity * b.unitCost) - (a.quantity * a.unitCost);
                case 'lastUsed':
                    return new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0);
                default:
                    return 0;
            }
        });

        setFilteredItems(filtered);
    }, [items, searchTerm, filterCategory, showLowStock, sortBy]);

    // Calculate inventory stats
    const inventoryStats = {
        totalItems: items.length,
        totalValue: items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
        lowStockItems: items.filter(item => item.quantity <= (item.reorderPoint || 10)).length,
        outOfStockItems: items.filter(item => item.quantity === 0).length
    };

    const InventoryForm = ({ item, onSave, onCancel }) => {
        const [formData, setFormData] = useState(item || {
            name: '',
            description: '',
            category: 'other',
            quantity: 0,
            unit: 'each',
            unitCost: 0,
            supplier: '',
            location: '',
            reorderPoint: 10,
            maxStock: 100
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">
                        {item ? 'Edit Item' : 'Add New Item'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {categories.slice(1).map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="2"
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min="0"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit
                                </label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="each">Each</option>
                                    <option value="box">Box</option>
                                    <option value="bag">Bag</option>
                                    <option value="roll">Roll</option>
                                    <option value="sheet">Sheet</option>
                                    <option value="linear-ft">Linear Ft</option>
                                    <option value="sq-ft">Sq Ft</option>
                                    <option value="cubic-ft">Cubic Ft</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit Cost
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.unitCost}
                                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reorder Point
                                </label>
                                <input
                                    type="number"
                                    value={formData.reorderPoint}
                                    onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier
                                </label>
                                <input
                                    type="text"
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Warehouse A, Shelf 3, etc."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {item ? 'Update Item' : 'Add Item'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Items</p>
                            <p className="text-2xl font-bold">{inventoryStats.totalItems}</p>
                        </div>
                        <Package className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Value</p>
                            <p className="text-2xl font-bold">${inventoryStats.totalValue.toFixed(2)}</p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Low Stock</p>
                            <p className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockItems}</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-orange-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStockItems}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="quantity">Sort by Quantity</option>
                            <option value="value">Sort by Value</option>
                            <option value="lastUsed">Sort by Last Used</option>
                        </select>

                        <button
                            onClick={() => setShowLowStock(!showLowStock)}
                            className={`px-3 py-2 rounded-lg transition-colors ${showLowStock
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Low Stock Only
                        </button>

                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Item
                        </button>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unit Cost</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Value</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            {item.description && (
                                                <p className="text-sm text-gray-500">{item.description}</p>
                                            )}
                                            {item.supplier && (
                                                <p className="text-xs text-gray-400">Supplier: {item.supplier}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">{item.quantity}</span>
                                            <span className="text-sm text-gray-500">{item.unit}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-gray-900">${item.unitCost?.toFixed(2) || '0.00'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-medium">${((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <MapPin className="w-3 h-3" />
                                            {item.location || 'Not specified'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.quantity === 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Out of Stock
                                            </span>
                                        ) : item.quantity <= (item.reorderPoint || 10) ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                Low Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                In Stock
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Edit item"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this item?')) {
                                                        onDeleteItem(item.id);
                                                    }
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Delete item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredItems.length === 0 && (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {searchTerm || filterCategory !== 'all' || showLowStock
                                    ? 'No items match your current filters'
                                    : 'No inventory items found. Add your first item to get started.'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Forms */}
            {showAddForm && (
                <InventoryForm
                    onSave={(itemData) => {
                        onAddItem(itemData);
                        setShowAddForm(false);
                    }}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {editingItem && (
                <InventoryForm
                    item={editingItem}
                    onSave={(itemData) => {
                        onUpdateItem(editingItem.id, itemData);
                        setEditingItem(null);
                    }}
                    onCancel={() => setEditingItem(null)}
                />
            )}
        </div>
    );
}