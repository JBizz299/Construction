import React from 'react';

export default function LoadingSkeleton() {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="mb-4">
                <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Job board skeleton */}
            <div className="grid grid-cols-8 gap-2">
                {/* Header row */}
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ))}

                {/* Data rows */}
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                        {Array.from({ length: 7 }).map((_, colIndex) => (
                            <div key={colIndex} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}