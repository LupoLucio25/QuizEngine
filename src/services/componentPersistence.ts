import { ComponentDescriptor } from '../types/catalog';
import { validateComponentDescriptor } from '../utils/validation';

/**
 * Salva un componente su filesystem
 * Nota: In un'app React browser-only, non possiamo scrivere direttamente su filesystem.
 * Questo servizio fornisce l'API e il download, ma per il salvataggio reale serve un backend.
 */

export interface SaveComponentResult {
    success: boolean;
    filePath?: string;
    error?: string;
    downloadUrl?: string;
}

/**
 * Genera il path del file per un componente
 */
export function getComponentFilePath(componentId: string): string {
    return `src/catalog/components/${componentId}.json`;
}

/**
 * Valida e prepara il componente per il salvataggio
 */
export function prepareComponentForSave(component: ComponentDescriptor): {
    valid: boolean;
    json?: string;
    errors?: string[];
} {
    const validation = validateComponentDescriptor(component);

    if (!validation.valid) {
        return {
            valid: false,
            errors: validation.errors
        };
    }

    const json = JSON.stringify(component, null, 2);
    return {
        valid: true,
        json
    };
}

/**
 * Salva il componente (download in browser, o API call se backend disponibile)
 */
export async function saveComponent(
    component: ComponentDescriptor,
    options: {
        method?: 'download' | 'api';
        apiEndpoint?: string;
    } = {}
): Promise<SaveComponentResult> {
    const { method = 'download', apiEndpoint } = options;

    // Valida il componente
    const prepared = prepareComponentForSave(component);
    if (!prepared.valid) {
        return {
            success: false,
            error: `Validazione fallita: ${prepared.errors?.join(', ')}`
        };
    }

    // Metodo download (default per browser)
    const blob = new Blob([prepared.json!], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${component.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
        success: true,
        downloadUrl: url,
        filePath: getComponentFilePath(component.id)
    };
}

/**
 * Salva multipli componenti in batch
 */
export async function saveComponentsBatch(
    components: ComponentDescriptor[],
    options: {
        method?: 'download' | 'api';
        apiEndpoint?: string;
    } = {}
): Promise<SaveComponentResult[]> {
    const results: SaveComponentResult[] = [];

    for (const component of components) {
        const result = await saveComponent(component, options);
        results.push(result);
    }

    return results;
}

/**
 * Crea un file ZIP con tutti i componenti (per download batch)
 */
export async function downloadComponentsAsZip(
    components: ComponentDescriptor[]
): Promise<void> {
    // Nota: Richiede libreria JSZip in produzione
    // Per ora, salviamo uno alla volta

    console.log('Download batch di', components.length, 'componenti');

    for (const component of components) {
        await saveComponent(component, { method: 'download' });
        // Piccolo delay per evitare di bloccare il browser
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

/**
 * Genera istruzioni per salvataggio manuale
 */
export function getManualSaveInstructions(component: ComponentDescriptor): string {
    const filePath = getComponentFilePath(component.id);
    const content = JSON.stringify(component, null, 2);

    return `
Per salvare manualmente il componente:

1. Crea il file: ${filePath}
2. Incolla questo contenuto:

${content}

3. Ricarica la pagina per vedere il componente nel catalogo
  `.trim();
}
