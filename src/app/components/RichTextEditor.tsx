/**
 * @file RichTextEditor.tsx
 * @description YYC³便携式智能AI系统 - TipTap富文本编辑器(支持Yjs协作)
 * TipTap Rich Text Editor with Yjs Collaboration
 * Toolbar with formatting controls, code block support, Liquid Glass styling.
 * Yjs CRDT binding via @tiptap/extension-collaboration + collaboration-cursor.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,editor,rich-text,collaboration,yjs
 */

import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  FileCode2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';

import { collabManager } from '../utils/collaboration';

// ── Collaboration Config ──

interface CollabConfig {
  enabled: boolean;
  /** Name of the shared Y.XmlFragment in the Y.Doc. Each document gets a unique one. */
  fragmentName: string;
  userName: string;
  userColor: string;
}

const DEFAULT_COLLAB: CollabConfig = {
  enabled: false,
  fragmentName: 'doc-editor',
  userName: 'You',
  userColor: '#6366f1',
};

// ── Props ──

interface RichTextEditorProps {
  content: string;
  onChange?: (html: string, text: string) => void;
  isDark: boolean;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  themeTokens?: unknown;
  /** Enable Yjs collaborative editing */
  collaboration?: Partial<CollabConfig>;
}

export function RichTextEditor({
  content,
  onChange,
  isDark,
  placeholder = 'Start writing...',
  editable = true,
  className = '',
  collaboration: collabProp,
}: RichTextEditorProps) {
  const collab = useMemo<CollabConfig>(() => ({ ...DEFAULT_COLLAB, ...collabProp }), [collabProp]);
  const [connectedUsers, setConnectedUsers] = useState<{ name: string; color: string }[]>([]);

  // Get or create the Y.XmlFragment for collaborative editing
  const ydoc = collab.enabled ? collabManager.doc : useMemo(() => new Y.Doc(), []);
  const fragment = useMemo(
    () => ydoc.getXmlFragment(collab.fragmentName),
    [ydoc, collab.fragmentName]
  );

  // Build extensions based on collaboration mode
  const extensions = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base: any[] = [
      Placeholder.configure({ placeholder }),
      Highlight.configure({ multicolor: true }),
      Typography,
    ];

    if (collab.enabled) {
      // Collaboration mode: use Yjs fragment, disable built-in history (Yjs handles undo/redo)
      base.push(
        StarterKit.configure({
          codeBlock: { HTMLAttributes: { class: 'tiptap-code-block' } },
          heading: { levels: [1, 2, 3] },
          // Yjs provides its own undo manager
        }),
        Collaboration.configure({ fragment }),
        CollaborationCursor.configure({
          provider: {
            // Adapt collabManager.awareness to the shape TipTap expects
            awareness: collabManager.awareness as unknown,
            on: collabManager.awareness.on.bind(collabManager.awareness),
            off: collabManager.awareness.off.bind(collabManager.awareness),
          } as unknown,
          user: {
            name: collab.userName,
            color: collab.userColor,
          },
          render: (user: { name: string; color: string }) => {
            const cursor = document.createElement('span');
            cursor.classList.add('collaboration-cursor__caret');
            cursor.style.borderColor = user.color;

            const label = document.createElement('div');
            label.classList.add('collaboration-cursor__label');
            label.style.backgroundColor = user.color;
            label.textContent = user.name;
            cursor.appendChild(label);

            return cursor;
          },
        })
      );
    } else {
      // Standalone mode: normal StarterKit with history
      base.push(
        StarterKit.configure({
          codeBlock: { HTMLAttributes: { class: 'tiptap-code-block' } },
          heading: { levels: [1, 2, 3] },
        })
      );
    }

    return base;
  }, [
    collab.enabled,
    collab.fragmentName,
    collab.userName,
    collab.userColor,
    placeholder,
    fragment,
  ]);

  const editor = useEditor(
    {
      extensions,
      content: collab.enabled ? undefined : content, // In collab mode, Yjs fragment IS the content
      editable,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML(), editor.getText());
      },
      editorProps: {
        attributes: {
          class: `prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 ${
            isDark ? 'prose-invert' : ''
          }`,
        },
      },
    },
    [extensions]
  ); // Re-create editor when extensions change

  // Sync external content changes (non-collab mode only)
  useEffect(() => {
    if (!collab.enabled && editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content]);

  // Track connected users from awareness
  useEffect(() => {
    if (!collab.enabled) return;

    const update = () => {
      const users: { name: string; color: string }[] = [];
      collabManager.awareness.getStates().forEach((state) => {
        if (state.user) {
          users.push({ name: state.user.name, color: state.user.color });
        }
      });
      setConnectedUsers(users);
    };

    collabManager.awareness.on('change', update);
    update();
    return () => collabManager.awareness.off('change', update);
  }, [collab.enabled]);

  if (!editor) return null;

  const ToolBtn = ({
    active,
    onClick,
    children,
    title,
    disabled,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1 rounded transition-colors ${
        disabled
          ? 'opacity-25 cursor-not-allowed'
          : active
            ? isDark
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-indigo-100 text-indigo-600'
            : isDark
              ? 'text-white/30 hover:text-white/60 hover:bg-white/5'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl ${isDark ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-white border border-slate-200'} ${className}`}
    >
      {/* Toolbar */}
      {editable && (
        <div
          className={`flex items-center gap-0.5 px-2 py-1 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex-wrap`}
        >
          <ToolBtn
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive('paragraph')}
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Paragraph"
          >
            <Pilcrow className="w-3.5 h-3.5" />
          </ToolBtn>

          <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />

          <ToolBtn
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Inline code"
          >
            <Code className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive('highlight')}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            title="Highlight"
          >
            <span
              className="w-3.5 h-3.5 flex items-center justify-center text-[9px]"
              style={{ fontWeight: 700 }}
            >
              H
            </span>
          </ToolBtn>

          <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />

          <ToolBtn
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Ordered list"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code block"
          >
            <FileCode2 className="w-3.5 h-3.5" />
          </ToolBtn>

          <ToolBtn
            active={false}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider"
          >
            <Minus className="w-3.5 h-3.5" />
          </ToolBtn>

          <div className="flex-1" />

          {/* Collaboration status */}
          {collab.enabled && (
            <div className="flex items-center gap-1 mr-1">
              {connectedUsers.length > 0 ? (
                <Wifi className="w-3 h-3 text-emerald-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <div className="flex items-center -space-x-1">
                {connectedUsers.slice(0, 5).map((u, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-black/20 flex items-center justify-center text-[7px] text-white"
                    style={{ backgroundColor: u.color, fontWeight: 700, zIndex: 5 - i }}
                    title={u.name}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {connectedUsers.length > 5 && (
                  <span
                    className={`text-[7px] ml-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}
                  >
                    +{connectedUsers.length - 5}
                  </span>
                )}
              </div>
              <span className={`text-[7px] ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
                {connectedUsers.length} online
              </span>
            </div>
          )}

          <ToolBtn
            active={false}
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
            disabled={collab.enabled && !editor.can().undo()}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            active={false}
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
            disabled={collab.enabled && !editor.can().redo()}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>
      )}

      {/* Editor content */}
      <div className={`flex-1 overflow-y-auto ${isDark ? 'tiptap-dark' : 'tiptap-light'}`}>
        <EditorContent editor={editor} />
      </div>

      {/* TipTap + Collaboration styles */}
      <style>{`
        .tiptap-dark .tiptap { color: rgba(255,255,255,0.75); font-size: 12px; line-height: 1.6; }
        .tiptap-light .tiptap { color: #334155; font-size: 12px; line-height: 1.6; }
        .tiptap h1 { font-size: 18px; font-weight: 700; margin: 12px 0 6px; }
        .tiptap h2 { font-size: 15px; font-weight: 600; margin: 10px 0 4px; }
        .tiptap h3 { font-size: 13px; font-weight: 600; margin: 8px 0 4px; }
        .tiptap p { margin: 4px 0; }
        .tiptap ul, .tiptap ol { padding-left: 20px; margin: 4px 0; }
        .tiptap li { margin: 2px 0; }
        .tiptap blockquote { border-left: 3px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}; padding-left: 12px; margin: 8px 0; color: ${isDark ? 'rgba(255,255,255,0.4)' : '#64748b'}; }
        .tiptap code { background: ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}; padding: 1px 4px; border-radius: 4px; font-size: 11px; font-family: monospace; }
        .tiptap-code-block { background: ${isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}; border-radius: 8px; padding: 12px; margin: 8px 0; font-size: 10px; font-family: monospace; overflow-x: auto; }
        .tiptap-code-block code { background: none; padding: 0; }
        .tiptap hr { border: none; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}; margin: 12px 0; }
        .tiptap mark { background: ${isDark ? 'rgba(250,204,21,0.2)' : '#fef9c3'}; padding: 1px 2px; border-radius: 2px; }
        .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: ${isDark ? 'rgba(255,255,255,0.15)' : '#94a3b8'}; pointer-events: none; height: 0; }
        .tiptap strong { font-weight: 700; }
        .tiptap em { font-style: italic; }
        .tiptap s { text-decoration: line-through; }

        /* Collaboration cursor styles */
        .collaboration-cursor__caret {
          border-left: 2px solid;
          border-right: none;
          margin-left: -1px;
          margin-right: -1px;
          pointer-events: none;
          position: relative;
          word-break: normal;
        }
        .collaboration-cursor__label {
          position: absolute;
          top: -1.4em;
          left: -1px;
          font-size: 9px;
          font-weight: 600;
          line-height: normal;
          white-space: nowrap;
          color: white;
          padding: 1px 4px;
          border-radius: 4px 4px 4px 0;
          pointer-events: none;
          user-select: none;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .ProseMirror:hover .collaboration-cursor__label,
        .collaboration-cursor__caret:hover .collaboration-cursor__label {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
