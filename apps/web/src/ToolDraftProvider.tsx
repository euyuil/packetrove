import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ToolDraftDefinition<Draft> = { createInitialDraft: () => Draft };

const ToolDraftContext = createContext<Map<object, unknown> | null>(null);

/** Retain drafts only for this application instance, including during navigation. */
export function ToolDraftProvider({ children }: { children: ReactNode }) {
  const [drafts] = useState(() => new Map<object, unknown>());
  return <ToolDraftContext value={drafts}>{children}</ToolDraftContext>;
}

/** Use a module-stable definition with one mounted owner per application. */
export function useToolDraft<Draft>(definition: ToolDraftDefinition<Draft>) {
  const drafts = useContext(ToolDraftContext);
  if (!drafts) throw new Error('Tool drafts require an application draft provider.');
  const [draft, setDraft] = useState<Draft>(() => {
    if (drafts.has(definition)) return drafts.get(definition) as Draft;
    return definition.createInitialDraft();
  });
  const changeDraft = useCallback((next: Draft) => {
    // Save on the change itself so navigation cannot restore an earlier draft.
    drafts.set(definition, next);
    setDraft(next);
  }, [definition, drafts]);
  return [draft, changeDraft] as const;
}
