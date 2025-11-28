import { ComponentDescriptor } from '../types/catalog';

export interface ComponentGenerationJob {
    id: string;
    componentId: string;
    status: 'pending' | 'generating' | 'validating' | 'completed' | 'error';
    progress: number; // 0-100
    component?: ComponentDescriptor;
    error?: string;
    createdAt: number;
}

class ComponentGenerationQueue {
    private jobs: Map<string, ComponentGenerationJob> = new Map();
    private listeners: Set<(jobs: ComponentGenerationJob[]) => void> = new Set();

    addJob(componentId: string, category?: string): string {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const job: ComponentGenerationJob = {
            id: jobId,
            componentId,
            status: 'pending',
            progress: 0,
            createdAt: Date.now()
        };

        this.jobs.set(jobId, job);
        this.notifyListeners();

        return jobId;
    }

    updateJob(jobId: string, updates: Partial<ComponentGenerationJob>) {
        const job = this.jobs.get(jobId);
        if (job) {
            Object.assign(job, updates);
            this.notifyListeners();
        }
    }

    getJob(jobId: string): ComponentGenerationJob | undefined {
        return this.jobs.get(jobId);
    }

    getAllJobs(): ComponentGenerationJob[] {
        return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
    }

    getActiveJobs(): ComponentGenerationJob[] {
        return this.getAllJobs().filter(
            job => job.status === 'pending' || job.status === 'generating' || job.status === 'validating'
        );
    }

    subscribe(listener: (jobs: ComponentGenerationJob[]) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        const jobs = this.getAllJobs();
        this.listeners.forEach(listener => listener(jobs));
    }

    clearCompleted() {
        const toDelete: string[] = [];
        this.jobs.forEach((job, id) => {
            if (job.status === 'completed' || job.status === 'error') {
                toDelete.push(id);
            }
        });
        toDelete.forEach(id => this.jobs.delete(id));
        this.notifyListeners();
    }
}

export const generationQueue = new ComponentGenerationQueue();
