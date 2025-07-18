// src/components/ConstructionUI.jsx - Reusable UI components
import { useTheme } from '../context/ThemeContext';

// Enhanced Card Component
export function ConstructionCard({ children, className = '', hover = true, ...props }) {
    const { isDarkMode } = useTheme();

    return (
        <div
            className={`${isDarkMode ? 'construction-card-dark' : 'construction-card'} 
                 ${hover ? 'hover-lift' : ''} 
                 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

// Enhanced Button Component
export function ConstructionButton({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
        primary: 'construction-button-primary',
        secondary: 'construction-button-secondary',
        orange: 'construction-button-orange'
    };

    return (
        <button
            className={`construction-button ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

// Enhanced Input Component
export function ConstructionInput({
    className = '',
    ...props
}) {
    const { isDarkMode } = useTheme();

    return (
        <input
            className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 
                 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
                 ${isDarkMode
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
                    : 'bg-white/90 border-gray-200 text-gray-900 placeholder-gray-500'
                } ${className}`}
            {...props}
        />
    );
}

// Page Container Component
export function ConstructionPage({ children, className = '', title, subtitle }) {
    const { isDarkMode } = useTheme();

    return (
        <div className={`min-h-screen paper-texture ${className}`}>
            <div className="max-w-7xl mx-auto px-6 py-8">
                {(title || subtitle) && (
                    <div className="space-y-2 mb-8">
                        {title && (
                            <h1 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className={`text-lg max-w-2xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

// Grid Container Component
export function ConstructionGrid({ children, className = '', cols = 'auto' }) {
    const colClasses = {
        auto: 'construction-grid',
        1: 'grid grid-cols-1 gap-6',
        2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
        3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
    };

    return (
        <div className={`${colClasses[cols]} ${className}`}>
            {children}
        </div>
    );
}

// Enhanced Section Component
export function ConstructionSection({
    children,
    title,
    className = '',
    showDivider = false
}) {
    const { isDarkMode } = useTheme();

    return (
        <section className={className}>
            {title && (
                <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                    {title}
                </h2>
            )}
            {children}
            {showDivider && <div className="construction-divider" />}
        </section>
    );
}

// Loading Component
export function ConstructionLoading({ text = 'Loading...' }) {
    const { isDarkMode } = useTheme();

    return (
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4 construction-loading" />
                <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {text}
                </p>
            </div>
        </div>
    );
}

// Alert/Notification Component
export function ConstructionAlert({
    type = 'info',
    title,
    message,
    className = '',
    onClose
}) {
    const { isDarkMode } = useTheme();

    const typeStyles = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-orange-50 border-orange-200 text-orange-800',
        error: 'bg-red-50 border-red-200 text-red-800'
    };

    const darkTypeStyles = {
        info: 'bg-blue-900/20 border-blue-700 text-blue-300',
        success: 'bg-green-900/20 border-green-700 text-green-300',
        warning: 'bg-orange-900/20 border-orange-700 text-orange-300',
        error: 'bg-red-900/20 border-red-700 text-red-300'
    };

    const styles = isDarkMode ? darkTypeStyles[type] : typeStyles[type];

    return (
        <div className={`p-4 rounded-lg border ${styles} ${className}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    {title && (
                        <h4 className="font-medium mb-1">{title}</h4>
                    )}
                    <p className="text-sm">{message}</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-4 text-sm hover:opacity-70"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}