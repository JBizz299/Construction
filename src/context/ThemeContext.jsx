// src/context/ThemeContext.jsx - Updated with graph paper background
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check localStorage for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setIsDarkMode(savedTheme === 'dark');
        } else {
            // Default to system preference
            setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }, []);

    useEffect(() => {
        // Apply theme to document
        const root = document.documentElement;
        const body = document.body;

        // Clear all previous classes first
        body.classList.remove('dark', 'light', 'graph-paper', 'graph-paper-dark');

        if (isDarkMode) {
            root.setAttribute('data-theme', 'dark');
            body.classList.add('dark');
            body.classList.add('graph-paper-dark');
            
            // Force apply dark graph paper background inline as fallback
            body.style.backgroundImage = 'linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)';
            body.style.backgroundSize = '20px 20px';
            body.style.backgroundColor = '#111827';
            
            console.log('Applied dark theme with graph-paper-dark class');
        } else {
            root.setAttribute('data-theme', 'light');
            body.classList.add('light');
            body.classList.add('graph-paper');
            
            // Force apply light graph paper background inline as fallback
            body.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)';
            body.style.backgroundSize = '20px 20px';
            body.style.backgroundColor = '#fafafa';
            
            console.log('Applied light theme with graph-paper class');
        }

        // Debug: log current body classes
        console.log('Current body classes:', body.className);
        console.log('Current body classList:', Array.from(body.classList));
        console.log('Current body style:', body.style.cssText);

        // Save theme preference
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const value = {
        isDarkMode,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}