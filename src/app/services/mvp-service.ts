/**
 * @file mvp-service.ts
 * @description YYC³ MVP (Minimum Viable Product) - AI 代码生成核心服务
 * MVP Core Service - AI-Powered Code Generation Workflow
 *
 * 2026 AI Trends:
 * - Multi-modal AI (text + image input)
 * - Streaming responses
 * - Code explanation
 * - One-click deploy
 * - Real-time collaboration
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status mvp
 * @tags mvp,ai,code-generation,core
 */

import type { AIChatMessage } from '../types';

import { aiProviderService } from './ai-provider';
import { buildSystemPromptWithRules } from './settings-integration';

// ═════════════════════════════════════════════════════
// MVP Types
// ═════════════════════════════════════════════════════

export interface MVPGenerationRequest {
  /** User's natural language description */
  description: string;
  /** Optional: Reference image URL or base64 */
  imageUrl?: string;
  /** Optional: Code style preference */
  style?: 'react' | 'vue' | 'svelte' | 'angular';
  /** Optional: UI framework */
  framework?: 'tailwind' | 'mui' | 'antd' | 'chakra';
  /** Optional: Additional context */
  context?: string;
}

export interface MVPGenerationResponse {
  /** Generated code */
  code: string;
  /** Code explanation */
  explanation: string;
  /** Suggested filename */
  filename: string;
  /** Dependencies needed */
  dependencies: string[];
  /** Preview URL (if applicable) */
  previewUrl?: string;
  /** Generation metadata */
  metadata: {
    model: string;
    duration: number;
    tokens: number;
    streaming: boolean;
  };
}

export interface MVPStreamChunk {
  type: 'code' | 'explanation' | 'error' | 'complete';
  content: string;
  timestamp: number;
}

// ═════════════════════════════════════════════════════
// MVP Service
// ═════════════════════════════════════════════════════

class MVPService {
  private readonly SYSTEM_PROMPT =
    buildSystemPromptWithRules(`You are YYC³ AI, an expert UI component generator.
Your task is to convert natural language descriptions into production-ready React components.

## Guidelines:
1. Generate clean, modern React code with TypeScript
2. Use Tailwind CSS for styling by default
3. Include proper prop types and interfaces
4. Add comments for complex logic
5. Follow React best practices (hooks, functional components)
6. Make components responsive and accessible
7. Include example usage in comments

## Output Format:
Return a JSON object with:
{
  "code": "The generated React component code",
  "explanation": "Brief explanation of the component",
  "filename": "Suggested filename (PascalCase.tsx)",
  "dependencies": ["list", "of", "required", "packages"]
}`);

  /**
   * Generate code from natural language description
   */
  async generate(request: MVPGenerationRequest): Promise<MVPGenerationResponse> {
    const startTime = Date.now();

    // Build prompt
    const userMessage = this.buildPrompt(request);

    // Get active AI model
    const provider = aiProviderService.getActiveProvider();
    if (!provider) {
      throw new Error('No AI provider configured. Please configure an AI model first.');
    }

    const messages: AIChatMessage[] = [
      { role: 'system', content: this.SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ];

    try {
      // Call AI service
      const response = await aiProviderService.chat(messages, {
        temperature: 0.7,
        maxTokens: 4000,
      });

      // Parse AI response
      const result = this.parseResponse(response.choices[0].message.content);

      // Enhance with metadata
      return {
        ...result,
        metadata: {
          model: response.model,
          duration: Date.now() - startTime,
          tokens: response.usage.totalTokens,
          streaming: false,
        },
      };
    } catch (error) {
      throw new Error(
        `Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate code with streaming response
   */
  async *generateStream(request: MVPGenerationRequest): AsyncGenerator<MVPStreamChunk> {
    const startTime = Date.now();

    // Build prompt
    const userMessage = this.buildPrompt(request);

    // Get active AI model
    const provider = aiProviderService.getActiveProvider();
    if (!provider) {
      yield {
        type: 'error',
        content: 'No AI provider configured. Please configure an AI model first.',
        timestamp: Date.now(),
      };
      return;
    }

    const messages: AIChatMessage[] = [
      { role: 'system', content: this.SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ];

    try {
      // Stream AI response
      let accumulatedCode = '';
      let accumulatedExplanation = '';
      let inCodeBlock = false;

      for await (const chunk of this.streamChat(messages)) {
        // Parse streaming chunks
        if (chunk.includes('```')) {
          inCodeBlock = !inCodeBlock;
          continue;
        }

        if (inCodeBlock) {
          accumulatedCode += chunk;
          yield {
            type: 'code',
            content: chunk,
            timestamp: Date.now(),
          };
        } else {
          accumulatedExplanation += chunk;
          yield {
            type: 'explanation',
            content: chunk,
            timestamp: Date.now(),
          };
        }
      }

      // Complete
      yield {
        type: 'complete',
        content: JSON.stringify({
          code: accumulatedCode,
          explanation: accumulatedExplanation,
          duration: Date.now() - startTime,
        }),
        timestamp: Date.now(),
      };
    } catch (error) {
      yield {
        type: 'error',
        content: error instanceof Error ? error.message : 'Streaming failed',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Build prompt from request
   */
  private buildPrompt(request: MVPGenerationRequest): string {
    let prompt = `Create a React component based on this description:\n\n${request.description}`;

    if (request.style) {
      prompt += `\n\nStyle preference: ${request.style}`;
    }

    if (request.framework) {
      prompt += `\n\nUI Framework: ${request.framework}`;
    }

    if (request.context) {
      prompt += `\n\nAdditional context: ${request.context}`;
    }

    if (request.imageUrl) {
      prompt += `\n\nReference image: ${request.imageUrl}`;
    }

    return prompt;
  }

  /**
   * Parse AI response into structured format
   */
  private parseResponse(content: string): Omit<MVPGenerationResponse, 'metadata'> {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        code: parsed.code || '',
        explanation: parsed.explanation || '',
        filename: parsed.filename || 'GeneratedComponent.tsx',
        dependencies: parsed.dependencies || [],
        previewUrl: parsed.previewUrl,
      };
    } catch {
      // Fallback: extract code from markdown
      const codeMatch = content.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : content;

      return {
        code,
        explanation: 'Component generated from natural language description.',
        filename: 'GeneratedComponent.tsx',
        dependencies: ['react', 'react-dom'],
      };
    }
  }

  /**
   * Stream chat response (simulated for MVP)
   */
  private async *streamChat(messages: AIChatMessage[]): AsyncGenerator<string> {
    // In production, this would use the actual streaming API
    // For MVP, simulate streaming
    const response = await aiProviderService.chat(messages, {
      temperature: 0.7,
      maxTokens: 4000,
    });

    const content = response.choices[0].message.content;
    const words = content.split(' ');

    // Stream word by word
    for (const word of words) {
      yield word + ' ';
      await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 30));
    }
  }

  /**
   * Refactor existing code
   */
  async refactor(code: string, instructions: string): Promise<string> {
    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an expert code refactoring assistant. Improve code based on user instructions while maintaining functionality.',
      },
      {
        role: 'user',
        content: `Refactor this code:\n\n${code}\n\nInstructions: ${instructions}`,
      },
    ];

    const response = await aiProviderService.chat(messages);
    return response.choices[0].message.content;
  }

  /**
   * Explain code
   */
  async explain(
    code: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<string> {
    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content: `You are a code explanation assistant. Explain code at ${level} level.`,
      },
      {
        role: 'user',
        content: `Explain this code:\n\n${code}`,
      },
    ];

    const response = await aiProviderService.chat(messages);
    return response.choices[0].message.content;
  }

  /**
   * Generate unit tests
   */
  async generateTests(
    code: string,
    framework: 'vitest' | 'jest' | 'testing-library' = 'vitest'
  ): Promise<string> {
    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content: `You are a test generation expert. Write comprehensive unit tests using ${framework}.`,
      },
      {
        role: 'user',
        content: `Generate tests for this code:\n\n${code}`,
      },
    ];

    const response = await aiProviderService.chat(messages);
    return response.choices[0].message.content;
  }
}

// ═════════════════════════════════════════════════════
// Singleton Instance
// ═════════════════════════════════════════════════════

export const mvpService = new MVPService();
export default mvpService;
