import { ComponentDescriptor } from '../types/catalog';
import { SceneJSON } from '../types/scene';

const OPENROUTER_API_KEY = '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';
const MODEL = 'x-ai/grok-4.1-fast:free';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_details?: any;
}

interface SceneDirectorContext {
  catalog: ComponentDescriptor[];
  currentScene?: SceneJSON;
  questionContext?: string;
}

/**
 * Genera il system prompt per il Scene-Director
 */
function generateSceneDirectorSystemPrompt(context: SceneDirectorContext): string {
  const componentList = context.catalog.map(c =>
    `- ${c.id}: ${c.name} - ${c.description}`
  ).join('\n');

  return `Sei il **Scene-Director**, un AI specializzato nella creazione di scene 2D per quiz sulla patente di guida.

# REGOLE FONDAMENTALI

1. **SOLO COMPONENTI ESISTENTI**: Puoi usare SOLO i componenti dal catalogo fornito. MAI inventare component_id.
2. **OUTPUT JSON**: Rispondi SEMPRE con un JSON valido che rispetti lo schema Scene.
3. **COORDINATE 0-100**: Usa coordinate normalizzate da 0 a 100 (0,0 = alto-sinistra, 100,100 = basso-destra).
4. **Z-INDEX**: Usa z_index per il layering (strada=0-5, veicoli=10-19, segnali=20-29).
5. **LINGUA ITALIANA**: Genera metadata e testi in italiano.

# CATALOGO COMPONENTI DISPONIBILI

${componentList}

# FORMATO OUTPUT

Rispondi con un oggetto JSON così strutturato:

\`\`\`json
{
  "id": "scene_XXX",
  "version": 1,
  "metadata": {
    "question_text": "Domanda del quiz in italiano",
    "difficulty": 1-5,
    "tags": ["tag1", "tag2"]
  },
  "blocks": [
    {
      "id": "block_1",
      "type": "road_scene",
      "title": "Titolo opzionale",
      "layout": { "x": 0, "y": 0, "w": 100, "h": 100 },
      "content": {
        "background": "asphalt",
        "objects": [
          {
            "id": "obj_1",
            "component_id": "COMPONENT_ID_FROM_CATALOG",
            "transform": {
              "x": 50,
              "y": 50,
              "rotation": 0,
              "scale": 1,
              "z_index": 10
            },
            "props": {}
          }
        ]
      }
    }
  ]
}
\`\`\`

# TIPI DI BLOCCHI DISPONIBILI

- \`road_scene\`: Scena stradale vista dall'alto
- \`definition_card\`: Card con testo esplicativo
- \`gauge\`: Indicatore circolare (velocità, RPM)
- \`timeline\`: Eventi sequenziali
- \`comparison_table\`: Tabella comparativa

# ESEMPI

**Richiesta**: "Crea un incrocio con auto blu che arriva da sud e segnale di STOP"

**Risposta**:
\`\`\`json
{
  "id": "scene_001",
  "version": 1,
  "metadata": {
    "question_text": "L'auto deve fermarsi al STOP?",
    "difficulty": 2
  },
  "blocks": [{
    "id": "main",
    "type": "road_scene",
    "layout": {"x": 0, "y": 0, "w": 100, "h": 100},
    "content": {
      "background": "asphalt",
      "objects": [
        {
          "id": "road_v",
          "component_id": "road_segment_straight",
          "transform": {"x": 50, "y": 50, "z_index": 0},
          "props": {"width": 20, "length": 100}
        },
        {
          "id": "car_blu",
          "component_id": "vehicle_sedan",
          "transform": {"x": 50, "y": 75, "rotation": 0, "z_index": 10},
          "props": {"color": "#3b82f6"}
        },
        {
          "id": "sign",
          "component_id": "sign_stop",
          "transform": {"x": 45, "y": 40, "z_index": 20, "scale": 0.8}
        }
      ]
    }
  }]
}
\`\`\`

Rispondi SEMPRE solo con JSON valido, senza testo aggiuntivo.`;
}

/**
 * Chiama l'API OpenRouter con reasoning
 */
export async function callLLM(
  messages: Message[],
  enableReasoning: boolean = true
): Promise<{ content: string; reasoning_details?: any }> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.href,
        'X-Title': 'QuizEngine Editor'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        reasoning: { enabled: enableReasoning }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const assistantMessage = result.choices[0].message;

    return {
      content: assistantMessage.content,
      reasoning_details: assistantMessage.reasoning_details
    };
  } catch (error) {
    console.error('LLM API Error:', error);
    throw error;
  }
}

/**
 * Chiama il Scene-Director per generare o modificare una scena
 */
export async function callSceneDirector(
  userRequest: string,
  context: SceneDirectorContext,
  conversationHistory: Message[] = []
): Promise<{ content: string; reasoning_details?: any }> {
  const systemPrompt = generateSceneDirectorSystemPrompt(context);

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userRequest }
  ];

  return await callLLM(messages, true);
}

/**
 * Estrae il JSON dalla risposta del modello
 */
export function extractJSONFromResponse(response: string): any {
  // Cerca blocchi di codice JSON
  const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1]);
  }

  // Cerca JSON diretto
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('Nessun JSON valido trovato nella risposta');
}
