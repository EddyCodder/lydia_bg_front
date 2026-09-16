"use client";

import { useState } from "react";
import {
  agents,
  calendarEvents,
  getLeadSourceBreakdown,
  getLeadsByStage,
  insightsSnapshot,
  leads,
  conversations,
  sumBudget,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import { Icon } from "@/components/icons";
import { StatTile } from "./StatTile";
import { SourceBarList } from "./SourceBarList";

const rangeTabs = ["Hoy", "Ayer", "Semana", "Mes"] as const;

export function PersonalDashboard() {
  const [range, setRange] = useState<(typeof rangeTabs)[number]>("Semana");
  const [userFilter, setUserFilter] = useState("todo");

  const dialogosVigentes = conversations.filter((c) => c.status !== "cerrado").length;
  const dialogosSinReplica = conversations.filter((c) => c.status === "sin_respuesta").length;
  const leadsGanados = getLeadsByStage(leads, "matriculado");
  const leadsActivos = leads.filter((l) => l.stage !== "matriculado" && l.stage !== "venta_perdida");
  const leadsPerdidos = getLeadsByStage(leads, "venta_perdida");
  const leadsSinTareas = leads.filter((l) => !l.hasPendingTasks).length;
  const fuentes = getLeadSourceBreakdown(leads);

  return (
    <section className="scroll-slim h-full flex-1 overflow-y-auto bg-gradient-to-br from-[#0b1a33] to-[#0f2447] px-8 py-6">
      <h1 className="text-2xl font-bold text-white">Brittany Group 2026</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-md border border-white/15 bg-[#132845] p-1 text-sm font-semibold text-[#c3c2b7]">
          {rangeTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setRange(tab)}
              className={`rounded px-3 py-1 uppercase tracking-wide ${
                range === tab ? "bg-white/10 text-white" : "hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            type="button"
            className="flex items-center gap-1 rounded px-3 py-1 uppercase tracking-wide hover:text-white"
          >
            <Icon name="calendario" size={14} />
            Fechas
          </button>
        </div>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="rounded-md border border-white/15 bg-[#132845] px-3 py-2 text-sm font-medium text-[#c3c2b7] focus:outline-none"
        >
          <option value="todo">Todo</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="ml-auto flex items-center gap-1.5 rounded-md border border-white/15 bg-[#132845] px-3 py-2 text-sm font-semibold text-[#c3c2b7] hover:text-white"
        >
          <Icon name="ajustes" size={14} />
          Configurar
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="row-span-2 rounded-lg border border-white/10 bg-[#132845] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c3c2b7]">Mensajes entrantes</p>
            <Icon name="bandeja" size={16} className="text-[#c3c2b7]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{insightsSnapshot.mensajesEntrantes.total}</p>
          <p className="flex items-center gap-1 text-xs font-semibold text-[#0ca30c]">
            <Icon name="flecha" size={12} strokeWidth={2.5} className="-rotate-90" />+
            {insightsSnapshot.deltasPorSemana.mensajesEntrantes} por semana
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {insightsSnapshot.mensajesEntrantes.canales.map((canal) => (
              <div key={canal.label} className="flex items-center justify-between text-xs">
                <span className="text-[#c3c2b7]">{canal.label}</span>
                <span className="font-semibold text-white">{canal.value}</span>
              </div>
            ))}
          </div>
        </div>

        <StatTile
          label="Diálogos vigentes"
          value={String(dialogosVigentes)}
          delta={insightsSnapshot.deltasPorSemana.dialogosVigentes}
          icon="chat"
        />
        <StatTile
          label="Diálogos sin réplica"
          value={String(dialogosSinReplica)}
          delta={insightsSnapshot.deltasPorSemana.dialogosSinReplica}
          invert
          icon="chat"
        />

        <div className="row-span-2 rounded-lg border border-white/10 bg-[#132845] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#c3c2b7]">Fuentes de leads</p>
          <div className="mt-4">
            <SourceBarList entries={fuentes} />
          </div>
        </div>

        <StatTile label="Lapso medio de réplica" value={insightsSnapshot.lapsoMedioRespuesta} icon="rayo" />
        <StatTile label="Lapso mayor de réplica" value={insightsSnapshot.lapsoMayorRespuesta} icon="rayo" />

        <StatTile
          label="Leads ganados"
          value={String(leadsGanados.length)}
          subValue={formatCurrency(sumBudget(leadsGanados))}
          delta={insightsSnapshot.deltasPorSemana.leadsGanados}
          icon="embudo"
        />
        <StatTile
          label="Cantidad de leads activos"
          value={String(leadsActivos.length)}
          subValue={formatCurrency(sumBudget(leadsActivos))}
          delta={insightsSnapshot.deltasPorSemana.leadsActivos}
          icon="tabla"
        />
        <StatTile
          label="Tareas"
          value={String(calendarEvents.length)}
          delta={insightsSnapshot.deltasPorSemana.tareas}
          icon="calendario"
        />

        <StatTile label="Cantidad de leads perdidos" value={String(leadsPerdidos.length)} icon="embudo" />
        <StatTile label="Leads sin tareas" value={String(leadsSinTareas)} icon="calendario" />
      </div>
    </section>
  );
}
