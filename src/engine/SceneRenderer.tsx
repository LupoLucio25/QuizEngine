import React from 'react';
import { SceneJSON, SceneBlock, RoadSceneContent, DefinitionCardContent } from '../types/scene';
import { ObjectRenderer } from './ObjectRenderer';
import { GaugeRenderer } from './GaugeRenderer';
import { TimelineRenderer } from './TimelineRenderer';
import { ComparisonTableRenderer } from './ComparisonTableRenderer';

interface SceneRendererProps {
    scene: SceneJSON;
    className?: string;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({ scene, className }) => {
    return (
        <div className={`w-full h-full relative bg-gray-50 ${className}`}>
            {/* Display metadata if present */}
            {scene.metadata?.question_text && (
                <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white p-3 text-sm font-medium z-50">
                    {scene.metadata.question_text}
                </div>
            )}

            <div className={`w-full h-full ${scene.metadata?.question_text ? 'pt-12' : ''}`}>
                {scene.blocks.map((block) => (
                    <BlockRenderer key={block.id} block={block} />
                ))}
            </div>
        </div>
    );
};

const BlockRenderer: React.FC<{ block: SceneBlock }> = ({ block }) => {
    const { layout, type } = block;
    const style: React.CSSProperties = layout
        ? {
            position: 'absolute',
            left: `${layout.x}%`,
            top: `${layout.y}%`,
            width: `${layout.w}%`,
            height: `${layout.h}%`,
        }
        : { width: '100%', height: '100%' };

    switch (type) {
        case 'road_scene':
            return (
                <div style={style} className="border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {block.title && (
                        <div className="bg-gray-100 px-3 py-2 border-b text-sm font-semibold">
                            {block.title}
                        </div>
                    )}
                    <RoadSceneRenderer content={block.content as RoadSceneContent} />
                </div>
            );

        case 'definition_card':
            return (
                <div style={style} className="p-4 bg-white shadow-md rounded-lg border border-gray-200">
                    {block.title && <h3 className="font-bold text-lg mb-2">{block.title}</h3>}
                    <p className="text-gray-700">{(block.content as DefinitionCardContent).text}</p>
                </div>
            );

        case 'gauge':
            return (
                <div style={style} className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
                    {block.title && (
                        <div className="bg-gray-100 px-3 py-2 border-b text-sm font-semibold">
                            {block.title}
                        </div>
                    )}
                    <GaugeRenderer content={block.content as any} />
                </div>
            );

        case 'timeline':
            return (
                <div style={style} className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
                    {block.title && (
                        <div className="bg-gray-100 px-3 py-2 border-b text-sm font-semibold">
                            {block.title}
                        </div>
                    )}
                    <TimelineRenderer content={block.content as any} />
                </div>
            );

        case 'comparison_table':
            return (
                <div style={style} className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
                    {block.title && (
                        <div className="bg-gray-100 px-3 py-2 border-b text-sm font-semibold">
                            {block.title}
                        </div>
                    )}
                    <ComparisonTableRenderer content={block.content as any} />
                </div>
            );

        case 'cause_effect':
            return (
                <div style={style} className="bg-white shadow-md rounded-lg border border-gray-200 p-4">
                    {block.title && <h3 className="font-bold text-lg mb-2">{block.title}</h3>}
                    <div className="text-gray-600 text-sm">Diagramma Causa-Effetto (Non ancora implementato)</div>
                </div>
            );

        case 'icon_grid':
            return (
                <div style={style} className="bg-white shadow-md rounded-lg border border-gray-200 p-4">
                    {block.title && <h3 className="font-bold text-lg mb-2">{block.title}</h3>}
                    <div className="text-gray-600 text-sm">Griglia Icone (Non ancora implementato)</div>
                </div>
            );

        default:
            return (
                <div style={style} className="bg-red-100 flex items-center justify-center border border-red-300 rounded">
                    <span className="text-red-700 font-medium">Blocco Sconosciuto: {type}</span>
                </div>
            );
    }
};

const RoadSceneRenderer: React.FC<{ content: RoadSceneContent }> = ({ content }) => {
    const bgColor = content.background === 'grass' ? '#86efac' : '#71717a';

    return (
        <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Background Layer */}
            <rect x="0" y="0" width="100" height="100" fill={bgColor} />

            {/* Objects Layer */}
            {content.objects
                .sort((a, b) => (a.transform.z_index || 0) - (b.transform.z_index || 0))
                .map((obj) => (
                    <ObjectRenderer key={obj.id} object={obj} />
                ))}
        </svg>
    );
};
