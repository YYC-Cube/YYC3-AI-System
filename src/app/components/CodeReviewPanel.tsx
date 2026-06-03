/**
 * @file CodeReviewPanel.tsx
 * @description YYC³便携式智能AI系统 - Monaco编辑器内联代码审查/注释系统
 * Monaco Editor Inline Code Review / Annotation System
 * Side panel showing threaded code review comments attached to specific lines.
 * Comments can be resolved/reopened, replied to, and deleted.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,code-review,monaco,annotation
 */

import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { codeReviewer, type CodeIssue } from '../services/ai-code-gen';
import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

/* ── Types ── */
interface ReviewReply {
  id: string;
  author: string;
  color: string;
  text: string;
  timestamp: number;
}

interface ReviewComment {
  id: string;
  file: string;
  line: number;
  author: string;
  color: string;
  text: string;
  timestamp: number;
  resolved: boolean;
  replies: ReviewReply[];
}

/* ── Mock review data ── */
const MOCK_COMMENTS: ReviewComment[] = [
  {
    id: 'rc1',
    file: 'ChatInterface.tsx',
    line: 33,
    author: 'Alice',
    color: '#6366f1',
    text: 'This scrollRef is declared but never used in the JSX return. Should we remove it or is it needed for a future auto-scroll feature?',
    timestamp: Date.now() - 3600000,
    resolved: false,
    replies: [
      {
        id: 'rr1',
        author: 'Bob',
        color: '#f59e0b',
        text: "It's used in the useEffect on line 64. The warning is a false positive from the scope check.",
        timestamp: Date.now() - 3000000,
      },
      {
        id: 'rr2',
        author: 'Alice',
        color: '#6366f1',
        text: 'Ah I see, the effect accesses it via `.current`. Makes sense, thanks!',
        timestamp: Date.now() - 2400000,
      },
    ],
  },
  {
    id: 'rc2',
    file: 'ChatInterface.tsx',
    line: 88,
    author: 'Carol',
    color: '#10b981',
    text: 'This switch statement could be simplified with a command map pattern. Would make it easier to add new slash commands later.',
    timestamp: Date.now() - 7200000,
    resolved: false,
    replies: [],
  },
  {
    id: 'rc3',
    file: 'store.ts',
    line: 35,
    author: 'Dave',
    color: '#ec4899',
    text: 'Critical: `initialDesignRoot` is undefined here. This will cause a runtime error. Need to define or import it.',
    timestamp: Date.now() - 86400000,
    resolved: true,
    replies: [
      {
        id: 'rr3',
        author: 'You',
        color: '#818cf8',
        text: 'Fixed in commit a1b2c3d - moved initialDesignRoot to a constants file.',
        timestamp: Date.now() - 82800000,
      },
    ],
  },
  {
    id: 'rc4',
    file: 'ChatInterface.tsx',
    line: 102,
    author: 'Bob',
    color: '#f59e0b',
    text: "The async function simulateAIResponse doesn't have error handling. Should wrap in try-catch for production.",
    timestamp: Date.now() - 1800000,
    resolved: false,
    replies: [],
  },
];

/* ══════════════════════════════════════════ */
/*  CodeReviewPanel Component                 */
/* ══════════════════════════════════════════ */

export function CodeReviewPanel() {
  const { theme, language, selectedFile, setSelectedFile, aiModels, activeModelId } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const currentFile = selectedFile || 'ChatInterface.tsx';
  const [comments, setComments] = useState<ReviewComment[]>(MOCK_COMMENTS);
  const [showResolved, setShowResolved] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  // Get active model info
  const activeModel = aiModels.find((m) => m.id === activeModelId);

  // Jump to line in code editor
  const handleJumpToLine = useCallback(
    (file: string, line: number) => {
      console.log('[CodeReviewPanel] Jumping to line:', { file, line });

      // Set the file if different
      if (selectedFile !== file) {
        setSelectedFile(file);
      }

      // Highlight the line temporarily
      setHighlightedLine(line);
      toast.info(`${i.crJumpedToLine} ${line}`);

      // Clear highlight after 2 seconds
      setTimeout(() => setHighlightedLine(null), 2000);
    },
    [selectedFile, setSelectedFile, i]
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [addingComment, setAddingComment] = useState(false);
  const [newCommentLine, setNewCommentLine] = useState(1);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [_aiScore, setAiScore] = useState<number | null>(null);

  const fileComments = useMemo(
    () =>
      comments
        .filter((c) => c.file === currentFile && (showResolved || !c.resolved))
        .sort((a, b) => a.line - b.line),
    [comments, currentFile, showResolved]
  );

  const counts = useMemo(
    () => ({
      open: comments.filter((c) => c.file === currentFile && !c.resolved).length,
      resolved: comments.filter((c) => c.file === currentFile && c.resolved).length,
    }),
    [comments, currentFile]
  );

  const toggleResolve = useCallback(
    (id: string) => {
      setComments((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)));
      toast.success(i.crResolve);
    },
    [i]
  );

  const deleteComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addReply = useCallback(
    (commentId: string) => {
      const text = replyTexts[commentId]?.trim();
      if (!text) return;
      const reply: ReviewReply = {
        id: `rr-${Date.now()}`,
        author: 'You',
        color: '#818cf8',
        text,
        timestamp: Date.now(),
      };
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c))
      );
      setReplyTexts((prev) => ({ ...prev, [commentId]: '' }));
    },
    [replyTexts]
  );

  const addNewComment = useCallback(() => {
    if (!newCommentText.trim()) return;
    const comment: ReviewComment = {
      id: `rc-${Date.now()}`,
      file: currentFile,
      line: newCommentLine,
      author: 'You',
      color: '#818cf8',
      text: newCommentText.trim(),
      timestamp: Date.now(),
      resolved: false,
      replies: [],
    };
    setComments((prev) => [...prev, comment]);
    setNewCommentText('');
    setAddingComment(false);
    setExpandedId(comment.id);
    toast.success(i.crAddComment);
  }, [newCommentText, newCommentLine, currentFile, i]);

  const handleAiReview = useCallback(async () => {
    // Check if AI model is configured
    if (!activeModel) {
      toast.error('请先配置 AI 模型 - 前往设置 > 模型管理');
      return;
    }

    setAiReviewing(true);
    try {
      console.log('[CodeReviewPanel] Starting AI review with model:', activeModel.name);

      const sampleCode = `import React, { useState, useRef } from 'react'
var activeModel = 'YYC3-Pro'
export function ${currentFile.replace('.tsx', '').replace('.ts', '')}() {
  const [data, setData] = useState<any>(null)
  const handleClick = () => {
    console.log('clicked')
    // TODO: implement click handler
    if (data == null) {
      fetch('/api/data').then(r => r.json()).then(d => setData(d))
    }
  }
  return <div>{/* component content for ${currentFile} - a long line that exceeds one hundred and twenty characters in width for testing purposes */}</div>
}`;
      const result = await codeReviewer.reviewCode(sampleCode, 'typescript');
      setAiScore(result.score);

      // Convert AI review issues into ReviewComments
      const aiComments: ReviewComment[] = result.issues.map((issue: CodeIssue, idx: number) => ({
        id: `ai-${Date.now()}-${idx}`,
        file: currentFile,
        line: issue.line,
        author: 'YYC³ AI',
        color: '#8b5cf6',
        text: `[${issue.severity.toUpperCase()}] ${issue.message} (rule: ${issue.rule})`,
        timestamp: Date.now(),
        resolved: false,
        replies: [],
      }));

      // Add suggestion comments
      result.suggestions.forEach((suggestion: string, idx: number) => {
        aiComments.push({
          id: `ai-sug-${Date.now()}-${idx}`,
          file: currentFile,
          line: 1,
          author: 'YYC³ AI',
          color: '#8b5cf6',
          text: `💡 ${i.acgSuggestions}: ${suggestion}`,
          timestamp: Date.now(),
          resolved: false,
          replies: [],
        });
      });

      if (aiComments.length > 0) {
        setComments((prev) => [...prev, ...aiComments]);
        toast.success(
          `${i.acgReviewComplete} — ${i.acgScore}: ${result.score}/100 · ${result.issues.length} ${i.acgIssues}`
        );
      } else {
        toast.success(`${i.acgReviewComplete} — ${i.acgNoIssues}`);
      }
    } catch {
      toast.error('AI review failed');
    }
    setAiReviewing(false);
  }, [currentFile, i]);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${t.surface.glass}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border.subtle}`}>
        <div className="flex items-center gap-2">
          <MessageSquare
            className={`w-3.5 h-3.5 ${t.isDark ? 'text-amber-400' : 'text-amber-500'}`}
          />
          <span className={`text-[11px] ${t.text.secondary}`} style={{ fontWeight: 600 }}>
            {i.crTitle}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}
            >
              {counts.open} {i.crOpen}
            </span>
            {counts.resolved > 0 && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}
              >
                {counts.resolved} {i.crResolved}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAddingComment(!addingComment)}
            className={`p-1 rounded ${t.transition} ${addingComment ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}
            title={i.crAddComment}
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`p-1 rounded ${t.transition} ${showResolved ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}
            title={showResolved ? i.crHideResolved : i.crShowResolved}
          >
            {showResolved ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          <div className="flex items-center gap-1 ml-2 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            {activeModel ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="AI Model Active" />
                <span className="text-[8px] text-white/40 truncate max-w-[80px]">
                  {activeModel.name}
                </span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="No AI Model" />
                <span className="text-[8px] text-amber-400/60">No Model</span>
              </>
            )}
          </div>
          <button
            onClick={handleAiReview}
            disabled={!activeModel}
            className={`p-1 rounded ${t.transition} ${aiReviewing ? t.accent.activeText : ''} ${t.interactive.iconBtn} ${!activeModel ? 'opacity-30 cursor-not-allowed' : ''}`}
            title={activeModel ? i.acgReview : '请先配置 AI 模型'}
          >
            {aiReviewing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Add new comment form */}
      <AnimatePresence>
        {addingComment && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className={`px-3 py-2 border-b ${t.border.subtle} space-y-1.5`}>
              <div className="flex items-center gap-2">
                <label className={`text-[8px] ${t.text.dimmed}`}>{i.edLine}:</label>
                <input
                  type="number"
                  min="1"
                  value={newCommentLine}
                  onChange={(e) => setNewCommentLine(Number(e.target.value))}
                  className={`w-16 px-2 py-0.5 rounded text-[10px] outline-none ${t.isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-800'} border ${t.border.subtle}`}
                />
              </div>
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={i.crPlaceholder}
                rows={2}
                className={`w-full px-2 py-1.5 rounded-lg text-[10px] outline-none resize-none ${t.isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-800'} border ${t.border.subtle}`}
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setAddingComment(false)}
                  className={`px-2 py-0.5 rounded text-[9px] ${t.transition} ${t.interactive.iconBtn}`}
                >
                  {i.arDismiss}
                </button>
                <button
                  onClick={addNewComment}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] ${t.transition} ${t.accent.solidBtn}`}
                  style={{ fontWeight: 600 }}
                >
                  <Send className="w-2.5 h-2.5" /> {i.crAddComment}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments list */}
      <div className={`flex-1 overflow-y-auto ${t.scrollbar} p-2 space-y-1.5`}>
        {fileComments.length === 0 && (
          <div className={`flex flex-col items-center justify-center gap-2 py-8 ${t.text.dimmed}`}>
            <MessageSquare className="w-6 h-6 opacity-20" />
            <span className="text-[11px]">{i.crNoComments}</span>
          </div>
        )}

        {fileComments.map((comment) => {
          const isExpanded = expandedId === comment.id;
          return (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: comment.resolved ? 0.5 : 1, y: 0 }}
              className={`rounded-xl overflow-hidden border ${t.isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white/60 border-slate-200/60'}`}
            >
              {/* Comment header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : comment.id)}
                className={`w-full flex items-start gap-2 px-3 py-2 text-left ${t.transition} ${t.interactive.menuItem}`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 mt-0.5 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                )}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white flex-shrink-0"
                  style={{ backgroundColor: comment.color, fontWeight: 700 }}
                >
                  {comment.author[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] ${t.text.primary}`} style={{ fontWeight: 600 }}>
                      {comment.author}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJumpToLine(comment.file, comment.line);
                      }}
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] ${highlightedLine === comment.line
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : t.isDark
                          ? 'bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.08]'
                          : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                        } transition-all`}
                      title={i.crJumpToLine}
                    >
                      L{comment.line}
                      <ArrowRight className="w-2 h-2" />
                    </button>
                    <span className={`text-[8px] ${t.text.dimmed}`}>
                      {formatTime(comment.timestamp)}
                    </span>
                    {comment.resolved && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                  </div>
                  <p className={`text-[9px] mt-0.5 line-clamp-2 ${t.text.muted}`}>{comment.text}</p>
                  {comment.replies.length > 0 && (
                    <span className={`text-[8px] ${t.text.dimmed}`}>
                      {comment.replies.length} {i.crReply}
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className={`px-3 pb-3 space-y-2 ml-8`}>
                  {/* Full comment text */}
                  <div
                    className={`p-2 rounded-lg text-[9px] ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'} ${t.text.primary}`}
                  >
                    {comment.text}
                  </div>

                  {/* Replies */}
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: reply.color, fontWeight: 700 }}
                      >
                        {reply.author[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[8px] ${t.text.primary}`}
                            style={{ fontWeight: 600 }}
                          >
                            {reply.author}
                          </span>
                          <span className={`text-[7px] ${t.text.dimmed}`}>
                            {formatTime(reply.timestamp)}
                          </span>
                        </div>
                        <p className={`text-[8px] mt-0.5 ${t.text.muted}`}>{reply.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* Reply input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      value={replyTexts[comment.id] || ''}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addReply(comment.id);
                        }
                      }}
                      placeholder={i.crPlaceholder}
                      className={`flex-1 px-2 py-1 rounded text-[9px] outline-none ${t.isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-800'} border ${t.border.subtle}`}
                    />
                    <button
                      onClick={() => addReply(comment.id)}
                      className={`p-1 rounded ${t.transition} ${t.accent.solidBtn}`}
                    >
                      <Send className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleResolve(comment.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] ${t.transition} ${comment.resolved
                        ? `${t.isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`
                        : `${t.isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`
                        }`}
                      style={{ fontWeight: 600 }}
                    >
                      {comment.resolved ? (
                        <>
                          <RotateCcw className="w-2.5 h-2.5" /> {i.crReopen}
                        </>
                      ) : (
                        <>
                          <Check className="w-2.5 h-2.5" /> {i.crResolve}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] ${t.transition} ${t.interactive.iconBtn} text-red-400`}
                    >
                      <Trash2 className="w-2.5 h-2.5" /> {i.crDelete}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
