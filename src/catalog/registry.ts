import { ComponentDescriptor } from '../types/catalog';

// In-memory registry che può essere aggiornato dinamicamente
let componentsCache: Map<string, ComponentDescriptor> = new Map();
let listeners: Set<() => void> = new Set();

/**
 * Importa dinamicamente tutti i componenti dal catalogo
 */
async function loadAllComponents(): Promise<ComponentDescriptor[]> {
    const components: ComponentDescriptor[] = [];

    // Importazione statica (build-time)
    // @ts-ignore - Vite fornisce import.meta.glob
    const modules = import.meta.glob('../catalog/components/*.json', { eager: true });

    for (const module of Object.values(modules)) {
        const component = (module as any).default as ComponentDescriptor;
        components.push(component);
        componentsCache.set(component.id, component);
    }

    return components;
}

/**
 * Inizializza il registry
 */
let initialized = false;
export async function initializeRegistry(): Promise<void> {
    if (initialized) return;
    await loadAllComponents();
    initialized = true;
}

/**
 * Ottiene un componente per ID
 */
export function getComponent(id: string): ComponentDescriptor | undefined {
    return componentsCache.get(id);
}

/**
 * Ottiene tutti i componenti
 */
export function getAllComponents(): ComponentDescriptor[] {
    return Array.from(componentsCache.values());
}

/**
 * Ottiene componenti per categoria
 */
export function getComponentsByCategory(category: string): ComponentDescriptor[] {
    return getAllComponents().filter(c => c.category === category);
}

/**
 * Aggiunge un componente al registry (runtime)
 */
export function addComponent(component: ComponentDescriptor): void {
    componentsCache.set(component.id, component);
    notifyListeners();
}

/**
 * Aggiorna un componente esistente (runtime)
 */
export function updateComponent(component: ComponentDescriptor): void {
    if (componentsCache.has(component.id)) {
        componentsCache.set(component.id, component);
        notifyListeners();
    }
}

/**
 * Rimuove un componente (runtime)
 */
export function removeComponent(id: string): void {
    componentsCache.delete(id);
    notifyListeners();
}

/**
 * Registra un listener per cambiamenti del catalogo
 */
export function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Notifica tutti i listener
 */
function notifyListeners(): void {
    listeners.forEach(listener => listener());
}

/**
 * Verifica se un componente esiste
 */
export function hasComponent(id: string): boolean {
    return componentsCache.has(id);
}

/**
 * Ottiene statistiche del catalogo
 */
export interface CatalogStats {
    total: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
}

export function getCatalogStats(): CatalogStats {
    const components = getAllComponents();
    const stats: CatalogStats = {
        total: components.length,
        byCategory: {},
        byType: {}
    };

    components.forEach(comp => {
        stats.byCategory[comp.category] = (stats.byCategory[comp.category] || 0) + 1;
        stats.byType[comp.type] = (stats.byType[comp.type] || 0) + 1;
    });

    return stats;
}

// Auto-inizializza al primo import
initializeRegistry();

// Export del registry come oggetto (retrocompatibilità)
export const ComponentRegistry: Record<string, ComponentDescriptor> = new Proxy({}, {
    get: (_, prop: string) => componentsCache.get(prop),
    has: (_, prop: string) => componentsCache.has(prop),
    ownKeys: () => Array.from(componentsCache.keys()),
    getOwnPropertyDescriptor: (_, prop: string) => {
        if (componentsCache.has(prop)) {
            return {
                enumerable: true,
                configurable: true,
                value: componentsCache.get(prop)
            };
        }
        return undefined;
    }
});
