/**
 * @file useMCP.ts
 * @description YYC³便携式智能 AI 系统 - MCP React Hook
 * React Hook for accessing MCP functionality in components
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hooks,mcp,react
 */

import { useState, useEffect, useCallback } from 'react'

import { mcpService, type MCPTool, type MCPToolCallResult } from '../services/mcp-service'
import { useSettingsStore } from '../settingsStore'

export function useMCP() {
  const { mcpServers } = useSettingsStore()
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)

  // Initialize MCP on mount
  useEffect(() => {
    const init = async () => {
      const enabledServers = mcpServers.filter(s => s.enabled)
      await mcpService.initialize(enabledServers)
      setLoading(false)
    }
    
    init()
    
    return () => {
      mcpService.cleanup()
    }
  }, [mcpServers])

  // Get all servers
  const getServers = useCallback(() => {
    return mcpService.getAllServers()
  }, [])

  // Get server by ID
  const getServer = useCallback((serverId: string) => {
    return mcpService.getServerStatus(serverId)
  }, [])

  // List tools from all servers
  const listTools = useCallback(async (): Promise<Array<{ serverId: string; tool: MCPTool }>> => {
    const servers = mcpService.getAllServers()
    const allTools: Array<{ serverId: string; tool: MCPTool }> = []
    
    for (const server of servers) {
      if (server.status === 'connected') {
        const tools = await mcpService.listTools(server.config.id)
        for (const tool of tools) {
          allTools.push({ serverId: server.config.id, tool })
        }
      }
    }
    
    return allTools
  }, [])

  // Call a tool
  const callTool = useCallback(async (
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolCallResult> => {
    setExecuting(toolName)
    
    try {
      const result = await mcpService.callTool(serverId, toolName, args)
      return result
    } finally {
      setExecuting(null)
    }
  }, [])

  // Execute tool with AI-generated arguments
  const executeWithAI = useCallback(async (
    serverId: string,
    toolName: string,
    naturalLanguageRequest: string
  ): Promise<MCPToolCallResult> => {
    // In production, this would:
    // 1. Get tool schema
    // 2. Ask AI to extract arguments from natural language
    // 3. Call the tool with extracted arguments
    
    // For demo, just call the tool directly
    return callTool(serverId, toolName, { request: naturalLanguageRequest })
  }, [callTool])

  // Refresh servers
  const refresh = useCallback(async () => {
    setLoading(true)
    const enabledServers = mcpServers.filter(s => s.enabled)
    await mcpService.initialize(enabledServers)
    setLoading(false)
  }, [mcpServers])

  return {
    // State
    loading,
    executing,
    
    // Server management
    getServers,
    getServer,
    refresh,
    
    // Tool execution
    listTools,
    callTool,
    executeWithAI,
  }
}

export default useMCP
