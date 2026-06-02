/**
 * @file MVPGenerator.tsx
 * @description YYC³ MVP - AI 代码生成器主界面
 * MVP Code Generator - Main UI Component
 *
 * Features:
 * - Natural language to code
 * - Real-time streaming preview
 * - Code explanation
 * - One-click copy & deploy
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status mvp
 * @tags mvp,ai,code-generation,ui
 */

import {
  Sparkles,
  Code,
  Play,
  Copy,
  Check,
  Loader2,
  Image,
  FileText,
  Zap,
  Download,
  Eye,
  ChevronRight,
  RotateCcw,
  Monitor,
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

import {
  mvpService,
  type MVPGenerationRequest,
  type MVPStreamChunk,
} from '../services/mvp-service';
import { useAppStore } from '../store';
import { getThemeTokens } from '../utils/theme';

interface MVPGeneratorProps {
  onClose?: () => void;
}

export function MVPGenerator({ onClose }: MVPGeneratorProps) {
  const { theme } = useAppStore();
  const t = getThemeTokens(theme);

  // State
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [style, setStyle] = useState<'react' | 'vue' | 'svelte'>('react');
  const [framework, setFramework] = useState<'tailwind' | 'mui' | 'antd'>('tailwind');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [filename, setFilename] = useState('GeneratedComponent.tsx');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [streaming, setStreaming] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      toast.warning('Please describe what you want to create');
      inputRef.current?.focus();
      return;
    }

    setGenerating(true);
    setStreaming(true);
    setGeneratedCode('');
    setExplanation('');

    try {
      const request: MVPGenerationRequest = {
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
        style,
        framework,
      };

      // Use streaming generation
      let codeBuffer = '';
      let explanationBuffer = '';

      for await (const chunk of mvpService.generateStream(request)) {
        handleStreamChunk(chunk, (code, explanation) => {
          codeBuffer += code;
          explanationBuffer += explanation;
          setGeneratedCode(codeBuffer);
          setExplanation(explanationBuffer);
        });
      }

      // Extract filename from code
      const match = description.match(/(?:create|build|make)\s+(?:a|an)?\s*(\w+)/i);
      if (match) {
        setFilename(`${capitalize(match[1])}.tsx`);
      }

      toast.success('Component generated successfully!');
    } catch (error) {
      toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
      setStreaming(false);
    }
  }, [description, imageUrl, style, framework]);

  // Handle stream chunk
  const handleStreamChunk = (
    chunk: MVPStreamChunk,
    onUpdate: (code: string, explanation: string) => void
  ) => {
    if (chunk.type === 'code') {
      onUpdate(chunk.content, '');
    } else if (chunk.type === 'explanation') {
      onUpdate('', chunk.content);
    } else if (chunk.type === 'complete') {
      try {
        const data = JSON.parse(chunk.content);
        onUpdate(data.code, data.explanation);
      } catch {
        // Ignore parse errors
      }
    }
  };

  // Handle copy
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [generatedCode]);

  // Handle download
  const handleDownload = useCallback(() => {
    const blob = new Blob([generatedCode], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  }, [generatedCode, filename]);

  // Handle regenerate
  const handleRegenerate = useCallback(() => {
    setGeneratedCode('');
    setExplanation('');
    inputRef.current?.focus();
  }, []);

  // Handle quick template
  const handleQuickTemplate = useCallback((template: string) => {
    setDescription(template);
    inputRef.current?.focus();
  }, []);

  return (
    <div className={`h-full flex flex-col ${t.surface.app}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border.subtle}`}>
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg ${t.accent.primaryBg} flex items-center justify-center`}
          >
            <Sparkles className={`w-4 h-4 ${t.accent.primary}`} />
          </div>
          <div>
            <div className={`text-[13px] ${t.text.primary}`} style={{ fontWeight: 600 }}>
              AI Component Generator
            </div>
            <div className={`text-[10px] ${t.text.muted}`}>
              Describe your idea → Get production-ready code
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRegenerate}
            className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
            title="New Generation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Input Panel */}
        <div className={`w-[400px] flex flex-col border-r ${t.border.subtle}`}>
          {/* Description Input */}
          <div className="p-4 space-y-3">
            <label className={`text-[11px] ${t.text.secondary}`} style={{ fontWeight: 500 }}>
              What do you want to create?
            </label>
            <textarea
              ref={inputRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Create a login form with email and password fields, styled with Tailwind CSS"
              className={`w-full h-32 px-3 py-2 rounded-lg text-[12px] ${t.input.chat} focus:outline-none resize-none`}
              disabled={generating}
            />

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <div className={`text-[10px] ${t.text.muted}`}>Quick templates:</div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() =>
                    handleQuickTemplate(
                      'Create a responsive navigation bar with logo, menu items, and mobile hamburger menu'
                    )
                  }
                  className={`px-2 py-1 rounded text-[9px] ${t.isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-50 hover:bg-slate-100'} ${t.text.secondary} transition-all`}
                  disabled={generating}
                >
                  📱 Navbar
                </button>
                <button
                  onClick={() =>
                    handleQuickTemplate(
                      'Create a pricing card component with 3 tiers: Basic, Pro, and Enterprise'
                    )
                  }
                  className={`px-2 py-1 rounded text-[9px] ${t.isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-50 hover:bg-slate-100'} ${t.text.secondary} transition-all`}
                  disabled={generating}
                >
                  💰 Pricing
                </button>
                <button
                  onClick={() =>
                    handleQuickTemplate(
                      'Create a dashboard card showing user statistics with icons and charts'
                    )
                  }
                  className={`px-2 py-1 rounded text-[9px] ${t.isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-50 hover:bg-slate-100'} ${t.text.secondary} transition-all`}
                  disabled={generating}
                >
                  📊 Dashboard
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className={`text-[10px] ${t.text.muted} mb-1 block`}>Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as any)}
                  className={`w-full px-2 py-1.5 rounded-lg text-[11px] ${t.input.chat} focus:outline-none`}
                  disabled={generating}
                >
                  <option value="react">React</option>
                  <option value="vue">Vue</option>
                  <option value="svelte">Svelte</option>
                </select>
              </div>
              <div>
                <label className={`text-[10px] ${t.text.muted} mb-1 block`}>Framework</label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value as any)}
                  className={`w-full px-2 py-1.5 rounded-lg text-[11px] ${t.input.chat} focus:outline-none`}
                  disabled={generating}
                >
                  <option value="tailwind">Tailwind</option>
                  <option value="mui">Material UI</option>
                  <option value="antd">Ant Design</option>
                </select>
              </div>
            </div>

            {/* Image Upload (MVP placeholder) */}
            <div className="pt-2">
              <label className={`text-[10px] ${t.text.muted} mb-1 block`}>
                Reference Image (optional)
              </label>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'} border ${t.isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}
              >
                <Image className={`w-3.5 h-3.5 ${t.text.dimmed}`} />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL or drag & drop"
                  className={`flex-1 bg-transparent text-[11px] ${t.text.secondary} focus:outline-none placeholder:${t.text.dimmed}`}
                  disabled={generating}
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className={`p-4 border-t ${t.border.subtle}`}>
            <button
              onClick={handleGenerate}
              disabled={generating || !description.trim()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${
                generating || !description.trim()
                  ? t.isDark
                    ? 'bg-white/[0.05] text-white/30'
                    : 'bg-slate-100 text-slate-400'
                  : t.accent.solidBtn
              } transition-all`}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[12px]" style={{ fontWeight: 500 }}>
                    Generating...
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span className="text-[12px]" style={{ fontWeight: 500 }}>
                    Generate Component
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Code & Preview Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div
            className={`flex items-center justify-between px-4 py-2 border-b ${t.border.subtle}`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] ${
                  showPreview ? t.accent.activeBg : t.interactive.hoverBg
                } ${t.text.secondary} transition-all`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Preview
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] ${
                  !showPreview ? t.accent.activeBg : t.interactive.hoverBg
                } ${t.text.secondary} transition-all`}
              >
                <Code className="w-3.5 h-3.5" />
                Code
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!generatedCode}
                className={`p-1.5 rounded-lg ${t.transition} ${
                  copied ? 'bg-emerald-500/15 text-emerald-400' : t.interactive.iconBtn
                } disabled:opacity-30`}
                title="Copy Code"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleDownload}
                disabled={!generatedCode}
                className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn} disabled:opacity-30`}
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {generatedCode ? (
              showPreview ? (
                /* Preview Panel */
                <div
                  className={`h-full p-4 overflow-auto ${t.isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}
                >
                  <div className={`text-[12px] ${t.text.muted} mb-3`}>
                    Live Preview - {filename}
                  </div>
                  <div
                    className={`p-6 rounded-xl border ${t.isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}
                  >
                    {/* In production, this would render the actual component */}
                    <div className={`text-center py-12 ${t.text.muted}`}>
                      <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-[12px]">Preview rendering...</p>
                      <p className="text-[10px] mt-1">
                        In production, this would render the generated component
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Code Panel */
                <div className="h-full flex flex-col">
                  <div
                    className={`px-4 py-2 border-b ${t.border.subtle} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className={`w-3.5 h-3.5 ${t.text.dimmed}`} />
                      <span className={`text-[11px] ${t.text.secondary} font-mono`}>
                        {filename}
                      </span>
                    </div>
                    {streaming && (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                        <span className={`text-[10px] ${t.text.muted}`}>Streaming...</span>
                      </div>
                    )}
                  </div>
                  <pre
                    className={`flex-1 p-4 overflow-auto text-[11px] font-mono leading-relaxed ${t.isDark ? 'bg-[#0d1117] text-slate-300' : 'bg-slate-50 text-slate-800'}`}
                  >
                    <code>{generatedCode}</code>
                  </pre>
                </div>
              )
            ) : (
              /* Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div
                  className={`w-20 h-20 rounded-2xl ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'} flex items-center justify-center mb-4`}
                >
                  <Sparkles className={`w-10 h-10 ${t.text.dimmed}`} />
                </div>
                <p className={`text-[13px] ${t.text.primary} mb-1`} style={{ fontWeight: 600 }}>
                  Ready to Create
                </p>
                <p className={`text-[11px] ${t.text.muted} max-w-[300px]`}>
                  Describe your component idea and watch AI generate production-ready code in
                  seconds
                </p>
              </div>
            )}
          </div>

          {/* Explanation Panel */}
          {explanation && (
            <div className={`h-32 border-t ${t.border.subtle} p-4 overflow-auto`}>
              <div className={`text-[11px] ${t.text.secondary} mb-2`} style={{ fontWeight: 500 }}>
                <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                AI Explanation
              </div>
              <p className={`text-[11px] ${t.text.muted} leading-relaxed`}>{explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default MVPGenerator;
