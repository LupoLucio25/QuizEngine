import React from 'react';
import { SceneObject } from '../types/scene';
import { getComponent } from '../catalog/registry';

interface ObjectRendererProps {
    object: SceneObject;
    onMissingComponent?: (componentId: string) => void;
}

export const ObjectRenderer: React.FC<ObjectRendererProps> = ({ object, onMissingComponent }) => {
    const { component_id, transform, props = {} } = object;
    const component = getComponent(component_id);

    // Se il componente non esiste, mostra placeholder e notifica
    if (!component) {
        if (onMissingComponent) {
            onMissingComponent(component_id);
        }

        return (
            <g transform={`translate(${transform.x}, ${transform.y}) rotate(${transform.rotation || 0}) scale(${transform.scale || 1})`}>
                {/* Placeholder visivo per componente mancante */}
                <rect
                    x="-5"
                    y="-5"
                    width="10"
                    height="10"
                    fill="#fee2e2"
                    stroke="#dc2626"
                    strokeWidth="0.5"
                    strokeDasharray="1,1"
                    rx="1"
                />
                <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="2"
                    fill="#dc2626"
                    fontWeight="bold"
                >
                    ?
                </text>
                <title>{`Missing: ${component_id}`}</title>
            </g>
        );
    }

    // Componente esiste - rendering normale
    if (!component.render?.svg) {
        return null;
    }

    // Interpolate props into SVG
    let svgContent = component.render.svg;
    const allProps = { ...component.defaultProps, ...props };

    // Replace conditional expressions {prop ? "val1" : "val2"}
    Object.entries(allProps).forEach(([key, value]) => {
        const conditionalRegex = new RegExp(`\\{${key}\\s*\\?\\s*"([^"]+)"\\s*:\\s*"([^"]+)"\\}`, 'g');
        svgContent = svgContent.replace(conditionalRegex, (_, trueVal, falseVal) => {
            return value ? trueVal : falseVal;
        });
    });

    // Replace simple prop references {propName}
    Object.entries(allProps).forEach(([key, value]) => {
        svgContent = svgContent.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    });

    return (
        <g
            transform={`translate(${transform.x}, ${transform.y}) rotate(${transform.rotation || 0}) scale(${transform.scale || 1})`}
            style={{ zIndex: transform.z_index }}
        >
            <g dangerouslySetInnerHTML={{ __html: svgContent }} />
        </g>
    );
};
