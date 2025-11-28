import { ComponentDescriptor } from '../types/catalog';

// Import all component descriptors
import vehicleSedan from './components/vehicle_sedan.json';
import vehicleMotorcycle from './components/vehicle_motorcycle.json';
import signStop from './components/sign_stop.json';
import signYield from './components/sign_yield.json';
import roadSegmentStraight from './components/road_segment_straight.json';
import pedestrianWalking from './components/pedestrian_walking.json';

const componentModules: ComponentDescriptor[] = [
    vehicleSedan,
    vehicleMotorcycle,
    signStop,
    signYield,
    roadSegmentStraight,
    pedestrianWalking,
] as ComponentDescriptor[];

export const ComponentRegistry: Record<string, ComponentDescriptor> = {};

// Build registry from imported components
componentModules.forEach(comp => {
    ComponentRegistry[comp.id] = comp;
});

export const getComponent = (id: string): ComponentDescriptor | undefined => {
    return ComponentRegistry[id];
};

export const getAllComponents = (): ComponentDescriptor[] => {
    return Object.values(ComponentRegistry);
};

export const getComponentsByCategory = (category: string): ComponentDescriptor[] => {
    return Object.values(ComponentRegistry).filter(c => c.category === category);
};
