# QuizEngine

Un motore grafico 2D modulare e orientato all'intelligenza artificiale per quiz sulla patente di guida.

## Iniziare

1.  **Installa le Dipendenze**:
    ```bash
    npm install
    ```

2.  **Avvia l'Editor**:
    ```bash
    npm run dev
    ```

## Struttura del Progetto

- `src/engine`: Il motore di rendering React + SVG principale
- `src/catalog`: Il registro componenti e le definizioni
- `src/schemas`: Schemi JSON per la validazione
- `src/agents`: Prompt e regole per gli agenti AI
- `src/editor`: I componenti dell'interfaccia utente dell'editor
- `examples`: Scene JSON di esempio

## Architettura

Vedi [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) per una panoramica dettagliata.
Vedi [docs/PIPELINE.md](docs/PIPELINE.md) per il flusso di lavoro operativo.

## Caratteristiche

- ✅ **Sistema modulare completo**: Architettura basata su JSON
- ✅ **Rendering multi-blocco**: 7 tipi di visualizzazione supportati
- ✅ **Validazione rigorosa**: JSON Schema + controlli di integrità
- ✅ **Editor interattivo**: Preview live con chat AI
- ✅ **Catalogo componenti**: 6 componenti base implementati
- ✅ **Agenti LLM**: Scene-Director e Component-Designer completamente specificati

## Tecnologie

- React 18 + TypeScript
- Vite (build tool)
- SVG per rendering grafico
- Tailwind CSS per styling  
- Ajv per validazione JSON Schema

## Stato del Progetto

🟢 **Sistema operativo al 70%**
- Core funzionale completo
- Editor funzionante
- 6 componenti grafici
- Validazione attiva
- Specifiche LLM complete

⚠️ **Da implementare**:
- Integrazione API LLM live
- Libreria estesa di componenti (94+ mancanti)
- Backend per persistenza
- Test automatizzati
