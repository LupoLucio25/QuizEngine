# QuizEngine System Architecture

## 1. Overview
The **QuizEngine** is a modular, scalable system designed to render interactive 2D scenes for driving school quizzes. It relies on a strict separation between **data** (JSON) and **logic** (React Engine). No UI code is generated at runtime; instead, the system uses a **Component Catalog** of pre-built, highly configurable primitives that are assembled into **Scenes** via JSON instructions.

## 2. Core Modules

### A. The Engine (`src/engine`)
- **Technology**: React + SVG.
- **Role**: Pure rendering. It takes a `SceneJSON` and renders it.
- **Coordinate System**: Normalized 0-100 coordinate system (SVG `viewBox="0 0 100 100"`).
- **Components**:
    - `SceneRenderer`: The root component.
    - `ObjectRenderer`: Factory that selects the specific renderer based on `component_id`.
    - `PrimitiveRenderer`: Renders basic shapes (rect, circle, path) defined in the catalog.
    - `SpecializedRenderer`: Handles complex logic for specific types (e.g., `RoadSegment`, `Gauge`).

### B. The Catalog (`src/catalog`)
- **Role**: The source of truth for what *can* be rendered.
- **Structure**: A collection of `ComponentDescriptor` JSONs.
- **Registry**: A central index mapping `component_id` to its Descriptor and React implementation.
- **Versioning**: Semantic versioning for components to ensure backward compatibility.

### C. The Schemas (`src/schemas`)
- **Role**: Validation contracts.
- **Files**:
    - `component.schema.json`: Validates Component Descriptors.
    - `scene.schema.json`: Validates Scene JSONs.

### D. The Agents (`src/agents`)
- **Scene-Director**:
    - **Role**: Composes scenes based on user prompts (e.g., "Create a roundabout with 3 cars").
    - **Constraint**: Can ONLY use components present in the Catalog.
    - **Output**: Valid `SceneJSON`.
- **Component-Designer**:
    - **Role**: Defines new visual components or modifies existing ones.
    - **Constraint**: Must adhere to `component.schema.json`.
    - **Output**: Valid `ComponentDescriptor`.

## 3. Data Flow

1.  **Offline/Design Phase**:
    *   `Component-Designer` (LLM) receives a request ("We need a Stop sign").
    *   Generates a `stop_sign.json` descriptor.
    *   Human validates and commits to `src/catalog`.
    *   Dev implements the React logic if it's a new *primitive* type (rare), otherwise it's composed of existing primitives.

2.  **Authoring Phase**:
    *   `Scene-Director` (LLM) receives a question text ("Who goes first?").
    *   Reads the `Catalog` to know available assets.
    *   Generates `question_123.json` (Scene JSON).
    *   Human validates.

3.  **Runtime Phase**:
    *   App loads `question_123.json`.
    *   `SceneRenderer` parses the JSON.
    *   Lookups components in `Catalog`.
    *   Renders SVG.

## 4. Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS (for UI overlay), Framer Motion (for animations).
- **Validation**: Ajv (JSON Schema validation).
- **State Management**: Zustand (for Editor state).
- **LLM Integration**: OpenAI API / Anthropic API (via proxy or direct).

## 5. Orchestration & Validation
- **Strict Mode**: The renderer throws errors if a scene references a non-existent component ID.
- **Pipeline**:
    - `validate-catalog`: Checks all descriptors against schema.
    - `validate-scenes`: Checks all scene files against schema and catalog integrity.

## 6. Block Types
The system supports multiple visualization modes via "Blocks":
- `road_scene`: Standard 2D top-down view.
- `definition_card`: Text/Image card for theory.
- `gauge`: Speedometers, RPM, etc.
- `timeline`: Sequential events.
- `comparison_table`: Side-by-side comparison.
- `cause_effect`: Flowcharts.

## 7. Human-in-the-loop
All LLM outputs are "Proposals".
- **Editor UI**: Shows a "Diff" view of the JSON and a "Live Preview" of the render.
- **Approval**: User clicks "Approve" to save the JSON to the filesystem.
