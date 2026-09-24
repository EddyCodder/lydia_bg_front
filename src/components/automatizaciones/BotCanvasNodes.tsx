"use client";

import { createContext, useContext } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon } from "@/components/icons";

export interface BotCanvasOption {
  id: string;
  title: string;
}

export interface BotMessageNodeData {
  text: string;
  isStart: boolean;
  [key: string]: unknown;
}

export interface BotQuestionNodeData {
  text: string;
  isStart: boolean;
  options: BotCanvasOption[];
  [key: string]: unknown;
}

export interface BotCanvasActions {
  updateText: (nodeId: string, text: string) => void;
  setStart: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  addOption: (nodeId: string) => void;
  updateOption: (nodeId: string, optionId: string, title: string) => void;
  removeOption: (nodeId: string, optionId: string) => void;
}

export const BotCanvasActionsContext = createContext<BotCanvasActions | null>(null);

export function useBotCanvasActions(): BotCanvasActions {
  const ctx = useContext(BotCanvasActionsContext);
  if (!ctx) throw new Error("useBotCanvasActions debe usarse dentro de BotFlowCanvas");
  return ctx;
}

export const MAX_OPTIONS = 3;

// Cabecera comun (tipo, marca de inicio, borrar) para los dos tipos de nodo.
function NodeHeader({ id, label, isStart }: { id: string; label: string; isStart: boolean }) {
  const { setStart, deleteNode } = useBotCanvasActions();
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/20 px-3 py-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{label}</span>
        {isStart ? (
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">Inicio</span>
        ) : (
          <button
            type="button"
            className="nodrag text-[10px] font-medium text-white/60 underline-offset-2 hover:text-white hover:underline"
            onClick={() => setStart(id)}
          >
            Usar como inicio
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Borrar paso"
        className="nodrag flex h-5 w-5 items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white"
        onClick={() => deleteNode(id)}
      >
        <Icon name="basura" size={12} />
      </button>
    </div>
  );
}

export function MessageNode({ id, data, selected }: NodeProps & { data: BotMessageNodeData }) {
  const { updateText } = useBotCanvasActions();
  return (
    <div
      className={`w-64 rounded-lg bg-brand text-white shadow-md ${selected ? "ring-2 ring-white" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-brand !bg-white" />
      <NodeHeader id={id} label="Mensaje" isStart={data.isStart} />
      <div className="p-2">
        <textarea
          value={data.text}
          onChange={(e) => updateText(id, e.target.value)}
          placeholder="Texto del mensaje"
          rows={3}
          className="nodrag w-full resize-none rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-sm text-white placeholder:text-white/50 focus:border-white/60 focus:outline-none"
        />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="!h-3 !w-3 !border-2 !border-brand !bg-white"
      />
    </div>
  );
}

export function QuestionNode({ id, data, selected }: NodeProps & { data: BotQuestionNodeData }) {
  const { updateText, addOption, updateOption, removeOption } = useBotCanvasActions();
  return (
    <div className={`w-72 rounded-lg bg-accent text-white shadow-md ${selected ? "ring-2 ring-white" : ""}`}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-accent !bg-white" />
      <NodeHeader id={id} label="Pregunta" isStart={data.isStart} />
      <div className="p-2">
        <textarea
          value={data.text}
          onChange={(e) => updateText(id, e.target.value)}
          placeholder="Texto de la pregunta"
          rows={2}
          className="nodrag w-full resize-none rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-sm text-white placeholder:text-white/50 focus:border-white/60 focus:outline-none"
        />

        <div className="mt-2 flex flex-col gap-1.5">
          {data.options.map((option) => (
            <div key={option.id} className="relative flex items-center gap-1.5 pr-2">
              <input
                value={option.title}
                onChange={(e) => updateOption(id, option.id, e.target.value)}
                type="text"
                maxLength={20}
                placeholder="Botón (máx. 20)"
                className="nodrag w-full rounded-md border border-white/30 bg-white/10 px-2 py-1 text-xs text-white placeholder:text-white/50 focus:border-white/60 focus:outline-none"
              />
              {data.options.length > 1 && (
                <button
                  type="button"
                  aria-label="Borrar botón"
                  className="nodrag flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white"
                  onClick={() => removeOption(id, option.id)}
                >
                  <Icon name="mas" size={11} className="rotate-45" />
                </button>
              )}
              <Handle
                type="source"
                position={Position.Right}
                id={option.id}
                className="!h-3 !w-3 !border-2 !border-accent !bg-white"
              />
            </div>
          ))}
        </div>

        {data.options.length < MAX_OPTIONS && (
          <button
            type="button"
            className="nodrag mt-1.5 text-xs font-medium text-white/80 hover:text-white hover:underline"
            onClick={() => addOption(id)}
          >
            + Agregar botón
          </button>
        )}
      </div>
    </div>
  );
}
