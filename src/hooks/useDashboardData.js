// src/hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobContext';
import { db } from '../firebase';
import {
    collection,
    doc,
    onSnapshot,
    getDoc,
    setDoc
} from 'firebase/firestore';

export function useDashboardData() {
    const { user } = useAuth();
    const { jobs } = useJobs();
    const [assignments, setAssignments] = useState({});
    const [subcontractors, setSubcontractors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Real-time subcontractors listener
    useEffect(() => {
        if (!user) return;

        const subcontractorsRef = collection(db, 'users', user.uid, 'subcontractors');
        const unsubscribe = onSnapshot(
            subcontractorsRef,
            (snapshot) => {
                const subcontractorsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSubcontractors(subcontractorsData);
            },
            (error) => {
                console.error('Error listening to subcontractors:', error);
                setError('Failed to load subcontractors');
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Real-time assignments listener
    useEffect(() => {
        if (!user) return;

        const assignmentsRef = doc(db, 'users', user.uid, 'dashboard', 'assignments');
        const unsubscribe = onSnapshot(
            assignmentsRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setAssignments(snapshot.data());
                } else {
                    setAssignments({});
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error listening to assignments:', error);
                setError('Failed to load assignments');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Update assignment with optimistic updates
    const updateAssignment = async (subId, dateKey, jobName) => {
        if (!user) return;

        try {
            setSaving(true);
            setError(null);

            const newAssignments = {
                ...assignments,
                [`${subId}-${dateKey}`]: jobName,
            };

            // Remove assignment if job is empty
            if (!jobName) {
                delete newAssignments[`${subId}-${dateKey}`];
            }

            // Optimistically update UI
            setAssignments(newAssignments);

            // Save to Firestore
            const docRef = doc(db, 'users', user.uid, 'dashboard', 'assignments');
            await setDoc(docRef, newAssignments);

        } catch (err) {
            console.error('Error updating assignment:', err);
            setError('Failed to save assignment');

            // Revert optimistic update
            const docRef = doc(db, 'users', user.uid, 'dashboard', 'assignments');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setAssignments(docSnap.data());
            }
        } finally {
            setSaving(false);
        }
    };

    // Get job names for dropdown (combining real jobs and static list)
    const getJobOptions = () => {
        const realJobNames = jobs.map(job => job.name);
        const staticJobs = ["Job A", "Job B", "Job C", "Job D"]; // Keep for backward compatibility

        // Combine and deduplicate
        const allJobs = [...new Set([...realJobNames, ...staticJobs])];
        return allJobs.sort();
    };

    // Get assignment statistics
    const getAssignmentStats = () => {
        const totalAssignments = Object.keys(assignments).length;
        const uniqueJobs = new Set(Object.values(assignments)).size;
        const assignedSubcontractors = new Set(
            Object.keys(assignments).map(key => key.split('-')[0])
        ).size;

        return {
            totalAssignments,
            uniqueJobs,
            assignedSubcontractors,
            totalSubcontractors: subcontractors.length
        };
    };

    // Get subcontractor workload
    const getSubcontractorWorkload = (subId, dateRange = 7) => {
        const today = new Date();
        const assignments = [];

        for (let i = 0; i < dateRange; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            const assignmentKey = `${subId}-${dateKey}`;

            if (assignments[assignmentKey]) {
                assignments.push({
                    date: dateKey,
                    job: assignments[assignmentKey]
                });
            }
        }

        return assignments;
    };

    return {
        assignments,
        subcontractors,
        loading,
        saving,
        error,
        updateAssignment,
        getJobOptions,
        getAssignmentStats,
        getSubcontractorWorkload
    };
}