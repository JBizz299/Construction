// src/pages/JobPage/TeamTab.jsx
import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { CrossFunctionalityService } from '../../services/CrossFunctionalityService';
import { useAuth } from '../../context/AuthContext';
import { format, addDays, startOfWeek } from 'date-fns';

export default function TeamTab({
    jobId,
    jobName,
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
    const { user } = useAuth();
    const [crossService] = useState(() => new CrossFunctionalityService(user?.uid));
    const [selectedMember, setSelectedMember] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedDates, setSelectedDates] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [currentAssignments, setCurrentAssignments] = useState({});

    // Enhanced add member function with dashboard integration
    const handleAddMemberWithIntegration = async () => {
        if (!newMember.name || !newMember.email) return;

        try {
            const isSubcontractor = newMember.role === 'subcontractor';

            if (isSubcontractor) {
                // Use cross-functionality service for subcontractors
                await crossService.addTeamMemberWithDashboardIntegration(
                    jobId,
                    newMember,
                    true // auto-create subcontractor
                );
            } else {
                // Use original function for regular team members
                await handleAddMember();
            }

            // Show success message
            setShowSuccessMessage(`${newMember.name} added successfully${isSubcontractor ? ' and synced to dashboard' : ''}`);

            // Reset form
            setNewMember({ name: '', email: '', role: '', company: '', phone: '', permissions: [] });
            setShowAddMember(false);

        } catch (error) {
            console.error('Failed to add team member:', error);
            alert('Failed to add team member. Please try again.');
        }
    };

    // Load available time slots for a team member
    const loadAvailableSlots = async (memberId) => {
        try {
            const startDate = new Date();
            const endDate = addDays(startDate, 14); // Next 2 weeks

            const slots = await crossService.getAvailableTimeSlots(memberId, startDate, endDate);
            setAvailableSlots(slots);

            const assignments = await crossService.getTeamMemberAssignments(memberId);
            setCurrentAssignments(assignments);
        } catch (error) {
            console.error('Failed to load available slots:', error);
        }
    };

    // Push team member to dashboard cell
    const pushToDashboardCell = async (memberId, dateKey) => {
        try {
            await crossService.pushTeamMemberToDashboardCell(memberId, dateKey, jobName);

            // Refresh assignments
            await loadAvailableSlots(memberId);

            alert('Team member successfully scheduled in dashboard!');
        } catch (error) {
            console.error('Failed to push to dashboard:', error);
            alert('Failed to schedule team member. Please try again.');
        }
    };

    // Batch assign to multiple dates
    const batchAssignDates = async () => {
        if (!selectedMember || selectedDates.length === 0) return;

        try {
            await crossService.batchAssignToMultipleDates(
                selectedMember.id,
                selectedDates,
                jobName
            );

            setSelectedDates([]);
            setShowScheduleModal(false);
            await loadAvailableSlots(selectedMember.id);

            alert(`Successfully scheduled ${selectedMember.name} for ${selectedDates.length} dates!`);
        } catch (error) {
            console.error('Failed to batch assign dates:', error);
            alert('Failed to schedule dates. Please try again.');
        }
    };

    // Quick schedule for today
    const scheduleForToday = async (member) => {
        const today = new Date().toISOString().split('T')[0];
        await pushToDashboardCell(member.id, today);
    };

    // Quick schedule for tomorrow
    const scheduleForTomorrow = async (member) => {
        const tomorrow = addDays(new Date(), 1).toISOString().split('T')[0];
        await pushToDashboardCell(member.id, tomorrow);
    };

    const renderMemberCard = (member) => {
        const isSubcontractor = member.role === 'subcontractor';
        const hasAssignments = Object.keys(currentAssignments).length > 0;

        return (
            <div key={member.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{member.name}</h3>
                            {isSubcontractor && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    Subcontractor
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>{member.role} • {member.email}</p>
                            {member.company && <p>Company: {member.company}</p>}
                            {member.phone && <p>Phone: {member.phone}</p>}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleEditMember(member.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                </div>

                {/* Dashboard Integration Actions */}
                {isSubcontractor && (
                    <div className="border-t pt-3 mt-3">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Dashboard Scheduling
                        </h4>

                        <div className="flex flex-wrap gap-2 mb-3">
                            <button
                                onClick={() => scheduleForToday(member)}
                                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm hover:bg-green-200 transition-colors"
                            >
                                Schedule Today
                            </button>
                            <button
                                onClick={() => scheduleForTomorrow(member)}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors"
                            >
                                Schedule Tomorrow
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedMember(member);
                                    loadAvailableSlots(member.id);
                                    setShowScheduleModal(true);
                                }}
                                className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm hover:bg-purple-200 transition-colors"
                            >
                                Batch Schedule
                            </button>
                        </div>

                        {/* Current Assignments Preview */}
                        {hasAssignments && (
                            <div className="text-xs text-gray-500">
                                <div className="flex items-center gap-1 mb-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Current assignments:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {Object.entries(currentAssignments).slice(0, 3).map(([date, job]) => (
                                        <span key={date} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                            {format(new Date(date), 'MMM dd')}
                                        </span>
                                    ))}
                                    {Object.keys(currentAssignments).length > 3 && (
                                        <span className="text-gray-400">+{Object.keys(currentAssignments).length - 3} more</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Team Members</h2>
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => setShowAddMember(true)}
                >
                    + Add Team Member
                </button>
            </div>

            {/* Team Members Grid */}
            <div className="grid gap-4 mb-6">
                {team.map(renderMemberCard)}
            </div>

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>

                        <form onSubmit={(e) => { e.preventDefault(); handleAddMemberWithIntegration(); }} className="space-y-4">
                            <input
                                className="border p-3 w-full rounded-lg"
                                placeholder="Full Name"
                                value={newMember.name}
                                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                required
                            />

                            <input
                                className="border p-3 w-full rounded-lg"
                                placeholder="Email Address"
                                type="email"
                                value={newMember.email}
                                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                required
                            />

                            <select
                                className="border p-3 w-full rounded-lg"
                                value={newMember.role}
                                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                required
                            >
                                <option value="">Select Role</option>
                                <option value="subcontractor">Subcontractor</option>
                                <option value="project_manager">Project Manager</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="worker">Worker</option>
                                <option value="inspector">Inspector</option>
                            </select>

                            <input
                                className="border p-3 w-full rounded-lg"
                                placeholder="Company (optional)"
                                value={newMember.company}
                                onChange={(e) => setNewMember({ ...newMember, company: e.target.value })}
                            />

                            <input
                                className="border p-3 w-full rounded-lg"
                                placeholder="Phone (optional)"
                                value={newMember.phone}
                                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                            />

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Add Member
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddMember(false)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Batch Schedule Modal */}
            {showScheduleModal && selectedMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">
                            Schedule {selectedMember.name} for Multiple Dates
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {availableSlots.map((slot) => (
                                <label key={slot.date} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                    <input
                                        type="checkbox"
                                        checked={selectedDates.includes(slot.date)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedDates([...selectedDates, slot.date]);
                                            } else {
                                                setSelectedDates(selectedDates.filter(d => d !== slot.date));
                                            }
                                        }}
                                    />
                                    <span className="text-sm">{slot.formatted}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={batchAssignDates}
                                disabled={selectedDates.length === 0}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                Schedule {selectedDates.length} Dates
                            </button>
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}