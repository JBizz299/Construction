// src/utils/SecurityUtils.js
import { auth, db } from '../firebase';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    addDoc,
    query,
    where,
    getDocs
} from 'firebase/firestore';

export class SecurityUtils {
    // Validate user permissions for job access
    static async validateJobAccess(userId, jobId, requiredPermission = 'read') {
        try {
            const jobRef = doc(db, 'jobs', jobId);
            const jobDoc = await getDoc(jobRef);

            if (!jobDoc.exists()) {
                throw new Error('Job not found');
            }

            const jobData = jobDoc.data();

            // Check if user is the job owner
            if (jobData.createdBy === userId) {
                return true;
            }

            // Check team permissions
            const teamRef = collection(db, 'jobs', jobId, 'team');
            const teamQuery = query(teamRef, where('userId', '==', userId));
            const teamSnapshot = await getDocs(teamQuery);

            if (teamSnapshot.empty) {
                throw new Error('Access denied: Not a team member');
            }

            const memberData = teamSnapshot.docs[0].data();
            const hasPermission = memberData.permissions?.includes(requiredPermission) ||
                memberData.permissions?.includes('admin');

            if (!hasPermission) {
                throw new Error(`Access denied: Missing ${requiredPermission} permission`);
            }

            return true;
        } catch (error) {
            console.error('Permission validation failed:', error);
            throw error;
        }
    }

    // Sanitize user input to prevent XSS
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocols
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }

    // Validate file uploads
    static validateFileUpload(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
        const errors = [];

        if (!file) {
            errors.push('No file selected');
            return errors;
        }

        // Check file size (default 10MB)
        if (file.size > maxSize) {
            errors.push(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
        }

        // Check file type
        if (allowedTypes.length > 0) {
            const isValidType = allowedTypes.some(type => {
                if (type.startsWith('.')) {
                    return file.name.toLowerCase().endsWith(type);
                }
                return file.type.startsWith(type);
            });

            if (!isValidType) {
                errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
            }
        }

        // Check for potentially dangerous file extensions
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
        const fileName = file.name.toLowerCase();

        if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
            errors.push('File type not permitted for security reasons');
        }

        return errors;
    }

    // Rate limiting for API calls
    static createRateLimiter(maxCalls = 10, windowMs = 60000) {
        const calls = new Map();

        return (userId) => {
            const now = Date.now();
            const userCalls = calls.get(userId) || [];

            // Remove old calls outside the window
            const recentCalls = userCalls.filter(time => now - time < windowMs);

            if (recentCalls.length >= maxCalls) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            recentCalls.push(now);
            calls.set(userId, recentCalls);

            return true;
        };
    }

    // Audit logging for sensitive operations
    static async logSecurityEvent(eventType, details, userId = null) {
        try {
            const auditRef = collection(db, 'securityAudit');
            await addDoc(auditRef, {
                eventType,
                details,
                userId: userId || auth.currentUser?.uid,
                timestamp: serverTimestamp(),
                ip: await this.getUserIP(),
                userAgent: navigator.userAgent
            });
        } catch (error) {
            console.error('Failed to log security event:', error);
            // Don't throw - logging failures shouldn't break the app
        }
    }

    // Get user IP for audit logging
    static async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Password strength checker
    static checkPasswordStrength(password) {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const score = Object.values(checks).filter(Boolean).length;

        return {
            score,
            checks,
            strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong',
            isValid: score >= 3
        };
    }
}