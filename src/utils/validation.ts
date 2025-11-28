import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import componentSchema from '../schemas/component.schema.json';
import sceneSchema from '../schemas/scene.schema.json';
import { ComponentDescriptor } from '../types/catalog';
import { SceneJSON } from '../types/scene';

const ajv = new Ajv({ allErrors: true, strict: false });

// Type assertion for schemas
const componentSchemaTyped = componentSchema as JSONSchemaType<ComponentDescriptor>;
const sceneSchemaTyped = sceneSchema as any; // Scene schema is complex with allOf

export const validateComponent: ValidateFunction<ComponentDescriptor> = ajv.compile(componentSchemaTyped);
export const validateScene = ajv.compile(sceneSchemaTyped);

export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}

export function validateComponentDescriptor(data: unknown): ValidationResult {
    const valid = validateComponent(data);
    if (!valid && validateComponent.errors) {
        return {
            valid: false,
            errors: validateComponent.errors.map(
                (err) => `${err.instancePath} ${err.message}`
            ),
        };
    }
    return { valid: true };
}

export function validateSceneJSON(data: unknown): ValidationResult {
    const valid = validateScene(data);
    if (!valid && validateScene.errors) {
        return {
            valid: false,
            errors: validateScene.errors.map(
                (err) => `${err.instancePath} ${err.message}`
            ),
        };
    }
    return { valid: true };
}

export function validateSceneWithCatalog(
    scene: SceneJSON,
    catalogRegistry: Record<string, ComponentDescriptor>
): ValidationResult {
    // First validate against schema
    const schemaValidation = validateSceneJSON(scene);
    if (!schemaValidation.valid) {
        return schemaValidation;
    }

    // Then check that all component_ids exist in catalog
    const errors: string[] = [];
    scene.blocks.forEach((block) => {
        if (block.type === 'road_scene' && block.content.objects) {
            block.content.objects.forEach((obj: any) => {
                if (!catalogRegistry[obj.component_id]) {
                    errors.push(
                        `Object ${obj.id} references non-existent component: ${obj.component_id}`
                    );
                }
            });
        }
    });

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true };
}
