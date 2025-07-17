// src/hooks/useErrorHandler.js
import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAsync = useCallback(async (asyncFunction) => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await asyncFunction();
            return result;
        } catch (err) {
            console.error('Error in async operation:', err);
            setError(err.message || 'An unexpected error occurred');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        error,
        isLoading,
        handleAsync,
        clearError
    };
};