import React, { useState, useEffect } from 'react';
import { generationQueue, ComponentGenerationJob } from '../services/componentQueue';

export const ComponentGenerationProgress: React.FC = () => {
    const [jobs, setJobs] = useState<ComponentGenerationJob[]>([]);

    useEffect(() => {
        return generationQueue.subscribe(setJobs);
    }, []);

    const activeJobs = jobs.filter(j =>
        j.status === 'pending' || j.status === 'generating' || j.status === 'validating'
    );

    if (activeJobs.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-sm text-gray-800">
                        Generazione Componenti
                    </span>
                </div>
                <span className="text-xs text-gray-500">{activeJobs.length} in corso</span>
            </div>

            <div className="max-h-64 overflow-y-auto">
                {activeJobs.map(job => (
                    <div key={job.id} className="p-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{job.componentId}</span>
                            <span className="text-xs text-gray-500">
                                {job.status === 'pending' && '⏳ In attesa'}
                                {job.status === 'generating' && '🎨 Generazione'}
                                {job.status === 'validating' && '✓ Validazione'}
                            </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-500 h-2 transition-all duration-300 ease-out"
                                style={{ width: `${job.progress}%` }}
                            />
                        </div>

                        {job.status === 'generating' && (
                            <div className="mt-1 text-xs text-gray-500">
                                L'AI sta creando il componente...
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
