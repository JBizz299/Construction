export default function TeamTab({
    team,
    showAddMember,
    setShowAddMember,
    newMember,
    setNewMember,
    handleAddMember,
    handleRemoveMember,
    editMemberId,
    editMember,
    handleEditMember,
    handleSaveEditMember,
    handleCancelEdit,
    setEditMember,
}) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Team Members</h2>
            <button
                className="bg-blue-600 text-white px-3 py-1 rounded mb-4"
                onClick={() => setShowAddMember(true)}
            >
                + Add Member
            </button>
            <ul className="space-y-2">
                {team.map((member) => (
                    <li
                        key={member.id}
                        className="border p-3 rounded flex justify-between items-center"
                    >
                        <div>
                            <div className="font-semibold">{member.name}</div>
                            <div className="text-sm text-gray-600">
                                {member.role} | {member.email}
                            </div>
                            <div className="text-xs text-gray-500">
                                {member.company && <>Company: {member.company} | </>}
                                {member.phone && <>Phone: {member.phone}</>}
                            </div>
                            <div className="text-xs text-gray-400">
                                Permissions: {member.permissions && member.permissions.length > 0
                                    ? member.permissions.join(', ')
                                    : '—'}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEditMember(member)}
                                className="text-blue-600 underline text-sm"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-600 underline text-sm"
                            >
                                Remove
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            {showAddMember && (
                <form onSubmit={handleAddMember} className="mt-4 space-y-2 bg-gray-50 p-4 rounded">
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Name"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        required
                    />
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        required
                    />
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Role"
                        value={newMember.role}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        required
                    />
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Company (optional)"
                        value={newMember.company}
                        onChange={(e) => setNewMember({ ...newMember, company: e.target.value })}
                    />
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Phone (optional)"
                        value={newMember.phone}
                        onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    />
                    <label className="block text-sm font-medium mt-2">Permissions</label>
                    <select
                        multiple
                        className="border p-2 w-full rounded"
                        value={newMember.permissions}
                        onChange={(e) =>
                            setNewMember({
                                ...newMember,
                                permissions: Array.from(e.target.selectedOptions, (opt) => opt.value),
                            })
                        }
                    >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                        <option value="assign_tasks">Assign Tasks</option>
                        <option value="manage_team">Manage Team</option>
                    </select>
                    <div className="flex gap-2 mt-2">
                        <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit">
                            Add Member
                        </button>
                        <button
                            className="text-gray-600 underline"
                            type="button"
                            onClick={() => setShowAddMember(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
            {editMemberId && (
                <form onSubmit={handleSaveEditMember} className="mt-4 space-y-2 bg-gray-50 p-4 rounded">
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Name"
                        value={editMember.name}
                        onChange={(e) => setEditMember({ ...editMember, name: e.target.value })}
                        required
                    />
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Email"
                        value={editMember.email}
                        onChange={(e) => setEditMember({ ...editMember, email: e.target.value })}
                        required
                    />
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Role"
                        value={editMember.role}
                        onChange={(e) => setEditMember({ ...editMember, role: e.target.value })}
                        required
                    />
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Company (optional)"
                        value={editMember.company}
                        onChange={(e) => setEditMember({ ...editMember, company: e.target.value })}
                    />
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Phone (optional)"
                        value={editMember.phone}
                        onChange={(e) => setEditMember({ ...editMember, phone: e.target.value })}
                    />
                    <label className="block text-sm font-medium mt-2">Permissions</label>
                    <select
                        multiple
                        className="border p-2 w-full rounded"
                        value={editMember.permissions}
                        onChange={(e) =>
                            setEditMember({
                                ...editMember,
                                permissions: Array.from(e.target.selectedOptions, (opt) => opt.value),
                            })
                        }
                    >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                        <option value="assign_tasks">Assign Tasks</option>
                        <option value="manage_team">Manage Team</option>
                    </select>
                    <div className="flex gap-2 mt-2">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
                            Save
                        </button>
                        <button
                            className="text-gray-600 underline"
                            type="button"
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}