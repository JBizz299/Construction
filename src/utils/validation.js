// src/utils/validation.js
export const validators = {
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    sanitizeString: (str) => {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/[<>]/g, '');
    },

    validateJobData: (jobData) => {
        const errors = {};

        if (!jobData.name || jobData.name.length < 2) {
            errors.name = 'Job name must be at least 2 characters';
        }

        if (jobData.budget && (isNaN(jobData.budget) || jobData.budget < 0)) {
            errors.budget = 'Budget must be a positive number';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    validateInventoryItem: (item) => {
        const errors = {};

        if (!item.name || item.name.length < 1) {
            errors.name = 'Item name is required';
        }

        if (!item.sku || item.sku.length < 1) {
            errors.sku = 'SKU is required';
        }

        if (item.quantity && (isNaN(item.quantity) || item.quantity < 0)) {
            errors.quantity = 'Quantity must be a positive number';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};