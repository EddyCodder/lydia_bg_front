"use client";

import { useState } from "react";
import type { EvoBotGraph, EvoBotNodeType } from "@/lib/lydia-api/types";
import { LYDIA_API_ENABLED } from "@/lib/lydia-api/config";
import { useBotFlow, useUpdateBotFlow } from "@/lib/queries/bot";
import { Icon } from "@/components/icons";

// LYD-48: el editor arma una lista de pasos (tarjetas), no un canvas visual
// -- cada boton de una pregunta (o la salida unica de un mensaje) elige a
// que paso lleva con un selector ("Lleva a"). Mismo modelo de grafo
// completo (ramas libres, sin limite de niveles) que valida el back
// (bot-flow.validation.ts): esto solo es otra forma de armarlo.

interface EditorOption {
  id: string;
  title: string;
  leadsTo: string | null;
}

interface EditorStep {
  id: string;
  type: EvoBotNodeType;
  text: string;
  leadsTo: string | null; // solo type "message"
  options: EditorOption[]; // solo type "question"
}

interface EditorState {
  enabled: boolean;
  startId: string | null;
  steps: EditorStep[];
}

const EMPTY_STATE: EditorState = { enabled: false, startId: null, steps: [] };
const MAX_OPTIONS = 3;

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`;
}

function graphToEditor(enabled: boolean, graph: EvoBotGraph): EditorState {
  const steps: EditorStep[] = graph.nodes.map((n) => {
    if (n.type === "question") {
      const options: EditorOption[] = (n.options ?? []).map((o) => ({
        id: o.id,
        title: o.title,
        leadsTo: graph.edges.find((e) => e.from === n.id && e.fromOption === o.id)?.to ?? null,
      }));
      return { id: n.id, type: "question", text: n.text, leadsTo: null, options };
    }
    const leadsTo = graph.edges.find((e) => e.from === n.id && !e.fromOption)?.to ?? null;
    return { id: n.id, type: "message", text: n.text, leadsTo, options: [] };
  });
  return { enabled, startId: graph.startNodeId, steps };
}

function editorToGraph(state: EditorState): EvoBotGraph {
  const nodes = state.steps.map((s) => ({
    id: s.id,
    type: s.type,
    text: s.text.trim(),
    x: 0,
    y: 0,
    ...(s.type === "question" ? { options: s.options.map((o) => ({ id: o.id, title: o.title.trim() })) } : {}),
  }));
  const edges: EvoBotGraph["edges"] = [];
  for (const s of state.steps) {
    if (s.type === "message" && s.leadsTo) {
      edges.push({ id: newId(), from: s.id, fromOption: null, to: s.leadsTo });
    }
    if (s.type === "question") {
      for (const o of s.options) {
        if (o.leadsTo) edges.push({ id: newId(), from: s.id, fromOption: o.id, to: o.leadsTo });
      }
    }
  }
  return { startNodeId: state.startId, nodes, edges };
}

function stepLabel(step: EditorStep, index: number): string {
  const text = step.text.trim();
  return `${index + 1}. ${text ? text.slice(0, 40) : "(sin texto)"}`;
}

export function BotFlowEditor() {
  const { data: realFlow, error: flowError, isLoading } = useBotFlow();
  const isMockMode = !LYDIA_API_ENABLED || flowError !== null;
  const update = useUpdateBotFlow();

  const saved: EditorState = isMockMode
    ? EMPTY_STATE
    : realFlow
      ? graphToEditor(realFlow.enabled, realFlow.graph)
      : EMPTY_STATE;

  const [mockState, setMockState] = useState<EditorState>(EMPTY_STATE);
  const [draft, setDraft] = useState<EditorState | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = draft ?? (isMockMode ? mockState : saved);

  const setState = (patch: Partial<EditorState> | ((s: EditorState) => EditorState)) => {
    setDraft(typeof patch === "function" ? patch(current) : { ...current, ...patch });
    setDirty(true);
    setError(null);
  };

  const addStep = (type: EvoBotNodeType) => {
    const id = newId();
    const step: EditorStep =
      type === "question"
        ? { id, type, text: "", leadsTo: null, options: [{ id: newId(), title: "", leadsTo: null }] }
        : { id, type, text: "", leadsTo: null, options: [] };
    setState((s) => ({ ...s, steps: [...s.steps, step], startId: s.startId ?? id }));
  };

  const removeStep = (id: string) => {
    setState((s) => ({
      ...s,
      startId: s.startId === id ? null : s.startId,
      steps: s.steps
        .filter((st) => st.id !== id)
        .map((st) => ({
          ...st,
          leadsTo: st.leadsTo === id ? null : st.leadsTo,
          options: st.options.map((o) => (o.leadsTo === id ? { ...o, leadsTo: null } : o)),
        })),
    }));
  };

  const updateStep = (id: string, patch: Partial<EditorStep>) => {
    setState((s) => ({ ...s, steps: s.steps.map((st) => (st.id === id ? { ...st, ...patch } : st)) }));
  };

  const addOption = (stepId: string) => {
    setState((s) => ({
      ...s,
      steps: s.steps.map((st) =>
        st.id === stepId && st.options.length < MAX_OPTIONS
          ? { ...st, options: [...st.options, { id: newId(), title: "", leadsTo: null }] }
          : st,
      ),
    }));
  };

  const updateOption = (stepId: string, optionId: string, patch: Partial<EditorOption>) => {
    setState((s) => ({
      ...s,
      steps: s.steps.map((st) =>
        st.id === stepId
          ? { ...st, options: st.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) }
          : st,
      ),
    }));
  };

  const removeOption = (stepId: string, optionId: string) => {
    setState((s) => ({
      ...s,
      steps: s.steps.map((st) => (st.id === stepId ? { ...st, options: st.options.filter((o) => o.id !== optionId) } : st)),
    }));
  };

  const hasValidSteps =
    !!current.startId &&
    current.steps.every((s) => {
      if (!s.text.trim()) return false;
      if (s.type === "question") {
        return s.options.length >= 1 && s.options.length <= MAX_OPTIONS && s.options.every((o) => o.title.trim());
      }
      return true;
    });
  // Sin pasos solo se puede guardar apagado -- activar el bot sin nada que
  // mandar no tiene sentido (mismo criterio que tenia el mensaje de
  // bienvenida antes de este ticket).
  const canSave = current.steps.length === 0 ? !current.enabled : hasValidSteps;

  const handleSave = async () => {
    if (!canSave) return;
    const graph = editorToGraph(current);
    if (isMockMode) {
      setMockState(current);
      setDirty(false);
      return;
    }
    try {
      await update.mutateAsync({ enabled: current.enabled, graph });
      setDirty(false);
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el bot");
    }
  };

  const otherSteps = (excludeId: string) => current.steps.filter((s) => s.id !== excludeId);

  return (
    <section className="scroll-slim flex h-full flex-1 flex-col overflow-y-auto bg-bg px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Bot</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Flujo automatico para numeros de WhatsApp sin conversacion previa. El primer paso se manda una sola vez;
            cada pregunta admite hasta 3 botones. Si el cliente escribe texto libre en vez de tocar un boton, el bot
            se calla y sigue la asesora.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={current.enabled}
          onClick={() => setState({ enabled: !current.enabled })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${current.enabled ? "bg-brand" : "bg-muted-2"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              current.enabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {!isMockMode && !dirty && (realFlow?.warnings.length ?? 0) > 0 && (
        <div className="mt-4 max-w-2xl rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-800">
          {realFlow?.warnings.map((w) => (
            <p key={w}>⚠️ {w}</p>
          ))}
        </div>
      )}

      <div className="mt-6 flex max-w-2xl flex-col gap-3">
        {current.steps.map((step) => (
          <div key={step.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-bg-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {step.type === "question" ? "Pregunta" : "Mensaje"}
                </span>
                {step.id === current.startId ? (
                  <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                    Inicio
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setState({ startId: step.id })}
                    className="text-[10px] font-medium text-muted underline-offset-2 hover:text-ink-soft hover:underline"
                  >
                    Usar como inicio
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-label="Borrar paso"
                onClick={() => removeStep(step.id)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-danger/10 hover:text-danger"
              >
                <Icon name="basura" size={13} />
              </button>
            </div>

            <textarea
              value={step.text}
              onChange={(e) => updateStep(step.id, { text: e.target.value })}
              rows={2}
              placeholder={step.type === "question" ? "Ej. Para que edad necesitas el inglés?" : "Texto del mensaje"}
              className="mt-2 w-full resize-none rounded-md border border-line px-2.5 py-2 text-sm focus:border-brand focus:outline-none"
            />

            {step.type === "question" ? (
              <div className="mt-3 flex flex-col gap-2">
                {step.options.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <input
                      value={option.title}
                      onChange={(e) => updateOption(step.id, option.id, { title: e.target.value })}
                      type="text"
                      maxLength={20}
                      placeholder="Texto del botón (máx. 20)"
                      className="w-40 rounded-md border border-line px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
                    />
                    <span className="text-xs text-muted">Lleva a</span>
                    <select
                      value={option.leadsTo ?? ""}
                      onChange={(e) => updateOption(step.id, option.id, { leadsTo: e.target.value || null })}
                      className="flex-1 rounded-md border border-line px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
                    >
                      <option value="">— (fin del flujo)</option>
                      {otherSteps(step.id).map((s) => (
                        <option key={s.id} value={s.id}>
                          {stepLabel(s, current.steps.indexOf(s))}
                        </option>
                      ))}
                    </select>
                    {step.options.length > 1 && (
                      <button
                        type="button"
                        aria-label="Borrar botón"
                        onClick={() => removeOption(step.id, option.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-bg-subtle"
                      >
                        <Icon name="mas" size={13} className="rotate-45" />
                      </button>
                    )}
                  </div>
                ))}
                {step.options.length < MAX_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => addOption(step.id)}
                    className="self-start text-xs font-medium text-brand hover:underline"
                  >
                    + Agregar botón
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted">Lleva a</span>
                <select
                  value={step.leadsTo ?? ""}
                  onChange={(e) => updateStep(step.id, { leadsTo: e.target.value || null })}
                  className="flex-1 rounded-md border border-line px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="">— (fin del flujo)</option>
                  {otherSteps(step.id).map((s) => (
                    <option key={s.id} value={s.id}>
                      {stepLabel(s, current.steps.indexOf(s))}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}

        {current.steps.length === 0 && (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            Todavía no hay pasos.
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addStep("message")}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-bg-subtle"
          >
            + Mensaje
          </button>
          <button
            type="button"
            onClick={() => addStep("question")}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-bg-subtle"
          >
            + Pregunta
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <div className="mt-1 flex items-center justify-end gap-2">
          {isLoading && !isMockMode && <span className="text-xs text-muted">Cargando…</span>}
          <button
            type="button"
            disabled={!dirty || !canSave || update.isPending}
            onClick={handleSave}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted-2"
          >
            Guardar
          </button>
        </div>
      </div>
    </section>
  );
}
