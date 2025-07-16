export default function TasksTab({
    tasks,
    newTaskName,
    setNewTaskName,
    newTaskDue,
    setNewTaskDue,
    handleAddTask,
    cycleTaskStatus,
    deleteTask,
}) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Tasks / Schedule</h2>
            <form
                onSubmit={handleAddTask}
                className="mb-4 flex flex-wrap gap-2 items-center"
            >
                <input
                    type="text"
                    placeholder="Task name"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="border px-2 py-1 rounded"
                />
                <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="border px-2 py-1 rounded"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                    Add Task
                </button>
            </form>
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className="border p-3 rounded flex justify-between items-center mb-2"
                >
                    <div>
                        <p className="font-semibold">{task.name}</p>
                        <p className="text-sm text-gray-500">
                            Due: {task.dueDate?.toDate().toLocaleDateString() || '—'} | Status:{' '}
                            {task.status}
                        </p>
                    </div>
                    <div className="flex space-x-2 text-sm">
                        <button
                            onClick={() => cycleTaskStatus(task)}
                            className="text-yellow-600 underline"
                        >
                            Next Status
                        </button>
                        <button
                            onClick={() => deleteTask(task)}
                            className="text-red-600 underline"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}