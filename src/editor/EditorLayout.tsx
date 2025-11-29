import React, { useState } from 'react';
import { SceneJSON } from '../types/scene';
import { ComponentDescriptor } from '../types/catalog';
import { SceneRenderer } from '../engine/SceneRenderer';
import { getAllComponents, ComponentRegistry, removeComponent } from '../catalog/registry';
import { validateSceneWithCatalog } from '../utils/validation';
import { callSceneDirector, extractJSONFromResponse, Message } from '../services/llm';
import { autoGenerateComponent } from '../services/componentDesigner';
import { generationQueue } from '../services/componentQueue';
import { ComponentGenerationProgress } from '../components/ComponentGenerationProgress';
import { ComponentEditorModal } from '../components/ComponentEditorModal';

interface EditorLayoutProps {
    initialScene: SceneJSON;
}

type EditorTab = 'scene' | 'components';

const categoryTranslations: Record<string, string> = {
    'vehicle': 'Veicoli',
    'pedestrian': 'Pedoni',
    'sign': 'Segnali',
    'road_surface': 'Superfici Stradali',
    'infrastructure': 'Infrastrutture',
    'icon': 'Icone',
    'abstract': 'Astratti',
    'ui': 'Interfaccia'
};

export const EditorLayout: React.FC<EditorLayoutProps> = ({ initialScene }) => {
    const [activeTab, setActiveTab] = useState<EditorTab>('scene');
    const [scene, setScene] = useState<SceneJSON>(initialScene);
    const [jsonText, setJsonText] = useState(JSON.stringify(initialScene, null, 2));
    const [chatInput, setChatInput] = useState('');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [missingComponents, setMissingComponents] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [editingComponent, setEditingComponent] = useState<ComponentDescriptor | null>(null);
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string, reasoning?: string }[]>([
        {
            role: 'ai',
            text: '🚀 Ciao! Sono il Scene-Director potenziato con AI. Posso creare scene anche se mancano componenti - li genererò automaticamente in background!'
        }
    ]);
    const [llmMessages, setLlmMessages] = useState<Message[]>([]);

    // Auto-generazione componenti mancanti
    const autoGenerateMissingComponents = async (componentIds: string[]) => {
        for (const componentId of componentIds) {
            const jobId = generationQueue.addJob(componentId);

            try {
                generationQueue.updateJob(jobId, { status: 'generating', progress: 30 });

                // Determina categoria dal nome
                let category = 'abstract';
                if (componentId.startsWith('vehicle_')) category = 'vehicle';
                else if (componentId.startsWith('sign_')) category = 'sign';
                else if (componentId.startsWith('road_')) category = 'road_surface';
                else if (componentId.startsWith('pedestrian_')) category = 'pedestrian';

                const component = await autoGenerateComponent(componentId, category);

                generationQueue.updateJob(jobId, { status: 'validating', progress: 80 });

                // TODO: Salvare nel catalogo reale
                console.log('Componente generato:', component);

                generationQueue.updateJob(jobId, {
                    status: 'completed',
                    progress: 100,
                    component
                });

            } catch (error) {
                generationQueue.updateJob(jobId, {
                    status: 'error',
                    progress: 0,
                    error: error instanceof Error ? error.message : 'Errore sconosciuto'
                });
            }
        }
    };

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonText(e.target.value);
        try {
            const parsed = JSON.parse(e.target.value);
            const validation = validateSceneWithCatalog(parsed, ComponentRegistry);

            if (validation.valid) {
                setScene(parsed);
                setValidationErrors([]);
                setMissingComponents([]);
            } else {
                setValidationErrors(validation.errors || []);

                // Estrai componenti mancanti
                const missing = (validation.errors || [])
                    .filter(err => err.includes('non-existent component'))
                    .map(err => err.split(':')[1]?.trim())
                    .filter(Boolean) as string[];
                setMissingComponents(missing);
            }
        } catch (err) {
            setValidationErrors(['Sintassi JSON non valida']);
        }
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isProcessing) return;

        const userMessage = chatInput;
        const newHistory = [...chatHistory, { role: 'user' as const, text: userMessage }];
        setChatHistory(newHistory);
        setChatInput('');
        setIsProcessing(true);

        try {
            const context = {
                catalog: getAllComponents(),
                currentScene: scene
            };

            const result = await callSceneDirector(userMessage, context, llmMessages);
            let aiResponse = result.content;
            const reasoning = result.reasoning_details?.content || undefined;

            try {
                const sceneJSON = extractJSONFromResponse(result.content) as SceneJSON;

                // Valida la scena generata
                const validation = validateSceneWithCatalog(sceneJSON, ComponentRegistry);

                // Imposta sempre la scena (anche se ha errori)
                setScene(sceneJSON);
                setJsonText(JSON.stringify(sceneJSON, null, 2));
                setValidationErrors(validation.errors || []);

                // Estrai componenti mancanti
                const missing = (validation.errors || [])
                    .filter((err: string) => err.includes('non-existent component'))
                    .map((err: string) => err.split(':')[1]?.trim())
                    .filter(Boolean) as string[];

                if (missing.length > 0) {
                    setMissingComponents(missing);
                    aiResponse = `🎨 Ho generato la scena, ma mancano ${missing.length} componenti. Li sto creando automaticamente in background...`;
                    autoGenerateMissingComponents(missing);
                } else if (!validation.valid && validation.errors?.length) {
                    aiResponse = `⚠️ Errori nella scena:\n${validation.errors.join('\n')}`;
                } else if (!aiResponse || aiResponse === result.content) {
                    aiResponse = '✅ Ho aggiornato la scena!';
                }
            } catch (jsonError) {
                console.warn('Impossibile estrarre JSON dalla risposta LLM:', jsonError);
            }

            setChatHistory([
                ...newHistory,
                { role: 'ai', text: aiResponse, reasoning }
            ]);

            setLlmMessages([
                ...llmMessages,
                { role: 'user', content: userMessage },
                { role: 'assistant', content: result.content, reasoning_details: result.reasoning_details }
            ]);

        } catch (error) {
            setChatHistory([
                ...newHistory,
                { role: 'ai', text: `❌ Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}` }
            ]);
        } finally {
            setIsProcessing(false);
        }
    };

    // Funzione per eliminare un componente
    const handleDeleteComponent = (componentId: string) => {
        removeComponent(componentId);
        setEditingComponent(null);

        // Ricalida la scena per aggiornare gli errori
        const validation = validateSceneWithCatalog(scene, ComponentRegistry);
        setValidationErrors(validation.errors || []);

        const missing = (validation.errors || [])
            .filter(err => err.includes('non-existent component'))
            .map(err => err.split(':')[1]?.trim())
            .filter(Boolean) as string[];

        setMissingComponents(missing);
    };

    // Funzione per rigenerare un componente
    const handleRegenerateComponent = (componentId: string) => {
        setEditingComponent(null);
        setMissingComponents(prev => [...prev, componentId]);
        autoGenerateMissingComponents([componentId]);
    };

    // Funzione Replay: Ricalcola e rigenera tutto
    const handleReplay = () => {
        const validation = validateSceneWithCatalog(scene, ComponentRegistry);
        setValidationErrors(validation.errors || []);

        const missing = (validation.errors || [])
            .filter(err => err.includes('non-existent component'))
            .map(err => err.split(':')[1]?.trim())
            .filter(Boolean) as string[];

        if (missing.length > 0) {
            setMissingComponents(missing);
            autoGenerateMissingComponents(missing);
        }
    };

    const renderCatalog = () => {
        const components = getAllComponents();
        const categories = [...new Set(components.map(c => c.category))];

        return (
            <div className="p-4 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Catalogo Componenti</h2>
                    <div className="text-xs text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                        {components.length} disponibili
                    </div>
                </div>

                {categories.map(category => (
                    <div key={category} className="border border-gray-200 rounded-lg p-3">
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">
                            {categoryTranslations[category] || category}
                        </h3>
                        <div className="space-y-2">
                            {components.filter(c => c.category === category).map(comp => (
                                <div
                                    key={comp.id}
                                    className="bg-gray-50 p-2 rounded text-xs hover:bg-gray-100 cursor-pointer transition-colors"
                                    onClick={() => setEditingComponent(comp)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-gray-800">{comp.name}</div>
                                        <button className="text-blue-600 hover:text-blue-800 text-xs">
                                            ✏️ Modifica
                                        </button>
                                    </div>
                                    <div className="text-gray-600 text-[10px] mt-1">ID: {comp.id}</div>
                                    <div className="text-gray-500 mt-1">{comp.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
                {/* Left Panel */}
                <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('scene')}
                            className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'scene'
                                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Scena
                        </button>
                        <button
                            onClick={() => setActiveTab('components')}
                            className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'components'
                                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Componenti
                        </button>
                    </div>

                    {activeTab === 'scene' ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                                <div className="font-bold text-sm text-blue-900 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Scene Director AI
                                </div>
                                <div className="text-xs text-blue-700 mt-1">
                                    Con auto-generazione componenti 🎨
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatHistory.map((msg, idx) => (
                                    <div key={idx}>
                                        <div className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}>
                                            <strong className="text-xs uppercase">{msg.role === 'user' ? 'Tu' : 'AI'}:</strong>
                                            <div className="mt-1 whitespace-pre-wrap">{msg.text}</div>
                                        </div>
                                        {msg.reasoning && (
                                            <details className="mt-1 mr-8 text-xs">
                                                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                                    🧠 Vedi ragionamento AI
                                                </summary>
                                                <div className="mt-1 p-2 bg-purple-50 rounded text-purple-900 whitespace-pre-wrap text-[10px]">
                                                    {msg.reasoning}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                ))}

                                {isProcessing && (
                                    <div className="bg-gray-100 mr-8 p-3 rounded-lg text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <span className="text-gray-600 ml-2">AI sta pensando...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-200">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Scrivi le tue istruzioni..."
                                    disabled={isProcessing}
                                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                            </form>
                        </>
                    ) : (
                        renderCatalog()
                    )}
                </div>

                {/* Center Panel */}
                <div className="flex-1 bg-gray-50 p-8 flex flex-col">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Editor QuizEngine</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                {activeTab === 'scene' ? 'Anteprima in tempo reale' : 'Catalogo componenti'}
                            </p>
                        </div>
                        <button
                            onClick={handleReplay}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                            title="Ricalcola la scena e rigenera i componenti mancanti"
                        >
                            🔄 Replay & Fix
                        </button>
                    </div>

                    <div className="bg-white shadow-lg rounded-lg overflow-hidden flex-1 relative">
                        {validationErrors.length > 0 && (
                            <div className="absolute top-0 left-0 right-0 bg-red-100 border-b-2 border-red-500 p-3 z-10">
                                <div className="font-semibold text-red-800 text-sm flex items-center justify-between">
                                    <span>Errori di Validazione:</span>
                                    {missingComponents.length > 0 && (
                                        <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">
                                            🎨 Generazione componenti in corso...
                                        </span>
                                    )}
                                </div>
                                <ul className="list-disc list-inside text-xs text-red-700 mt-1">
                                    {validationErrors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className={validationErrors.length > 0 ? 'mt-20' : ''}>
                            <SceneRenderer scene={scene} />
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-1/4 bg-white border-l border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <div className="font-bold text-sm text-gray-800">JSON Scena</div>
                            <div className="text-xs text-gray-600 mt-0.5">
                                {validationErrors.length === 0 ? (
                                    <span className="text-green-600">✓ Valido</span>
                                ) : (
                                    <span className="text-red-600">✗ Errori</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setJsonText(JSON.stringify(scene, null, 2))}
                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Formatta
                        </button>
                    </div>
                    <textarea
                        className="flex-1 w-full p-4 font-mono text-xs resize-none focus:outline-none"
                        value={jsonText}
                        onChange={handleJsonChange}
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* Progress Bar Globale */}
            <ComponentGenerationProgress />

            {/* Modal Editor Componente */}
            {editingComponent && (
                <ComponentEditorModal
                    component={editingComponent}
                    onClose={() => setEditingComponent(null)}
                    onSave={(updated) => {
                        console.log('Componente aggiornato:', updated);
                        setEditingComponent(null);
                        // TODO: Salvare nel catalogo reale
                    }}
                    onDelete={handleDeleteComponent}
                    onRegenerate={handleRegenerateComponent}
                />
            )}
        </>
    );
};
