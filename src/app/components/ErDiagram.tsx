/**
 * @file ErDiagram.tsx
 * @description YYC³便携式智能AI系统 - 可视化数据库模式设计器(ER图)
 * Visual Database Schema Designer (ER Diagram)
 * SVG-based entity boxes with fields, PK/FK/Unique/Nullable badges,
 * relation lines (1:1, 1:N, M:N), add/remove entities, export SQL.
 * Liquid Glass aesthetic, fully i18n-driven. Prefix: er*
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,database,er-diagram,visualization
 */

import {
  Database, X, Plus, Trash2, Key, Link2, Copy,
  Hash, Type
} from 'lucide-react'
import { motion } from 'motion/react'
import React, { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Types ── */
type DataType = 'UUID' | 'VARCHAR' | 'TEXT' | 'INT' | 'BIGINT' | 'BOOLEAN' | 'TIMESTAMP' | 'JSON' | 'FLOAT' | 'SERIAL'
type RelationType = '1:1' | '1:N' | 'M:N'

interface Field {
  id: string
  name: string
  type: DataType
  pk: boolean
  fk: boolean
  unique: boolean
  nullable: boolean
  index: boolean
  defaultVal?: string
}

interface Entity {
  id: string
  name: string
  color: string
  x: number
  y: number
  fields: Field[]
}

interface Relation {
  id: string
  from: string  // entity.id
  fromField: string
  to: string
  toField: string
  type: RelationType
}

/* ── Mock data ── */
const MOCK_ENTITIES: Entity[] = [
  {
    id: 'users', name: 'users', color: '#6366f1', x: 60, y: 40,
    fields: [
      { id: 'u1', name: 'id', type: 'UUID', pk: true, fk: false, unique: true, nullable: false, index: true },
      { id: 'u2', name: 'email', type: 'VARCHAR', pk: false, fk: false, unique: true, nullable: false, index: true },
      { id: 'u3', name: 'name', type: 'VARCHAR', pk: false, fk: false, unique: false, nullable: false, index: false },
      { id: 'u4', name: 'role', type: 'VARCHAR', pk: false, fk: false, unique: false, nullable: false, index: true, defaultVal: "'viewer'" },
      { id: 'u5', name: 'avatar_url', type: 'TEXT', pk: false, fk: false, unique: false, nullable: true, index: false },
      { id: 'u6', name: 'created_at', type: 'TIMESTAMP', pk: false, fk: false, unique: false, nullable: false, index: false, defaultVal: 'NOW()' },
    ]
  },
  {
    id: 'projects', name: 'projects', color: '#10b981', x: 380, y: 40,
    fields: [
      { id: 'p1', name: 'id', type: 'UUID', pk: true, fk: false, unique: true, nullable: false, index: true },
      { id: 'p2', name: 'name', type: 'VARCHAR', pk: false, fk: false, unique: false, nullable: false, index: true },
      { id: 'p3', name: 'owner_id', type: 'UUID', pk: false, fk: true, unique: false, nullable: false, index: true },
      { id: 'p4', name: 'description', type: 'TEXT', pk: false, fk: false, unique: false, nullable: true, index: false },
      { id: 'p5', name: 'status', type: 'VARCHAR', pk: false, fk: false, unique: false, nullable: false, index: true, defaultVal: "'active'" },
      { id: 'p6', name: 'design_json', type: 'JSON', pk: false, fk: false, unique: false, nullable: true, index: false },
      { id: 'p7', name: 'updated_at', type: 'TIMESTAMP', pk: false, fk: false, unique: false, nullable: false, index: false },
    ]
  },
  {
    id: 'files', name: 'files', color: '#f59e0b', x: 380, y: 320,
    fields: [
      { id: 'f1', name: 'id', type: 'UUID', pk: true, fk: false, unique: true, nullable: false, index: true },
      { id: 'f2', name: 'project_id', type: 'UUID', pk: false, fk: true, unique: false, nullable: false, index: true },
      { id: 'f3', name: 'path', type: 'VARCHAR', pk: false, fk: false, unique: false, nullable: false, index: true },
      { id: 'f4', name: 'content', type: 'TEXT', pk: false, fk: false, unique: false, nullable: true, index: false },
      { id: 'f5', name: 'language', type: 'VARCHAR', pk: false, fk: false, unique: false, nullable: false, index: false },
      { id: 'f6', name: 'size', type: 'INT', pk: false, fk: false, unique: false, nullable: false, index: false },
    ]
  },
  {
    id: 'collab', name: 'collaborators', color: '#ec4899', x: 60, y: 320,
    fields: [
      { id: 'c1', name: 'id', type: 'SERIAL', pk: true, fk: false, unique: true, nullable: false, index: true },
      { id: 'c2', name: 'user_id', type: 'UUID', pk: false, fk: true, unique: false, nullable: false, index: true },
      { id: 'c3', name: 'project_id', type: 'UUID', pk: false, fk: true, unique: false, nullable: false, index: true },
      { id: 'c4', name: 'role', type: 'VARCHAR', pk: false, fk: false, unique: false, nullable: false, index: false, defaultVal: "'editor'" },
      { id: 'c5', name: 'joined_at', type: 'TIMESTAMP', pk: false, fk: false, unique: false, nullable: false, index: false },
    ]
  },
]

const MOCK_RELATIONS: Relation[] = [
  { id: 'r1', from: 'users', fromField: 'id', to: 'projects', toField: 'owner_id', type: '1:N' },
  { id: 'r2', from: 'projects', fromField: 'id', to: 'files', toField: 'project_id', type: '1:N' },
  { id: 'r3', from: 'users', fromField: 'id', to: 'collab', toField: 'user_id', type: '1:N' },
  { id: 'r4', from: 'projects', fromField: 'id', to: 'collab', toField: 'project_id', type: '1:N' },
]

/* ── SQL generator ── */
function generateSQL(entities: Entity[], relations: Relation[]): string {
  const lines: string[] = ['-- YYC3 PortAISys - Generated Schema', `-- ${new Date().toISOString()}`, '']
  entities.forEach(e => {
    lines.push(`CREATE TABLE "${e.name}" (`)
    const fieldLines = e.fields.map((f, _idx) => {
      let line = `  "${f.name}" ${f.type}`
      if (f.pk) line += ' PRIMARY KEY'
      if (f.unique && !f.pk) line += ' UNIQUE'
      if (!f.nullable) line += ' NOT NULL'
      if (f.defaultVal) line += ` DEFAULT ${f.defaultVal}`
      return line
    })
    lines.push(fieldLines.join(',\n'))
    lines.push(');\n')
  })
  relations.forEach(r => {
    const from = entities.find(e => e.id === r.to)
    if (from) {
      lines.push(`ALTER TABLE "${from.name}" ADD CONSTRAINT "fk_${r.toField}" FOREIGN KEY ("${r.toField}") REFERENCES "${entities.find(e => e.id === r.from)?.name}" ("${r.fromField}");`)
    }
  })
  return lines.join('\n')
}

const ENTITY_W = 260
const FIELD_H = 22
const HEADER_H = 32

/* ══════════════════════════════════════════ */

interface ErDiagramProps { open: boolean; onClose: () => void }

export function ErDiagram({ open, onClose }: ErDiagramProps) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [entities, setEntities] = useState<Entity[]>(MOCK_ENTITIES)
  const [relations] = useState<Relation[]>(MOCK_RELATIONS)
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [showSQL, setShowSQL] = useState(false)
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number } | null>(null)

  const sql = useMemo(() => generateSQL(entities, relations), [entities, relations])
  const totalFields = useMemo(() => entities.reduce((s, e) => s + e.fields.length, 0), [entities])

  const addEntity = useCallback(() => {
    const ne: Entity = {
      id: `e-${Date.now()}`, name: 'new_table', color: '#94a3b8',
      x: 100 + Math.random() * 200, y: 100 + Math.random() * 200,
      fields: [
        { id: `f-${Date.now()}`, name: 'id', type: 'UUID', pk: true, fk: false, unique: true, nullable: false, index: true },
      ],
    }
    setEntities(prev => [...prev, ne])
    setSelectedEntity(ne.id)
  }, [])

  const removeEntity = useCallback((eid: string) => {
    setEntities(prev => prev.filter(e => e.id !== eid))
    if (selectedEntity === eid) setSelectedEntity(null)
    toast.success(i.erRemoveEntity)
  }, [selectedEntity, i])

  const addField = useCallback((eid: string) => {
    setEntities(prev => prev.map(e => e.id === eid ? {
      ...e,
      fields: [...e.fields, { id: `f-${Date.now()}`, name: 'new_field', type: 'VARCHAR', pk: false, fk: false, unique: false, nullable: true, index: false }]
    } : e))
  }, [])

  const handleMouseDown = useCallback((eid: string, ex: number, ey: number) => {
    const ent = entities.find(e => e.id === eid)
    if (!ent) return
    setDragging({ id: eid, offX: ex - ent.x, offY: ey - ent.y })
  }, [entities])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const svg = e.currentTarget.getBoundingClientRect()
    const nx = e.clientX - svg.left - dragging.offX
    const ny = e.clientY - svg.top - dragging.offY
    setEntities(prev => prev.map(ent => ent.id === dragging.id ? { ...ent, x: Math.max(0, nx), y: Math.max(0, ny) } : ent))
  }, [dragging])

  const handleMouseUp = useCallback(() => setDragging(null), [])

  const getEntityCenter = (eid: string, fieldName: string): { x: number; y: number } => {
    const ent = entities.find(e => e.id === eid)
    if (!ent) return { x: 0, y: 0 }
    const fIdx = ent.fields.findIndex(f => f.name === fieldName)
    return { x: ent.x + ENTITY_W / 2, y: ent.y + HEADER_H + fIdx * FIELD_H + FIELD_H / 2 }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-6xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-50 to-blue-50'}`}>
                <Database className={`w-4 h-4 ${t.isDark ? 'text-cyan-400' : 'text-cyan-500'}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{i.erTitle}</h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>{i.erSubtitle} · {entities.length} {i.erEntityCount} · {totalFields} {i.erFieldCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={addEntity} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] ${t.transition} ${t.interactive.iconBtn}`}>
                <Plus className="w-3 h-3" /> {i.erAddEntity}
              </button>
              <button onClick={() => setShowSQL(!showSQL)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] ${t.transition} ${showSQL ? t.accent.primaryBg + ' ' + t.accent.primary : t.interactive.iconBtn}`}>
                <Hash className="w-3 h-3" /> {i.erExportSQL}
              </button>
              <button onClick={onClose} className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* SVG Canvas */}
            <div className={`flex-1 overflow-auto ${t.scrollbar}`}>
              <svg
                width={800} height={600}
                className={`min-w-full min-h-full ${t.isDark ? 'bg-[#080e1c]' : 'bg-slate-50'}`}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Grid */}
                <defs>
                  <pattern id="er-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke={t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'} strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#er-grid)" />

                {/* Relation lines */}
                {relations.map(rel => {
                  const fromPt = getEntityCenter(rel.from, rel.fromField)
                  const toPt = getEntityCenter(rel.to, rel.toField)
                  const midX = (fromPt.x + toPt.x) / 2
                  return (
                    <g key={rel.id}>
                      <path
                        d={`M ${fromPt.x} ${fromPt.y} C ${midX} ${fromPt.y}, ${midX} ${toPt.y}, ${toPt.x} ${toPt.y}`}
                        fill="none" stroke={t.isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'} strokeWidth={1.5} strokeDasharray={rel.type === 'M:N' ? '6 3' : 'none'}
                      />
                      {/* Type label */}
                      <text x={midX} y={(fromPt.y + toPt.y) / 2 - 6} textAnchor="middle" fontSize={8} fill={t.isDark ? '#818cf8' : '#6366f1'} fontFamily="monospace">{rel.type}</text>
                      {/* Cardinality markers */}
                      <circle cx={fromPt.x} cy={fromPt.y} r={3} fill={t.isDark ? '#818cf8' : '#6366f1'} />
                      {rel.type === '1:N' || rel.type === 'M:N' ? (
                        <>
                          <line x1={toPt.x - 6} y1={toPt.y - 4} x2={toPt.x} y2={toPt.y} stroke={t.isDark ? '#818cf8' : '#6366f1'} strokeWidth={1.5} />
                          <line x1={toPt.x - 6} y1={toPt.y + 4} x2={toPt.x} y2={toPt.y} stroke={t.isDark ? '#818cf8' : '#6366f1'} strokeWidth={1.5} />
                        </>
                      ) : (
                        <circle cx={toPt.x} cy={toPt.y} r={3} fill={t.isDark ? '#818cf8' : '#6366f1'} />
                      )}
                    </g>
                  )
                })}

                {/* Entity boxes */}
                {entities.map(entity => {
                  const h = HEADER_H + entity.fields.length * FIELD_H + 4
                  const isSel = selectedEntity === entity.id
                  return (
                    <g key={entity.id}>
                      {/* Shadow */}
                      <rect x={entity.x + 2} y={entity.y + 2} width={ENTITY_W} height={h} rx={8} fill="rgba(0,0,0,0.15)" />
                      {/* Body */}
                      <rect
                        x={entity.x} y={entity.y} width={ENTITY_W} height={h} rx={8}
                        fill={t.isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)'}
                        stroke={isSel ? entity.color : (t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)')}
                        strokeWidth={isSel ? 2 : 1}
                        className="cursor-move"
                        onMouseDown={(e) => { handleMouseDown(entity.id, e.clientX - e.currentTarget.closest('svg')!.getBoundingClientRect().left, e.clientY - e.currentTarget.closest('svg')!.getBoundingClientRect().top); setSelectedEntity(entity.id) }}
                      />
                      {/* Header */}
                      <rect x={entity.x} y={entity.y} width={ENTITY_W} height={HEADER_H} rx={8} fill={entity.color + '20'} />
                      <rect x={entity.x} y={entity.y + HEADER_H - 8} width={ENTITY_W} height={8} fill={entity.color + '20'} />
                      <text x={entity.x + 10} y={entity.y + 20} fontSize={11} fontWeight={700} fill={entity.color} fontFamily="monospace">{entity.name}</text>
                      <text x={entity.x + ENTITY_W - 10} y={entity.y + 20} fontSize={8} textAnchor="end" fill={t.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}>{entity.fields.length}F</text>
                      {/* Fields */}
                      {entity.fields.map((field, fIdx) => {
                        const fy = entity.y + HEADER_H + fIdx * FIELD_H
                        return (
                          <g key={field.id}>
                            <text x={entity.x + 10} y={fy + 15} fontSize={9} fill={t.isDark ? '#e2e8f0' : '#334155'} fontFamily="monospace">
                              {field.name}
                            </text>
                            <text x={entity.x + 140} y={fy + 15} fontSize={8} fill={t.isDark ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.6)'} fontFamily="monospace">
                              {field.type}
                            </text>
                            {/* Badges */}
                            {field.pk && <rect x={entity.x + 205} y={fy + 5} width={16} height={12} rx={3} fill="#f59e0b30" />}
                            {field.pk && <text x={entity.x + 207} y={fy + 14} fontSize={6} fill="#f59e0b" fontWeight={700}>PK</text>}
                            {field.fk && <rect x={entity.x + 225} y={fy + 5} width={16} height={12} rx={3} fill="#6366f130" />}
                            {field.fk && <text x={entity.x + 227} y={fy + 14} fontSize={6} fill="#6366f1" fontWeight={700}>FK</text>}
                            {field.nullable && <text x={entity.x + 245} y={fy + 14} fontSize={7} fill={t.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}>?</text>}
                          </g>
                        )
                      })}
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* SQL Preview / Entity Detail */}
            {(showSQL || selectedEntity) && (
              <div className={`w-72 flex-shrink-0 border-l ${t.border.subtle} flex flex-col overflow-hidden`}>
                {showSQL ? (
                  <div className="flex flex-col h-full">
                    <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border.subtle}`}>
                      <span className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{i.erExportSQL}</span>
                      <button onClick={() => { navigator.clipboard.writeText(sql); toast.success(i.codeCopied) }} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}>
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <pre className={`flex-1 overflow-auto p-3 font-mono text-[8px] ${t.isDark ? 'text-emerald-300/70' : 'text-slate-600'} ${t.scrollbar}`}>{sql}</pre>
                  </div>
                ) : selectedEntity && (() => {
                  const ent = entities.find(e => e.id === selectedEntity)
                  if (!ent) return null
                  return (
                    <div className={`flex flex-col h-full overflow-y-auto p-4 space-y-3 ${t.scrollbar}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: ent.color }} />
                        <span className={`text-[12px] font-mono ${t.text.primary}`} style={{ fontWeight: 700 }}>{ent.name}</span>
                      </div>
                      <div className={`text-[8px] ${t.text.dimmed}`}>{ent.fields.length} {i.erFieldCount}</div>
                      <div className="space-y-1">
                        {ent.fields.map(f => (
                          <div key={f.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                            {f.pk && <Key className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                            {f.fk && <Link2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                            {!f.pk && !f.fk && <Type className="w-3 h-3 flex-shrink-0" style={{ color: t.isDark ? '#475569' : '#94a3b8' }} />}
                            <span className={`text-[9px] font-mono ${t.text.primary}`} style={{ fontWeight: 500 }}>{f.name}</span>
                            <span className={`text-[7px] ml-auto ${t.text.dimmed}`}>{f.type}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addField(ent.id)} className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] border border-dashed ${t.border.subtle} ${t.transition} ${t.interactive.menuItem}`}>
                        <Plus className="w-3 h-3" /> {i.erAddField}
                      </button>
                      <button onClick={() => removeEntity(ent.id)} className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] text-red-400 border border-dashed border-red-500/20 ${t.transition} hover:bg-red-500/5`}>
                        <Trash2 className="w-3 h-3" /> {i.erRemoveEntity}
                      </button>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  )
}
