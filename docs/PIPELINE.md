# Operational Pipeline

This document outlines the end-to-end workflow for creating content in the QuizEngine.

## 1. Component Creation Pipeline (Offline)

**Goal**: Expand the visual vocabulary of the engine.

1.  **Trigger**: A content creator needs a new visual element (e.g., "A policeman directing traffic").
2.  **Prompting**: The creator invokes the **Component-Designer** agent.
    *   *Prompt*: "Create a top-down view of a policeman with arms open."
3.  **Generation**: The agent generates a `component descriptor` JSON.
4.  **Validation (Automated)**:
    *   System validates JSON against `component.schema.json`.
    *   System checks for ID collisions.
5.  **Review (Human)**:
    *   The generated component is rendered in a "Sandbox" view.
    *   Human verifies the SVG quality and prop behavior.
6.  **Commit**:
    *   If approved, the JSON is saved to `src/catalog/components/`.
    *   The `Registry` is updated.

## 2. Scene Creation Pipeline (Authoring)

**Goal**: Create a specific quiz question.

1.  **Trigger**: Need to visualize Question #402: "Precedence at a 4-way intersection."
2.  **Prompting**: The creator invokes the **Scene-Director** agent.
    *   *Prompt*: "Create a 4-way intersection. Car A (Blue) is coming from south. Car B (Red) from West. Stop sign for Car B."
    *   *Context*: The agent receives the list of available components.
3.  **Generation**: The agent generates a `scene descriptor` JSON.
4.  **Validation (Automated)**:
    *   System validates JSON against `scene.schema.json`.
    *   System verifies all `component_id`s exist in the Catalog.
5.  **Review (Human)**:
    *   The scene is rendered in the Editor.
    *   Human can tweak positions or ask for revisions ("Move Car A slightly forward").
6.  **Commit**:
    *   The JSON is saved to `data/scenes/q_402.json`.

## 3. Runtime Rendering Pipeline (User App)

**Goal**: Display the question to the student.

1.  **Load**: The App fetches `q_402.json`.
2.  **Parse**: `SceneRenderer` iterates through the blocks.
3.  **Resolve**: For each object, the engine looks up the `component_id` in the Registry.
4.  **Render**:
    *   React components are hydrated.
    *   SVG is drawn to the screen.
    *   Interactivity (if any) is enabled.

## 4. Feedback Loop

- If the **Scene-Director** cannot create a scene because a component is missing, it flags this.
- This triggers the **Component Creation Pipeline** to fill the gap.
