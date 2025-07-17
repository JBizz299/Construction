// src/pages/JobPage/BudgetTab.jsx
import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'

export default function BudgetTab({ job }) {
    const [budget, setBudget] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!job?.id) return

        const budgetRef = doc(db, 'jobs', job.id, 'budget', 'current')
        const unsubscribe = onSnapshot(budgetRef, (doc) => {
            if (doc.exists()) {
                setBudget(doc.data())
            } else {
                setBudget({})
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [job?.id])

    const categories = [
        { key: 'materials', label: 'Materials', color: 'bg-blue-100 text-blue-800' },
        { key: 'tools', label: 'Tools & Equipment', color: 'bg-green-100 text-green-800' },
        { key: 'labor', label: 'Labor', color: 'bg-yellow-100 text-yellow-800' },
        { key: 'permits', label: 'Permits & Fees', color: 'bg-purple-100 text-purple-800' },
        { key: 'utilities', label: 'Utilities', color: 'bg-red-100 text-red-800' },
        { key: 'transport', label: 'Transport', color: 'bg-indigo-100 text-indigo-800' },
        { key: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
    ]

    const totalSpent = categories.reduce((sum, cat) => {
        return sum + (budget[cat.key]?.spent || 0)
    }, 0)

    const totalAllocated = categories.reduce((sum, cat) => {
        return sum + (budget[cat.key]?.allocated || 0)
    }, 0)

    if (loading) return <div>Loading budget...</div>

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Budget Overview</h2>
                <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">${totalSpent.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Total Spent</p>
                </div>
            </div>

            {totalAllocated > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded">
                    <div className="flex justify-between items-center mb-2">
                        <span>Overall Budget Progress</span>
                        <span>{((totalSpent / totalAllocated) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (totalSpent / totalAllocated) * 100)}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {categories.map((category) => {
                    const categoryData = budget[category.key] || { allocated: 0, spent: 0 }
                    const percentUsed = categoryData.allocated > 0
                        ? (categoryData.spent / categoryData.allocated) * 100
                        : 0

                    return (
                        <div key={category.key} className="border rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs ${category.color}`}>
                                        {category.label}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">${categoryData.spent.toFixed(2)}</p>
                                    {categoryData.allocated > 0 && (
                                        <p className="text-sm text-gray-500">
                                            / ${categoryData.allocated.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {categoryData.allocated > 0 && (
                                <div className="mt-2">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Progress</span>
                                        <span>{percentUsed.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${percentUsed > 100 ? 'bg-red-500' :
                                                    percentUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${Math.min(100, percentUsed)}%` }}
                                        ></div>
                                    </div>
                                    {percentUsed > 100 && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Over budget by ${(categoryData.spent - categoryData.allocated).toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {categoryData.spent === 0 && (
                                <p className="text-sm text-gray-500 italic">No expenses recorded</p>
                            )}
                        </div>
                    )
                })}
            </div>

            {totalSpent === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>No expenses recorded yet.</p>
                    <p className="text-sm">Upload receipts to automatically track spending by category.</p>
                </div>
            )}
        </div>
    )
}