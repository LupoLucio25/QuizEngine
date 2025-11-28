import React from 'react';
import { SceneObject } from '../types/scene';
import { getComponent } from '../catalog/registry';

interface ObjectRendererProps {
    object: SceneObject;
}

export const ObjectRenderer: React.FC<ObjectRendererProps> = ({ object }) => {
    const component = getComponent(object.component_id);

    if (!component) {
        console.warn(`Component not found: ${object.component_id}`);
        return (
            <g transform={`translate(${object.transform.x}, ${object.transform.y})`}>
                <circle cx="0" cy="0" r="2" fill="red" opacity="0.5" />
                <text x="0" y="4" fontSize="2" fill="red" textAnchor="middle">
                    ?
                </text>
            </g>
        );
    }

    const { x, y, rotation = 0, scale = 1 } = object.transform;

    // Merge default props with instance props
    const finalProps = { ...component.defaultProps, ...object.props };

    // Interpolate SVG string with props
    const renderSvg = () => {
        if (component.render?.svg) {
            let svgContent = component.render.svg;

            // Simple interpolation: replace {propName} with values
            // Also handle simple boolean conditions like {condition ? "value1" : "value2"}
            Object.entries(finalProps).forEach(([key, value]) => {
                // Handle simple conditionals in SVG string
                const conditionalRegex = new RegExp(`\\{${key}\\s*\\?\\s*"([^"]+)"\\s*:\\s*"([^"]+)"\\}`, 'g');
                svgContent = svgContent.replace(conditionalRegex, (_, trueVal, falseVal) => {
                    return value ? trueVal : falseVal;
                });

                // Simple prop replacement
                svgContent = svgContent.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
            });

            return <g dangerouslySetInnerHTML={{ __html: svgContent }} />;
        }

        if (component.render?.layers) {
            return (
                <>
                    {component.render.layers.map((layer, idx) => {
                        if (layer.type === 'rect') {
                            const w = finalProps.width || 10;
                            const h = finalProps.height || 10;
                            const fill = finalProps.fill || 'gray';
                            return <rect key={idx} x="-5" y="-5" width={w} height={h} fill={fill} />;
                        }
                        if (layer.type === 'circle') {
                            const r = finalProps.radius || 5;
                            const fill = finalProps.fill || 'gray';
                            return <circle key={idx} cx="0" cy="0" r={r} fill={fill} />;
                        }
                        return null;
                    })}
                </>
            );
        }

        return null;
    };

    return (
        <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
            {renderSvg()}
        </g>
    );
};
