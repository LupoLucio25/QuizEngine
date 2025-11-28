import React from 'react';

interface ComparisonRow {
    label: string;
    values: string[];
}

interface ComparisonTableContent {
    headers: string[];
    rows: ComparisonRow[];
}

interface ComparisonTableRendererProps {
    content: ComparisonTableContent;
    style?: React.CSSProperties;
}

export const ComparisonTableRenderer: React.FC<ComparisonTableRendererProps> = ({
    content,
    style,
}) => {
    const { headers, rows } = content;

    return (
        <div style={style} className="p-6 overflow-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-blue-500 text-white">
                        <th className="border border-blue-600 p-3 text-left font-semibold">Caratteristica</th>
                        {headers.map((header, idx) => (
                            <th key={idx} className="border border-blue-600 p-3 text-left font-semibold">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIdx) => (
                        <tr
                            key={rowIdx}
                            className={rowIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                        >
                            <td className="border border-gray-300 p-3 font-medium text-gray-700">
                                {row.label}
                            </td>
                            {row.values.map((value, cellIdx) => (
                                <td key={cellIdx} className="border border-gray-300 p-3 text-gray-600">
                                    {value}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
