// src/services/CrossFunctionalityService.js
import { db } from '../firebase';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';

export class CrossFunctionalityService {
    constructor(userId) {
        this.userId = userId;
    }

    // Add team member to job and automatically create subcontractor if needed
    async addTeamMemberWithDashboardIntegration(jobId, teamMember, autoCreateSubcontractor = true) {
        try {
            // 1. Add team member to job
            const teamRef = collection(db, 'jobs', jobId, 'team');
            const teamDocRef = await addDoc(teamRef, {
                ...teamMember,
                addedAt: serverTimestamp()
            });

            // 2. If team member is a subcontractor, sync with dashboard
            if (autoCreateSubcontractor && teamMember.role === 'subcontractor') {
                await this.syncTeamMemberToSubcontractors(teamMember, teamDocRef.id);
            }

            return { success: true, teamMemberId: teamDocRef.id };
        } catch (error) {
            console.error('Failed to add team member with dashboard integration:', error);
            throw error;
        }
    }

    // Sync team member to subcontractors collection for dashboard use
    async syncTeamMemberToSubcontractors(teamMember, teamMemberId) {
        try {
            const subcontractorRef = doc(db, 'users', this.userId, 'subcontractors', teamMemberId);

            await setDoc(subcontractorRef, {
                id: teamMemberId,
                name: teamMember.name,
                email: teamMember.email,
                company: teamMember.company,
                phone: teamMember.phone,
                specialties: teamMember.specialties || [],
                isActive: true,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            });

            return { success: true, subcontractorId: teamMemberId };
        } catch (error) {
            console.error('Failed to sync team member to subcontractors:', error);
            throw error;
        }
    }

    // Push team member to specific dashboard cell
    async pushTeamMemberToDashboardCell(teamMemberId, dateKey, jobName) {
        try {
            const assignmentsRef = doc(db, 'users', this.userId, 'dashboard', 'assignments');
            const assignmentKey = `${teamMemberId}-${dateKey}`;

            // Get current assignments
            const assignmentDoc = await getDoc(assignmentsRef);
            const currentAssignments = assignmentDoc.exists() ? assignmentDoc.data() : {};

            // Add new assignment
            const updatedAssignments = {
                ...currentAssignments,
                [assignmentKey]: jobName
            };

            await setDoc(assignmentsRef, updatedAssignments);

            return { success: true, assignmentKey };
        } catch (error) {
            console.error('Failed to push team member to dashboard cell:', error);
            throw error;
        }
    }

    // Get available time slots for a team member
    async getAvailableTimeSlots(teamMemberId, startDate, endDate) {
        try {
            const assignmentsRef = doc(db, 'users', this.userId, 'dashboard', 'assignments');
            const assignmentDoc = await getDoc(assignmentsRef);
            const assignments = assignmentDoc.exists() ? assignmentDoc.data() : {};

            const availableSlots = [];
            const current = new Date(startDate);

            while (current <= endDate) {
                const dateKey = current.toISOString().split('T')[0];
                const assignmentKey = `${teamMemberId}-${dateKey}`;

                if (!assignments[assignmentKey]) {
                    availableSlots.push({
                        date: dateKey,
                        formatted: current.toLocaleDateString(),
                        available: true
                    });
                }

                current.setDate(current.getDate() + 1);
            }

            return availableSlots;
        } catch (error) {
            console.error('Failed to get available time slots:', error);
            throw error;
        }
    }

    // Batch assign team member to multiple dates
    async batchAssignToMultipleDates(teamMemberId, dates, jobName) {
        try {
            const assignmentsRef = doc(db, 'users', this.userId, 'dashboard', 'assignments');
            const assignmentDoc = await getDoc(assignmentsRef);
            const currentAssignments = assignmentDoc.exists() ? assignmentDoc.data() : {};

            const updatedAssignments = { ...currentAssignments };

            dates.forEach(dateKey => {
                const assignmentKey = `${teamMemberId}-${dateKey}`;
                updatedAssignments[assignmentKey] = jobName;
            });

            await setDoc(assignmentsRef, updatedAssignments);

            return { success: true, assignedDates: dates };
        } catch (error) {
            console.error('Failed to batch assign to multiple dates:', error);
            throw error;
        }
    }

    // Get team member's current assignments
    async getTeamMemberAssignments(teamMemberId) {
        try {
            const assignmentsRef = doc(db, 'users', this.userId, 'dashboard', 'assignments');
            const assignmentDoc = await getDoc(assignmentsRef);
            const assignments = assignmentDoc.exists() ? assignmentDoc.data() : {};

            const memberAssignments = {};
            Object.entries(assignments).forEach(([key, value]) => {
                if (key.startsWith(`${teamMemberId}-`)) {
                    const dateKey = key.split('-').slice(1).join('-');
                    memberAssignments[dateKey] = value;
                }
            });

            return memberAssignments;
        } catch (error) {
            console.error('Failed to get team member assignments:', error);
            throw error;
        }
    }
}