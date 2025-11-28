import React from 'react';

interface GaugeContent {
    value: number;
    max: number;
    min?: number;
    label?: string;
    unit?: string;
    zones?: { min: number; max: number; color: string }[];
}

interface GaugeRendererProps {
    content: GaugeContent;
    style?: React.CSSProperties;
}

export const GaugeRenderer: React.FC<GaugeRendererProps> = ({ content, style }) => {
    const { value, max, min = 0, label, unit = '', zones = [] } = content;
    const percentage = ((value - min) / (max - min)) * 100;
    const angle = (percentage / 100) * 270 - 135; // -135 to +135 degrees

    return (
        <div style={style} className="flex flex-col items-center justify-center p-4">
            <svg viewBox="0 0 200 200" className="w-full h-full max-w-[200px]">
                {/* Background arc */}
                <path
                    d="M 30 150 A 70 70 0 1 1 170 150"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="20"
                    strokeLinecap="round"
                />

                {/* Colored zones */}
                {zones.map((zone, idx) => {
                    const startAngle = ((zone.min - min) / (max - min)) * 270 - 135;
                    const endAngle = ((zone.max - min) / (max - min)) * 270 - 135;
                    return (
                        <path
                            key={idx}
                            d={describeArc(100, 100, 70, startAngle, endAngle)}
                            fill="none"
                            stroke={zone.color}
                            strokeWidth="20"
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* Value arc */}
                <path
                    d={describeArc(100, 100, 70, -135, angle)}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="20"
                    strokeLinecap="round"
                />

                {/* Center value */}
                <text x="100" y="110" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#1f2937">
                    {value}
                </text>
                <text x="100" y="130" textAnchor="middle" fontSize="14" fill="#6b7280">
                    {unit}
                </text>

                {/* Needle */}
                <line
                    x1="100"
                    y1="100"
                    x2={100 + 60 * Math.cos((angle * Math.PI) / 180)}
                    y2={100 + 60 * Math.sin((angle * Math.PI) / 180)}
                    stroke="#dc2626"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="5" fill="#dc2626" />
            </svg>

            {label && (
                <div className="mt-2 text-sm font-medium text-gray-700">{label}</div>
            )}
        </div>
    );
};

// Helper function to describe an arc path
function describeArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
): string {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
        'M',
        start.x,
        start.y,
        'A',
        radius,
        radius,
        0,
        largeArcFlag,
        0,
        end.x,
        end.y,
    ].join(' ');
}

function polarToCartesian(
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
): { x: number; y: number } {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}
