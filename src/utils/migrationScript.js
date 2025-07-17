// src/utils/migrationScript.js
import { db } from '../firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { subcontractors } from '../data/sampleSubs';

export class MigrationService {
    constructor(userId) {
        this.userId = userId;
    }

    // Migrate static subcontractors to user's Firestore collection
    async migrateSubcontractors() {
        try {
            console.log('Starting subcontractor migration...');

            for (const sub of subcontractors) {
                const subRef = doc(db, 'users', this.userId, 'subcontractors', sub.id.toString());

                await setDoc(subRef, {
                    id: sub.id.toString(),
                    name: sub.name,
                    email: '', // Default empty - user can fill later
                    company: sub.name, // Use name as company initially
                    phone: '',
                    specialties: [],
                    isActive: true,
                    createdAt: serverTimestamp(),
                    lastUpdated: serverTimestamp(),
                    migratedFrom: 'static_data'
                });
            }

            console.log('Subcontractor migration completed successfully');
            return { success: true, migrated: subcontractors.length };

        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }

    // Check if migration is needed
    async checkMigrationStatus() {
        try {
            const subcontractorsRef = collection(db, 'users', this.userId, 'subcontractors');
            const snapshot = await getDocs(subcontractorsRef);

            return {
                hasMigrated: !snapshot.empty,
                existingCount: snapshot.size,
                needsMigration: snapshot.empty && subcontractors.length > 0
            };
        } catch (error) {
            console.error('Failed to check migration status:', error);
            return { hasMigrated: false, needsMigration: true };
        }
    }

    // Auto-migrate on first dashboard load
    async autoMigrateIfNeeded() {
        try {
            const status = await this.checkMigrationStatus();

            if (status.needsMigration) {
                console.log('Auto-migrating static data...');
                await this.migrateSubcontractors();
                return { migrated: true };
            }

            return { migrated: false, reason: 'No migration needed' };
        } catch (error) {
            console.error('Auto-migration failed:', error);
            return { migrated: false, error: error.message };
        }
    }
}