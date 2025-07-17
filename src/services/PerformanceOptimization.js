// src/services/PerformanceOptimization.js
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    doc,
    getDoc
} from 'firebase/firestore';

export class PerformanceOptimizationService {
    constructor(userId) {
        this.userId = userId;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Implement intelligent caching with invalidation
    async getCachedData(key, fetchFunction, forceRefresh = false) {
        const now = Date.now();
        const cached = this.cache.get(key);

        if (!forceRefresh && cached && (now - cached.timestamp < this.cacheTimeout)) {
            return cached.data;
        }

        try {
            const data = await fetchFunction();
            this.cache.set(key, {
                data,
                timestamp: now
            });
            return data;
        } catch (error) {
            // Return cached data if available, even if expired
            if (cached) {
                console.warn('Using expired cache due to fetch error:', error);
                return cached.data;
            }
            throw error;
        }
    }

    // Implement pagination for large datasets
    async getPaginatedJobs(pageSize = 10, lastDoc = null, filters = {}) {
        try {
            let q = query(
                collection(db, 'jobs'),
                where('createdBy', '==', this.userId),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );

            // Add filters
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            const jobs = [];
            let newLastDoc = null;

            snapshot.forEach((doc) => {
                jobs.push({ id: doc.id, ...doc.data() });
                newLastDoc = doc;
            });

            return {
                jobs,
                lastDoc: newLastDoc,
                hasMore: jobs.length === pageSize
            };
        } catch (error) {
            console.error('Failed to fetch paginated jobs:', error);
            throw error;
        }
    }

    // Lazy load components based on user interaction
    async lazyLoadJobDetails(jobId) {
        const cacheKey = `job-details-${jobId}`;

        return this.getCachedData(cacheKey, async () => {
            const jobDoc = await getDoc(doc(db, 'jobs', jobId));
            if (!jobDoc.exists()) {
                throw new Error('Job not found');
            }

            // Load related data in parallel
            const [receipts, tasks, team, documents] = await Promise.all([
                this.getJobReceipts(jobId),
                this.getJobTasks(jobId),
                this.getJobTeam(jobId),
                this.getJobDocuments(jobId)
            ]);

            return {
                job: { id: jobDoc.id, ...jobDoc.data() },
                receipts,
                tasks,
                team,
                documents
            };
        });
    }

    // Optimize Firestore queries with indexes
    async getJobReceipts(jobId, limit = 50) {
        const cacheKey = `receipts-${jobId}`;

        return this.getCachedData(cacheKey, async () => {
            const q = query(
                collection(db, 'jobs', jobId, 'receipts'),
                orderBy('uploadedAt', 'desc'),
                limit(limit)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
    }

    async getJobTasks(jobId) {
        const cacheKey = `tasks-${jobId}`;

        return this.getCachedData(cacheKey, async () => {
            const q = query(
                collection(db, 'jobs', jobId, 'tasks'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
    }

    async getJobTeam(jobId) {
        const cacheKey = `team-${jobId}`;

        return this.getCachedData(cacheKey, async () => {
            const q = query(collection(db, 'jobs', jobId, 'team'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
    }

    async getJobDocuments(jobId) {
        const cacheKey = `documents-${jobId}`;

        return this.getCachedData(cacheKey, async () => {
            const q = query(
                collection(db, 'jobs', jobId, 'documents'),
                orderBy('uploadedAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
    }

    // Batch operations for efficiency
    async batchUpdateAssignments(updates) {
        const batchSize = 500; // Firestore batch limit
        const batches = [];

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            batches.push(batch);
        }

        try {
            const results = await Promise.all(
                batches.map(batch => this.processBatch(batch))
            );

            // Invalidate relevant caches
            this.invalidateCache('assignments');
            this.invalidateCache('dashboard');

            return results.flat();
        } catch (error) {
            console.error('Batch update failed:', error);
            throw error;
        }
    }

    async processBatch(updates) {
        // Process a single batch of updates
        const promises = updates.map(update => this.processUpdate(update));
        return Promise.all(promises);
    }

    // Preload critical data
    async preloadDashboardData() {
        const cacheKeys = [
            'assignments',
            'subcontractors',
            'recent-jobs',
            'dashboard-stats'
        ];

        const preloadPromises = cacheKeys.map(key => {
            switch (key) {
                case 'assignments':
                    return this.getCachedData(key, () => this.fetchAssignments());
                case 'subcontractors':
                    return this.getCachedData(key, () => this.fetchSubcontractors());
                case 'recent-jobs':
                    return this.getCachedData(key, () => this.fetchRecentJobs());
                case 'dashboard-stats':
                    return this.getCachedData(key, () => this.calculateDashboardStats());
                default:
                    return Promise.resolve();
            }
        });

        try {
            await Promise.all(preloadPromises);
            console.log('Dashboard data preloaded successfully');
        } catch (error) {
            console.warn('Some dashboard data failed to preload:', error);
        }
    }

    // Image optimization for receipts and photos
    async optimizeImage(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                // Draw and compress
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Memory management
    clearCache() {
        this.cache.clear();
    }

    invalidateCache(pattern) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    // Performance monitoring
    async monitorPerformance(operation, fn) {
        const start = performance.now();

        try {
            const result = await fn();
            const duration = performance.now() - start;

            // Log slow operations
            if (duration > 1000) {
                console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
            }

            return result;
        } catch (error) {
            const duration = performance.now() - start;
            console.error(`Operation failed: ${operation} after ${duration.toFixed(2)}ms`, error);
            throw error;
        }
    }

    // Connection quality detection
    detectConnectionQuality() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (connection) {
            const { effectiveType, downlink, rtt } = connection;

            return {
                type: effectiveType,
                speed: downlink,
                latency: rtt,
                quality: this.classifyConnection(effectiveType, downlink, rtt)
            };
        }

        return { quality: 'unknown' };
    }

    classifyConnection(effectiveType, downlink, rtt) {
        if (effectiveType === '4g' && downlink > 10 && rtt < 100) {
            return 'excellent';
        } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1)) {
            return 'good';
        } else if (effectiveType === '3g') {
            return 'fair';
        } else {
            return 'poor';
        }
    }
}