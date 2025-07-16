export default function BudgetTab({ job }) {
    if (!job) return null
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Budget</h2>
            <p className="text-gray-700">
                Estimated Budget: <span className="font-semibold">{job.budget || '—'}</span>
            </p>
            <p className="text-gray-700">
                Amount Spent: <span className="font-semibold">{job.amountSpent || '—'}</span>
            </p>
            <p className="text-gray-700">
                Remaining Budget: <span className="font-semibold">{job.remainingBudget || '—'}</span>
            </p>

            <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Budget Allocation</h3>
                <div className="flex flex-wrap gap-2">
                    {job.budgetAllocation?.map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-gray-100 border p-3 rounded flex-1 min-w-[200px]"
                        >
                            <p className="text-sm text-gray-600">{item.category}</p>
                            <p className="text-lg font-semibold">{item.amount}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Expenses</h3>
                <ul className="space-y-2">
                    {job.expenses?.map((expense, idx) => (
                        <li
                            key={idx}
                            className="border p-3 rounded flex justify-between items-center"
                        >
                            <div>
                                <p className="text-sm text-gray-600">{expense.date}</p>
                                <p className="font-semibold">{expense.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Amount</p>
                                <p className="font-semibold">{expense.amount}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}