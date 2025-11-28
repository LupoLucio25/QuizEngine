export type ComponentType = 'primitive' | 'composite' | 'logic';
export type ComponentCategory = 'vehicle' | 'pedestrian' | 'sign' | 'road_surface' | 'infrastructure' | 'icon' | 'abstract' | 'ui';

export interface ComponentDescriptor {
  id: string;
  version: string;
  type: ComponentType;
  category: ComponentCategory;
  name: string;
  description: string;
  tags?: string[];
  propsSchema: Record<string, any>; // JSON Schema object
  defaultProps: Record<string, any>;
  render?: {
    svg?: string;
    layers?: RenderLayer[];
  };
  children?: CompositeChild[];
}

export interface RenderLayer {
  type: 'path' | 'circle' | 'rect' | 'text' | 'image';
  props: Record<string, any>;
  condition?: string;
}

export interface CompositeChild {
  componentId: string;
  offset?: {
    x?: number;
    y?: number;
    rotation?: number;
  };
  propsMapping?: Record<string, string>; // childProp -> parentProp expression
}
