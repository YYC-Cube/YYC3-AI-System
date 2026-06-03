/**
 * @file MCPPanel.tsx
 * @description YYC³便携式智能 AI 系统 - MCP 服务器配置面板
 * MCP Server Configuration Panel
 * Allows users to add, edit, remove, and test MCP server connections.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,mcp,settings,ui
 */

import {
  Plug,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Terminal,
  Zap,
  Eye,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { mcpService, type MCPServer } from '../services/mcp-service';
import { useSettingsStore } from '../settingsStore';
import { useAppStore } from '../store';
import { getThemeTokens } from '../utils/theme';

interface MCPPanelProps {
  onClose?: () => void;
}

export function MCPPanel({ onClose }: MCPPanelProps) {
  const theme = useAppStore((s) => s.theme);
  const t = getThemeTokens(theme);

  const { mcpServers, addMcp, updateMcp, removeMcp } = useSettingsStore();

  const [servers, setServers] = useState<MCPServer[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    endpoint: '',
    type: 'stdio' as 'stdio' | 'sse' | 'streamable-http',
    enabled: true,
    isProject: false,
  });

  // Load MCP servers on mount
  useEffect(() => {
    const initMCP = async () => {
      const enabledServers = mcpServers.filter((s) => s.enabled);
      await mcpService.initialize(enabledServers);
      updateServers();
    };

    initMCP();

    return () => {
      mcpService.cleanup();
    };
  }, []);

  // Update servers list
  const updateServers = useCallback(() => {
    const allServers = mcpService.getAllServers();
    setServers(allServers);
  }, []);

  // Start editing
  const handleEdit = useCallback((server: (typeof mcpServers)[0]) => {
    setEditingId(server.id);
    setFormData({
      name: server.name,
      endpoint: server.endpoint,
      type: server.type,
      enabled: server.enabled,
      isProject: server.isProject,
    });
  }, []);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setEditingId(null);
    setFormData({
      name: '',
      endpoint: '',
      type: 'stdio',
      enabled: true,
      isProject: false,
    });
  }, []);

  // Save server
  const handleSave = useCallback(() => {
    if (!formData.name || !formData.endpoint) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateMcp(editingId, formData);
      toast.success('Server updated');
    } else {
      addMcp(formData);
      toast.success('Server added');
    }

    handleCancel();
  }, [formData, editingId, addMcp, updateMcp, handleCancel]);

  // Delete server
  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this MCP server?')) {
        removeMcp(id);
        mcpService.disconnectServer(id);
        updateServers();
        toast.success('Server deleted');
      }
    },
    [removeMcp, updateServers]
  );

  // Test connection
  const handleTest = useCallback(async (server: (typeof mcpServers)[0]) => {
    setTestingId(server.id);

    try {
      const result = await testMCPConnection(server.endpoint, server.type);

      if (result.ok) {
        toast.success(`Connection successful (${result.latency}ms)`);
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (_error) {
      toast.error('Connection failed');
    } finally {
      setTestingId(null);
    }
  }, []);

  // Toggle server enabled
  const handleToggle = useCallback(
    (id: string, enabled: boolean) => {
      updateMcp(id, { enabled });

      const server = mcpServers.find((s) => s.id === id);
      if (server) {
        if (enabled) {
          mcpService.connectServer(server);
        } else {
          mcpService.disconnectServer(id);
        }
        updateServers();
      }
    },
    [mcpServers, updateMcp, updateServers]
  );

  // Expand server details
  const handleExpand = useCallback(
    (id: string) => {
      setExpandedServer(expandedServer === id ? null : id);
      updateServers();
    },
    [expandedServer, updateServers]
  );

  return (
    <div className={`h-full flex flex-col ${t.surface.app}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border.subtle}`}>
        <div className="flex items-center gap-2">
          <Plug className={`w-4 h-4 ${t.accent.primary}`} />
          <span className={`text-[13px] ${t.text.primary}`} style={{ fontWeight: 600 }}>
            MCP Servers
          </span>
          <span className={`text-[10px] ${t.text.muted}`}>
            {servers.filter((s) => s.status === 'connected').length} / {mcpServers.length} connected
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={updateServers}
            className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {mcpServers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className={`w-16 h-16 rounded-2xl ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'} flex items-center justify-center mb-3`}
            >
              <Plug className={`w-7 h-7 ${t.text.dimmed}`} />
            </div>
            <p className={`text-[12px] ${t.text.muted} mb-1`}>No MCP servers configured</p>
            <p className={`text-[10px] ${t.text.dimmed}`}>Add a server to get started</p>
          </div>
        ) : (
          mcpServers.map((server) => {
            const mcpServer = servers.find((s) => s.config.id === server.id);
            const status = mcpServer?.status || 'disconnected';
            const tools = mcpServer?.tools || [];

            return (
              <div
                key={server.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  editingId === server.id
                    ? t.isDark
                      ? 'border-indigo-500/30 bg-indigo-500/[0.05]'
                      : 'border-indigo-500/30 bg-indigo-50'
                    : t.isDark
                      ? 'border-white/[0.06] bg-white/[0.02]'
                      : 'border-slate-200 bg-slate-50'
                }`}
              >
                {/* Server Header */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  {editingId === server.id ? (
                    // Edit Mode
                    <>
                      <div
                        className={`w-8 h-8 rounded-lg ${t.isDark ? 'bg-white/[0.06]' : 'bg-slate-200'} flex items-center justify-center`}
                      >
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <input
                          value={formData.name}
                          onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Server Name"
                          className={`w-full bg-transparent text-[12px] ${t.text.primary} placeholder:${t.text.dimmed} focus:outline-none`}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            value={formData.endpoint}
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, endpoint: e.target.value }))
                            }
                            placeholder="Endpoint"
                            className={`flex-1 bg-transparent text-[11px] ${t.text.secondary} font-mono placeholder:${t.text.dimmed} focus:outline-none`}
                          />
                          <select
                            value={formData.type}
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, type: e.target.value as any }))
                            }
                            className={`text-[11px] ${t.text.secondary} bg-transparent focus:outline-none`}
                          >
                            <option value="stdio">Stdio</option>
                            <option value="sse">SSE</option>
                            <option value="streamable-http">HTTP</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleSave}
                          className={`p-1.5 rounded-lg ${t.transition} bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          status === 'connected'
                            ? 'bg-emerald-500/10'
                            : status === 'error'
                              ? 'bg-red-500/10'
                              : status === 'connecting'
                                ? 'bg-amber-500/10'
                                : 'bg-slate-500/10'
                        }`}
                      >
                        {status === 'connected' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : status === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : status === 'connecting' ? (
                          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[12px] ${t.text.primary} truncate`}
                            style={{ fontWeight: 500 }}
                          >
                            {server.name}
                          </span>
                          {server.isProject && (
                            <span
                              className={`text-[8px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}
                            >
                              Project
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] ${t.text.dimmed} font-mono truncate`}>
                          {server.endpoint}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(server.id, !server.enabled)}
                          className={`p-1.5 rounded-lg ${t.transition} ${
                            server.enabled ? t.accent.activeBg : t.interactive.iconBtn
                          }`}
                          title={server.enabled ? 'Disable' : 'Enable'}
                        >
                          {server.enabled ? (
                            <Wifi className="w-3.5 h-3.5" />
                          ) : (
                            <WifiOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleTest(server)}
                          disabled={testingId === server.id}
                          className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
                          title="Test Connection"
                        >
                          {testingId === server.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleExpand(server.id)}
                          className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
                          title={expandedServer === server.id ? 'Collapse' : 'Expand'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(server)}
                          className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(server.id)}
                          className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedServer === server.id && mcpServer && (
                  <div
                    className={`px-3 pb-3 pt-0 border-t ${t.isDark ? 'border-white/[0.04]' : 'border-slate-200'}`}
                  >
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div
                        className={`p-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}
                      >
                        <div className={`text-[9px] ${t.text.dimmed} mb-1`}>Status</div>
                        <div
                          className={`text-[11px] ${
                            mcpServer.status === 'connected'
                              ? 'text-emerald-400'
                              : mcpServer.status === 'error'
                                ? 'text-red-400'
                                : 'text-slate-400'
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {mcpServer.status}
                        </div>
                      </div>
                      <div
                        className={`p-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}
                      >
                        <div className={`text-[9px] ${t.text.dimmed} mb-1`}>Tools</div>
                        <div
                          className={`text-[11px] ${t.text.primary}`}
                          style={{ fontWeight: 600 }}
                        >
                          {tools.length}
                        </div>
                      </div>
                      <div
                        className={`p-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}
                      >
                        <div className={`text-[9px] ${t.text.dimmed} mb-1`}>Resources</div>
                        <div
                          className={`text-[11px] ${t.text.primary}`}
                          style={{ fontWeight: 600 }}
                        >
                          {mcpServer.resources.length}
                        </div>
                      </div>
                    </div>

                    {/* Tools List */}
                    {tools.length > 0 && (
                      <div className="mt-3">
                        <div className={`text-[10px] ${t.text.dimmed} mb-2`}>Available Tools</div>
                        <div className="space-y-1">
                          {tools.slice(0, 5).map((tool) => (
                            <div
                              key={tool.name}
                              className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}
                            >
                              <div>
                                <div
                                  className={`text-[10px] ${t.text.primary}`}
                                  style={{ fontWeight: 500 }}
                                >
                                  {tool.name}
                                </div>
                                <div className={`text-[9px] ${t.text.dimmed}`}>
                                  {tool.description}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Server Button */}
      {!editingId && (
        <div className={`p-4 border-t ${t.border.subtle}`}>
          <button
            onClick={() =>
              handleEdit({
                id: '',
                name: '',
                endpoint: '',
                type: 'stdio',
                enabled: true,
                isProject: false,
              })
            }
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${t.accent.solidBtn} transition-all`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-[12px]" style={{ fontWeight: 500 }}>
              Add MCP Server
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// Mock test function (replace with actual implementation)
async function testMCPConnection(
  endpoint: string,
  type: string
): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();

  try {
    if (type === 'stdio') {
      // Simulate stdio test
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
      return { ok: true, latency: Date.now() - start };
    } else {
      // Test HTTP/SSE endpoint
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return { ok: true, latency: Date.now() - start };
    }
  } catch (error) {
    return {
      ok: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export default MCPPanel;
