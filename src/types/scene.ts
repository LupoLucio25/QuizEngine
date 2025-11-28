export type BlockType = 'road_scene' | 'definition_card' | 'gauge' | 'timeline' | 'comparison_table' | 'cause_effect' | 'icon_grid';

export interface SceneJSON {
    id: string;
    version: number;
    metadata?: {
        question_text?: string;
        tags?: string[];
        difficulty?: number;
    };
    blocks: SceneBlock[];
}

export interface SceneBlock {
    id: string;
    type: BlockType;
    title?: string;
    layout?: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    content: RoadSceneContent | DefinitionCardContent | any;
}

export interface RoadSceneContent {
    background?: string;
    objects: SceneObject[];
}

export interface SceneObject {
    id: string;
    component_id: string;
    transform: {
        x: number;
        y: number;
        rotation?: number;
        scale?: number;
        z_index?: number;
    };
    props?: Record<string, any>;
}

export interface DefinitionCardContent {
    title?: string;
    text: string;
    image_component_id?: string;
}
