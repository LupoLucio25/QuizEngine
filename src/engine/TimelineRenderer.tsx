import React from 'react';

interface TimelineEvent {
    id: string;
    time?: string;
    title: string;
    description?: string;
    icon?: string;
}

interface TimelineContent {
    events: TimelineEvent[];
    orientation?: 'horizontal' | 'vertical';
}

interface TimelineRendererProps {
    content: TimelineContent;
    style?: React.CSSProperties;
}

export const TimelineRenderer: React.FC<TimelineRendererProps> = ({ content, style }) => {
    const { events, orientation = 'vertical' } = content;

    if (orientation === 'horizontal') {
        return (
            <div style={style} className="p-6 overflow-x-auto">
                <div className="flex items-start space-x-8 min-w-max">
                    {events.map((event, idx) => (
                        <div key={event.id} className="flex flex-col items-center w-32">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                            </div>
                            <div className="h-1 w-full bg-blue-300 my-2" />
                            {event.time && (
                                <div className="text-xs text-gray-500 mb-1">{event.time}</div>
                            )}
                            <div className="text-sm font-semibold text-center">{event.title}</div>
                            {event.description && (
                                <div className="text-xs text-gray-600 text-center mt-1">
                                    {event.description}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={style} className="p-6">
            <div className="relative border-l-2 border-blue-300 pl-8 space-y-6">
                {events.map((event, idx) => (
                    <div key={event.id} className="relative">
                        <div className="absolute -left-10 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                            {event.time && (
                                <div className="text-xs text-gray-500 mb-1">{event.time}</div>
                            )}
                            <div className="font-semibold text-gray-900">{event.title}</div>
                            {event.description && (
                                <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
