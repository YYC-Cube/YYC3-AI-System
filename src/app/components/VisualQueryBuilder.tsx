/**
 * @file VisualQueryBuilder.tsx
 * @description YYC³便携式智能AI系统 - 可视化数据库查询构建器
 * Visual Database Query Builder
 * Drag-and-drop query construction, JOIN visualization, query plan analysis,
 * table selection, column picker, WHERE/ORDER/GROUP/LIMIT clauses.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,database,query-builder,sql,visual
 */

import {
  X, Database, Table2, Columns3, Filter, ArrowUpDown,
  Group, Hash, Play, Copy, Trash2, Plus,
  ArrowRight, Link2, Code, ChevronDown, ChevronRight,
  CheckCircle2, Zap, Layers,
  GitMerge, ArrowLeftRight, BarChart3
} from 'lucide-react'
import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

type QueryTab = 'builder' | 'sql' | 'plan' | 'results'
type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS'
type FilterOp = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL' | 'BETWEEN'
type SortDir = 'ASC' | 'DESC'

interface TableDef {
  name: string
  schema: string
  alias: string
  columns: ColumnDef[]
  selected: boolean
}

interface ColumnDef {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  foreignKey?: { table: string; column: string }
}

interface JoinClause {
  id: string
  type: JoinType
  leftTable: string
  leftColumn: string
  rightTable: string
  rightColumn: string
}

interface WhereClause {
  id: string
  column: string
  table: string
  operator: FilterOp
  value: string
  logic: 'AND' | 'OR'
}

interface OrderClause {
  id: string
  column: string
  table: string
  direction: SortDir
}

interface GroupClause {
  id: string
  column: string
  table: string
}

interface QueryPlanNode {
  id: string
  type: string
  table?: string
  cost: number
  rows: number
  width: number
  children: QueryPlanNode[]
}

// Demo schema
const DEMO_TABLES: TableDef[] = [
  {
    name: 'users', schema: 'public', alias: 'u', selected: false,
    columns: [
      { name: 'id', type: 'serial', nullable: false, primaryKey: true },
      { name: 'name', type: 'varchar(100)', nullable: false, primaryKey: false },
      { name: 'email', type: 'varchar(255)', nullable: false, primaryKey: false },
      { name: 'role', type: 'varchar(20)', nullable: true, primaryKey: false },
      { name: 'created_at', type: 'timestamp', nullable: false, primaryKey: false },
      { name: 'department_id', type: 'integer', nullable: true, primaryKey: false, foreignKey: { table: 'departments', column: 'id' } },
    ]
  },
  {
    name: 'orders', schema: 'public', alias: 'o', selected: false,
    columns: [
      { name: 'id', type: 'serial', nullable: false, primaryKey: true },
      { name: 'user_id', type: 'integer', nullable: false, primaryKey: false, foreignKey: { table: 'users', column: 'id' } },
      { name: 'total', type: 'decimal(10,2)', nullable: false, primaryKey: false },
      { name: 'status', type: 'varchar(20)', nullable: false, primaryKey: false },
      { name: 'created_at', type: 'timestamp', nullable: false, primaryKey: false },
      { name: 'product_id', type: 'integer', nullable: true, primaryKey: false, foreignKey: { table: 'products', column: 'id' } },
    ]
  },
  {
    name: 'products', schema: 'public', alias: 'p', selected: false,
    columns: [
      { name: 'id', type: 'serial', nullable: false, primaryKey: true },
      { name: 'name', type: 'varchar(200)', nullable: false, primaryKey: false },
      { name: 'price', type: 'decimal(10,2)', nullable: false, primaryKey: false },
      { name: 'category', type: 'varchar(50)', nullable: true, primaryKey: false },
      { name: 'stock', type: 'integer', nullable: false, primaryKey: false },
    ]
  },
  {
    name: 'departments', schema: 'public', alias: 'd', selected: false,
    columns: [
      { name: 'id', type: 'serial', nullable: false, primaryKey: true },
      { name: 'name', type: 'varchar(100)', nullable: false, primaryKey: false },
      { name: 'manager_id', type: 'integer', nullable: true, primaryKey: false, foreignKey: { table: 'users', column: 'id' } },
    ]
  },
]

const DEMO_PLAN: QueryPlanNode = {
  id: 'root', type: 'Hash Join', cost: 245.5, rows: 150, width: 120,
  children: [
    { id: 'scan1', type: 'Seq Scan', table: 'users', cost: 45.2, rows: 500, width: 80, children: [] },
    {
      id: 'hash1', type: 'Hash', cost: 120.3, rows: 1200, width: 60,
      children: [
        { id: 'scan2', type: 'Index Scan', table: 'orders', cost: 80.1, rows: 1200, width: 60, children: [] }
      ]
    },
  ]
}

export function VisualQueryBuilder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [activeTab, setActiveTab] = useState<QueryTab>('builder')
  const [tables, setTables] = useState<TableDef[]>(DEMO_TABLES)
  const [selectedColumns, setSelectedColumns] = useState<{ table: string; column: string; alias?: string }[]>([])
  const [joins, setJoins] = useState<JoinClause[]>([])
  const [wheres, setWheres] = useState<WhereClause[]>([])
  const [orders, setOrders] = useState<OrderClause[]>([])
  const [groups, setGroups] = useState<GroupClause[]>([])
  const [limit, setLimit] = useState<number>(100)
  const [distinct, setDistinct] = useState(false)
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const selectedTables = tables.filter(t => t.selected)

  const toggleTable = (name: string) => {
    setTables(prev => prev.map(t => t.name === name ? { ...t, selected: !t.selected } : t))
    // If deselecting, remove related columns, joins, filters
    const table = tables.find(t => t.name === name)
    if (table?.selected) {
      setSelectedColumns(prev => prev.filter(c => c.table !== name))
      setJoins(prev => prev.filter(j => j.leftTable !== name && j.rightTable !== name))
      setWheres(prev => prev.filter(w => w.table !== name))
      setOrders(prev => prev.filter(o => o.table !== name))
      setGroups(prev => prev.filter(g => g.table !== name))
    }
  }

  const toggleColumn = (table: string, column: string) => {
    setSelectedColumns(prev => {
      const exists = prev.some(c => c.table === table && c.column === column)
      if (exists) return prev.filter(c => !(c.table === table && c.column === column))
      return [...prev, { table, column }]
    })
  }

  const selectAllColumns = (tableName: string) => {
    const table = tables.find(t => t.name === tableName)
    if (!table) return
    const allSelected = table.columns.every(col => selectedColumns.some(c => c.table === tableName && c.column === col.name))
    if (allSelected) {
      setSelectedColumns(prev => prev.filter(c => c.table !== tableName))
    } else {
      const newCols = table.columns
        .filter(col => !selectedColumns.some(c => c.table === tableName && c.column === col.name))
        .map(col => ({ table: tableName, column: col.name }))
      setSelectedColumns(prev => [...prev, ...newCols])
    }
  }

  const addJoin = () => {
    if (selectedTables.length < 2) return
    const t1 = selectedTables[0]
    const t2 = selectedTables[selectedTables.length > 1 ? 1 : 0]
    // Find FK relationship
    let leftCol = 'id', rightCol = 'id'
    for (const col of t2.columns) {
      if (col.foreignKey?.table === t1.name) {
        leftCol = col.foreignKey.column
        rightCol = col.name
        break
      }
    }
    setJoins(prev => [...prev, {
      id: `join-${Date.now()}`,
      type: 'INNER',
      leftTable: t1.name,
      leftColumn: leftCol,
      rightTable: t2.name,
      rightColumn: rightCol,
    }])
  }

  const removeJoin = (id: string) => setJoins(prev => prev.filter(j => j.id !== id))

  const addWhere = () => {
    if (selectedColumns.length === 0) return
    const col = selectedColumns[0]
    setWheres(prev => [...prev, {
      id: `where-${Date.now()}`,
      column: col.column,
      table: col.table,
      operator: '=',
      value: '',
      logic: 'AND',
    }])
  }

  const removeWhere = (id: string) => setWheres(prev => prev.filter(w => w.id !== id))

  const addOrder = () => {
    if (selectedColumns.length === 0) return
    const col = selectedColumns[0]
    setOrders(prev => [...prev, {
      id: `order-${Date.now()}`,
      column: col.column,
      table: col.table,
      direction: 'ASC',
    }])
  }

  const removeOrder = (id: string) => setOrders(prev => prev.filter(o => o.id !== id))

  const addGroup = () => {
    if (selectedColumns.length === 0) return
    const col = selectedColumns[0]
    setGroups(prev => [...prev, {
      id: `group-${Date.now()}`,
      column: col.column,
      table: col.table,
    }])
  }

  const removeGroup = (id: string) => setGroups(prev => prev.filter(g => g.id !== id))

  // Generate SQL
  const generateSQL = useCallback((): string => {
    if (selectedColumns.length === 0 && selectedTables.length === 0) return '-- Select tables and columns to build query'

    const cols = selectedColumns.length > 0
      ? selectedColumns.map(c => `${c.table}.${c.column}${c.alias ? ` AS ${c.alias}` : ''}`).join(',\n  ')
      : selectedTables.map(t => `${t.name}.*`).join(', ')

    let sql = `SELECT ${distinct ? 'DISTINCT ' : ''}\n  ${cols}`

    if (selectedTables.length > 0) {
      sql += `\nFROM ${selectedTables[0].name}`
    }

    for (const join of joins) {
      sql += `\n${join.type} JOIN ${join.rightTable}\n  ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}`
    }

    if (wheres.length > 0) {
      sql += '\nWHERE '
      sql += wheres.map((w, idx) => {
        const prefix = idx > 0 ? `${w.logic} ` : ''
        if (w.operator === 'IS NULL' || w.operator === 'IS NOT NULL') {
          return `${prefix}${w.table}.${w.column} ${w.operator}`
        }
        return `${prefix}${w.table}.${w.column} ${w.operator} '${w.value}'`
      }).join('\n  ')
    }

    if (groups.length > 0) {
      sql += '\nGROUP BY ' + groups.map(g => `${g.table}.${g.column}`).join(', ')
    }

    if (orders.length > 0) {
      sql += '\nORDER BY ' + orders.map(o => `${o.table}.${o.column} ${o.direction}`).join(', ')
    }

    sql += `\nLIMIT ${limit};`

    return sql
  }, [selectedColumns, selectedTables, joins, wheres, orders, groups, limit, distinct])

  const copySQL = () => {
    navigator.clipboard.writeText(generateSQL())
    toast.success(i.vqCopied)
  }

  if (!open) return null

  const sql = generateSQL()

  const tabs: { id: QueryTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'builder', label: i.vqBuilder, icon: Layers },
    { id: 'sql', label: i.vqSqlPreview, icon: Code },
    { id: 'plan', label: i.vqQueryPlan, icon: BarChart3 },
    { id: 'results', label: i.vqResults, icon: Table2 },
  ]

  const renderPlanNode = (node: QueryPlanNode, depth: number = 0): React.ReactNode => (
    <div key={node.id} style={{ marginLeft: `${depth * 24}px` }} className="mb-1">
      <div className={`flex items-center space-x-2 p-2 rounded-lg text-[11px] ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
        <div className={`w-2 h-2 rounded-full ${node.cost > 100 ? 'bg-red-400' : node.cost > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
        <span style={{ fontWeight: 500 }}>{node.type}</span>
        {node.table && <span className={`px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-400`}>{node.table}</span>}
        <ArrowRight className="w-3 h-3" />
        <span className={t.text.muted}>{i.vqCost}: {node.cost.toFixed(1)}</span>
        <span className={t.text.muted}>{i.vqRows}: {node.rows}</span>
      </div>
      {node.children.map(child => renderPlanNode(child, depth + 1))}
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} data-testid="query-backdrop" />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div data-testid="query-panel" className={`w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${t.border.subtle} flex-shrink-0`}>
            <div className="flex items-center space-x-3">
              <Database className={`w-5 h-5 ${t.accent.primary}`} />
              <div>
                <h2 className="text-[15px]" style={{ fontWeight: 600 }}>{i.vqTitle}</h2>
                <p className={`text-[11px] ${t.text.muted}`}>{i.vqSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={copySQL} data-testid="query-copy-btn" className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] ${t.interactive.menuItem}`}>
                <Copy className="w-3 h-3" />
                <span>{i.vqCopySQL}</span>
              </button>
              <button
                onClick={() => { setShowResults(true); setActiveTab('results'); toast.success(i.vqExecuted) }}
                data-testid="query-execute-btn"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                style={{ fontWeight: 500 }}
              >
                <Play className="w-3 h-3" />
                <span>{i.vqExecute}</span>
              </button>
              <button onClick={onClose} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} data-testid="query-close-btn">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex items-center space-x-1 px-6 py-2 border-b ${t.border.subtle} flex-shrink-0`}>
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`query-tab-${tab.id}`}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[12px] ${t.transition} ${
                    activeTab === tab.id ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.menuItem
                  }`}
                  style={{ fontWeight: activeTab === tab.id ? 500 : 400 }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {activeTab === 'builder' && (
              <>
                {/* Left: Table list */}
                <div data-testid="query-builder-tables" className={`w-56 flex-shrink-0 border-r ${t.border.subtle} overflow-y-auto p-3 space-y-2`}>
                  <h3 className={`text-[11px] uppercase tracking-wider mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.vqTables}</h3>
                  {tables.map(table => (
                    <div key={table.name}>
                      <div
                        className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer text-[12px] ${t.transition} ${
                          table.selected
                            ? `${t.accent.activeBg} ${t.accent.activeText}`
                            : t.interactive.menuItem
                        }`}
                        onClick={() => toggleTable(table.name)}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedTable(expandedTable === table.name ? null : table.name) }}
                          className="flex-shrink-0"
                        >
                          {expandedTable === table.name ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                        <Table2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="flex-1" style={{ fontWeight: table.selected ? 500 : 400 }}>{table.name}</span>
                        <span className={`text-[9px] ${t.text.dimmed}`}>{table.columns.length}</span>
                      </div>

                      {expandedTable === table.name && (
                        <div className="ml-5 mt-1 space-y-0.5">
                          <button
                            onClick={() => selectAllColumns(table.name)}
                            className={`w-full text-left px-2 py-1 rounded text-[10px] ${t.interactive.menuItem}`}
                          >
                            {i.vqSelectAll}
                          </button>
                          {table.columns.map(col => (
                            <div
                              key={col.name}
                              className={`flex items-center space-x-1.5 px-2 py-1 rounded cursor-pointer text-[10px] ${t.transition} ${
                                selectedColumns.some(c => c.table === table.name && c.column === col.name)
                                  ? 'bg-indigo-500/10 text-indigo-400'
                                  : t.interactive.menuItem
                              }`}
                              onClick={() => { if (table.selected) toggleColumn(table.name, col.name) }}
                            >
                              {col.primaryKey && <Hash className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />}
                              {col.foreignKey && <Link2 className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />}
                              {!col.primaryKey && !col.foreignKey && <Columns3 className="w-2.5 h-2.5 flex-shrink-0 opacity-30" />}
                              <span className="flex-1 truncate">{col.name}</span>
                              <span className={`text-[8px] ${t.text.dimmed}`}>{col.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Right: Query builder */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Selected columns */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-[11px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>
                        <Columns3 className="w-3.5 h-3.5 inline mr-1" />{i.vqColumns} ({selectedColumns.length})
                      </h3>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={distinct} onChange={(e) => setDistinct(e.target.checked)} className="rounded accent-indigo-500" />
                        <span className={`text-[10px] ${t.text.secondary}`}>DISTINCT</span>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedColumns.map(col => (
                        <span key={`${col.table}.${col.column}`} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] ${t.isDark ? 'bg-indigo-900/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                          <span style={{ fontWeight: 500 }}>{col.table}.{col.column}</span>
                          <button onClick={() => toggleColumn(col.table, col.column)} className="hover:text-red-400">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                      {selectedColumns.length === 0 && (
                        <span className={`text-[11px] ${t.text.muted}`}>{i.vqNoColumns}</span>
                      )}
                    </div>
                  </div>

                  {/* JOINs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-[11px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>
                        <GitMerge className="w-3.5 h-3.5 inline mr-1" />{i.vqJoins} ({joins.length})
                      </h3>
                      <button onClick={addJoin} disabled={selectedTables.length < 2} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] ${t.interactive.menuItem} ${selectedTables.length < 2 ? 'opacity-30' : ''}`}>
                        <Plus className="w-3 h-3" />
                        <span>{i.vqAddJoin}</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {joins.map(join => (
                        <div key={join.id} className={`flex items-center space-x-2 p-2 rounded-xl text-[11px] ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                          <select
                            value={join.type}
                            onChange={(e) => setJoins(prev => prev.map(j => j.id === join.id ? { ...j, type: e.target.value as JoinType } : j))}
                            className={`px-2 py-1 rounded text-[10px] ${t.isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700'} border ${t.border.subtle}`}
                          >
                            {(['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS'] as JoinType[]).map(jt => (
                              <option key={jt} value={jt}>{jt}</option>
                            ))}
                          </select>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-400`}>{join.leftTable}.{join.leftColumn}</span>
                          <ArrowLeftRight className="w-3 h-3 flex-shrink-0" />
                          <span className={`px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-400`}>{join.rightTable}.{join.rightColumn}</span>
                          <button onClick={() => removeJoin(join.id)} className="ml-auto text-red-400 hover:text-red-300">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WHERE */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-[11px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>
                        <Filter className="w-3.5 h-3.5 inline mr-1" />{i.vqWhere} ({wheres.length})
                      </h3>
                      <button onClick={addWhere} disabled={selectedColumns.length === 0} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] ${t.interactive.menuItem} ${selectedColumns.length === 0 ? 'opacity-30' : ''}`}>
                        <Plus className="w-3 h-3" /><span>{i.vqAddFilter}</span>
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {wheres.map((w, idx) => (
                        <div key={w.id} className={`flex items-center space-x-1.5 p-2 rounded-lg text-[11px] ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                          {idx > 0 && (
                            <select
                              value={w.logic}
                              onChange={(e) => setWheres(prev => prev.map(x => x.id === w.id ? { ...x, logic: e.target.value as 'AND' | 'OR' } : x))}
                              className={`px-1 py-0.5 rounded text-[9px] ${t.isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700'} border ${t.border.subtle}`}
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                            </select>
                          )}
                          <select
                            value={`${w.table}.${w.column}`}
                            onChange={(e) => { const [table, column] = e.target.value.split('.'); setWheres(prev => prev.map(x => x.id === w.id ? { ...x, table, column } : x)) }}
                            className={`px-1 py-0.5 rounded text-[9px] ${t.isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700'} border ${t.border.subtle}`}
                          >
                            {selectedColumns.map(c => (
                              <option key={`${c.table}.${c.column}`} value={`${c.table}.${c.column}`}>{c.table}.{c.column}</option>
                            ))}
                          </select>
                          <select
                            value={w.operator}
                            onChange={(e) => setWheres(prev => prev.map(x => x.id === w.id ? { ...x, operator: e.target.value as FilterOp } : x))}
                            className={`px-1 py-0.5 rounded text-[9px] ${t.isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700'} border ${t.border.subtle}`}
                          >
                            {(['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'] as FilterOp[]).map(op => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                          {w.operator !== 'IS NULL' && w.operator !== 'IS NOT NULL' && (
                            <input
                              type="text"
                              value={w.value}
                              onChange={(e) => setWheres(prev => prev.map(x => x.id === w.id ? { ...x, value: e.target.value } : x))}
                              placeholder="value"
                              className={`flex-1 px-2 py-0.5 rounded text-[10px] ${t.isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700'} border ${t.border.subtle}`}
                            />
                          )}
                          <button onClick={() => removeWhere(w.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ORDER BY + GROUP BY + LIMIT row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className={`text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>
                          <ArrowUpDown className="w-3 h-3 inline mr-1" />ORDER BY
                        </h3>
                        <button onClick={addOrder} disabled={selectedColumns.length === 0} className={`p-0.5 rounded ${t.interactive.iconBtn} ${selectedColumns.length === 0 ? 'opacity-30' : ''}`}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {orders.map(o => (
                        <div key={o.id} className={`flex items-center space-x-1 mb-1 text-[10px] ${t.isDark ? 'bg-slate-800/20' : 'bg-slate-50'} rounded p-1`}>
                          <span className="truncate flex-1">{o.table}.{o.column}</span>
                          <select
                            value={o.direction}
                            onChange={(e) => setOrders(prev => prev.map(x => x.id === o.id ? { ...x, direction: e.target.value as SortDir } : x))}
                            className={`px-1 py-0.5 rounded text-[9px] ${t.isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700'}`}
                          >
                            <option value="ASC">ASC</option>
                            <option value="DESC">DESC</option>
                          </select>
                          <button onClick={() => removeOrder(o.id)} className="text-red-400"><X className="w-2.5 h-2.5" /></button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className={`text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>
                          <Group className="w-3 h-3 inline mr-1" />GROUP BY
                        </h3>
                        <button onClick={addGroup} disabled={selectedColumns.length === 0} className={`p-0.5 rounded ${t.interactive.iconBtn} ${selectedColumns.length === 0 ? 'opacity-30' : ''}`}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {groups.map(g => (
                        <div key={g.id} className={`flex items-center space-x-1 mb-1 text-[10px] ${t.isDark ? 'bg-slate-800/20' : 'bg-slate-50'} rounded p-1`}>
                          <span className="truncate flex-1">{g.table}.{g.column}</span>
                          <button onClick={() => removeGroup(g.id)} className="text-red-400"><X className="w-2.5 h-2.5" /></button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className={`text-[10px] uppercase tracking-wider mb-1.5 ${t.text.muted}`} style={{ fontWeight: 600 }}>
                        <Hash className="w-3 h-3 inline mr-1" />LIMIT
                      </h3>
                      <input
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                        className={`w-full px-2 py-1 rounded-lg text-[11px] ${t.isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700'} border ${t.border.subtle}`}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'sql' && (
              <div className="flex-1 overflow-y-auto p-4">
                <pre data-testid="query-builder-sql" className={`p-4 rounded-xl text-[12px] font-mono whitespace-pre-wrap ${t.isDark ? 'bg-slate-900/50 text-emerald-300' : 'bg-slate-50 text-emerald-700'}`} style={{ lineHeight: '1.6' }}>
                  {sql}
                </pre>
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className={`flex items-center space-x-2 p-3 rounded-xl text-[11px] ${t.isDark ? 'bg-indigo-900/10' : 'bg-indigo-50'}`}>
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>{i.vqPlanDesc}</span>
                </div>
                {renderPlanNode(DEMO_PLAN)}
                <div className={`grid grid-cols-3 gap-3 mt-4`}>
                  <div className={`p-3 rounded-xl text-center ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                    <p className={`text-[10px] ${t.text.muted}`}>{i.vqTotalCost}</p>
                    <p className="text-[16px] text-indigo-400" style={{ fontWeight: 700 }}>245.5</p>
                  </div>
                  <div className={`p-3 rounded-xl text-center ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                    <p className={`text-[10px] ${t.text.muted}`}>{i.vqEstRows}</p>
                    <p className="text-[16px] text-cyan-400" style={{ fontWeight: 700 }}>150</p>
                  </div>
                  <div className={`p-3 rounded-xl text-center ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                    <p className={`text-[10px] ${t.text.muted}`}>{i.vqEstTime}</p>
                    <p className="text-[16px] text-emerald-400" style={{ fontWeight: 700 }}>2.4ms</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div data-testid="query-results" className="flex-1 overflow-auto p-4">
                {showResults ? (
                  <div>
                    <div className={`flex items-center justify-between mb-3`}>
                      <span className="text-[11px]" style={{ fontWeight: 500 }}>
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                        {i.vqResultsCount}: 5 {i.vqRows} • 2.4ms
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className={`w-full text-[11px] ${t.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <thead>
                          <tr className={`border-b ${t.border.subtle}`}>
                            {['id', 'name', 'email', 'role', 'created_at'].map(col => (
                              <th key={col} className={`px-3 py-2 text-left text-[10px] uppercase ${t.text.muted}`} style={{ fontWeight: 600 }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            [1, 'Alice Chen', 'alice@yyc3.dev', 'admin', '2026-01-15'],
                            [2, 'Bob Wang', 'bob@yyc3.dev', 'editor', '2026-02-01'],
                            [3, 'Carol Li', 'carol@yyc3.dev', 'viewer', '2026-02-14'],
                            [4, 'Dave Zhang', 'dave@yyc3.dev', 'editor', '2026-03-01'],
                            [5, 'Eve Liu', 'eve@yyc3.dev', 'admin', '2026-03-10'],
                          ].map((row, idx) => (
                            <tr key={idx} className={`border-b ${t.border.subtle} ${t.isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                              {row.map((cell, cidx) => (
                                <td key={cidx} className="px-3 py-2">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={`text-center py-12 ${t.text.muted}`}>
                    <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-[12px]">{i.vqRunFirst}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer: live SQL preview */}
          <div className={`px-6 py-2 border-t ${t.border.subtle} flex-shrink-0`}>
            <div className={`text-[10px] font-mono truncate ${t.text.dimmed}`}>
              {sql.replace(/\n/g, ' ').substring(0, 120)}{sql.length > 120 ? '...' : ''}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}