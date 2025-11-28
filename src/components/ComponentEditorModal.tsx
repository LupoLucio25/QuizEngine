import React, { useState } from 'react';
import { ComponentDescriptor } from '../types/catalog';
import { callComponentDesigner, extractComponentFromResponse } from '../services/componentDesigner';
import { validateComponentDescriptor } from '../utils/validation';

interface ComponentEditorModalProps {
    component: ComponentDescriptor;
    onClose: () => void;
    onSave: (component: ComponentDescriptor) => void;
}

export const ComponentEditorModal: React.FC<ComponentEditorModalProps> = ({
    component: initialComponent,
    onClose,
    onSave
}) => {
    const [component, setComponent] = useState<ComponentDescriptor>(initialComponent);
    const [jsonText, setJsonText] = useState(JSON.stringify(initialComponent, null, 2));
    const [chatInput, setChatInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([
        {
            role: 'ai',
            text: `Ciao! Sto modificando il componente "${component.name}". Dimmi cosa vuoi cambiare!`
        }
    ]);

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonText(e.target.value);
        try {
            const parsed = JSON.parse(e.target.value);
            const validation = validateComponentDescriptor(parsed);

            if (validation.valid) {
                setComponent(parsed);
                setValidationErrors([]);
            } else {
                setValidationErrors(validation.errors || []);
            }
        } catch (err) {
            setValidationErrors(['Sintassi JSON non valida']);
        }
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isProcessing) return;

        const userMessage = chatInput;
        setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
        setChatInput('');
        setIsProcessing(true);

        try {
            const context = `Stai modificando questo componente:\n${JSON.stringify(component, null, 2)}`;
            const result = await callComponentDesigner(`${context}\n\nRichiesta: ${userMessage}`);

            try {
                const updatedComponent = extractComponentFromResponse(result.content);
                const validation = validateComponentDescriptor(updatedComponent);

                if (validation.valid) {
                    setComponent(updatedComponent);
                    setJsonText(JSON.stringify(updatedComponent, null, 2));
                    setValidationErrors([]);
                    setChatHistory(prev => [...prev, {
                        role: 'ai', text: '✅ Componente aggiornato! Verifica l\'anteprima.'
                    }]);
                } else {
                    setChatHistory(prev => [...prev, {
                        role: 'ai',
                        text: `⚠️ Ho generato un componente con errori:\n${validation.errors?.join('\n')}`
                    }]);
                    setValidationErrors(validation.errors || []);
                }
            } catch (err) {
                setChatHistory(prev => [...prev, { role: 'ai', text: result.content }]);
            }
        } catch (error) {
            setChatHistory(prev => [...prev, {
                role: 'ai',
                text: `❌ Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderSVGPreview = () => {
        if (!component.render?.svg) {
            return <div className="text-gray-500 text-sm">Nessun SVG da visualizzare</div>;
        }

        // Interpolate default props
        let svgContent = component.render.svg;
        Object.entries(component.defaultProps).forEach(([key, value]) => {
            const conditionalRegex = new RegExp(`\\{${key}\\s*\\?\\s*"([^"]+)"\\s*:\\s*"([^"]+)"\\}`, 'g');
            svgContent = svgContent.replace(conditionalRegex, (_, trueVal, falseVal) => {
                return value ? trueVal : falseVal;
            });
            svgContent = svgContent.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        });

        return (
            <svg
                viewBox="-15 -15 30 30"
                className="w-full h-full border-2 border-gray-200 rounded bg-gray-50"
                style={{ maxHeight: '300px' }}
            >
                <g dangerouslySetInnerHTML={{ __html: svgContent }} />

                {/* Grid di riferimento */}
                <line x1="-15" y1="0" x2="15" y2="0" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="1,1" />
                <line x1="0" y1="-15" x2="0" y2="15" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="1,1" />
            </svg>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Editor Componente</h2>
                        <p className="text-sm text-gray-600 mt-1">{component.name} ({component.id})</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onSave(component)}
                            disabled={validationErrors.length > 0}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            💾 Salva
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                            ✕ Chiudi
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Chat */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col">
                        <div className="p-4 bg-purple-50 border-b">
                            <div className="font-semibold text-sm text-purple-900">Component-Designer AI</div>
                            <div className="text-xs text-purple-700 mt-1">Modifica il componente via chat</div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {chatHistory.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'
                                        }`}
                                >
                                    <strong className="text-xs uppercase">{msg.role === 'user' ? 'Tu' : 'AI'}:</strong>
                                    <div className="mt-1 whitespace-pre-wrap">{msg.text}</div>
                                </div>
                            ))}

                            {isProcessing && (
                                <div className="bg-gray-100 mr-8 p-3 rounded-lg flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <span className="text-sm text-gray-600 ml-2">Generazione...</span>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleChatSubmit} className="p-4 border-t">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Es: Cambia il colore in rosso"
                                disabled={isProcessing}
                                className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                            />
                        </form>
                    </div>

                    {/* Center: Preview */}
                    <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col">
                        <h3 className="font-semibold text-gray-800 mb-4">Anteprima SVG</h3>
                        <div className="flex-1 flex items-center justify-center">
                            {renderSVGPreview()}
                        </div>

                        {validationErrors.length > 0 && (
                            <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                                <div className="font-semibold text-red-800 text-sm">Errori:</div>
                                <ul className="list-disc list-inside text-xs text-red-700 mt-1">
                                    {validationErrors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Right: JSON */}
                    <div className="w-1/3 flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-800">JSON Descriptor</span>
                            <span className="text-xs">
                                {validationErrors.length === 0 ? (
                                    <span className="text-green-600">✓ Valido</span>
                                ) : (
                                    <span className="text-red-600">✗ Errori</span>
                                )}
                            </span>
                        </div>
                        <textarea
                            value={jsonText}
                            onChange={handleJsonChange}
                            className="flex-1 p-4 font-mono text-xs resize-none focus:outline-none"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
