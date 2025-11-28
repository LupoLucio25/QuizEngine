import React, { useState, useEffect } from 'react';
import { EditorLayout } from './editor/EditorLayout';
import { SceneJSON } from './types/scene';
import allFeaturesScene from '../examples/all-features-scene.json';

const App: React.FC = () => {
    const [scene, setScene] = useState<SceneJSON | null>(null);

    useEffect(() => {
        setScene(allFeaturesScene as unknown as SceneJSON);
    }, []);

    if (!scene) return (
        <div className="flex items-center justify-center h-screen bg-gray-900">
            <div className="text-white text-xl">Caricamento QuizEngine...</div>
        </div>
    );

    return <EditorLayout initialScene={scene} />;
};

export default App;
