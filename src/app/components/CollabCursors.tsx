/**
 * @file CollabCursors.tsx
 * @description YYC³便携式智能AI系统 - 多光标协作编辑可视化
 * Multi-Cursor Collaborative Editing Visualization
 * Renders animated remote peer cursors, selection ranges, typing indicators,
 * and a follow-user minimap overlay inside Monaco Editor.
 * Driven by WSCollabManager peer data, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,collaboration,cursors,visualization
 */

import { Eye, EyeOff, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';
import { wsCollab, type WSPeer } from '../utils/ws-collab';

/* ── Simulated typing activity for each peer ── */
function usePeerActivity(peers: WSPeer[], currentFile: string) {
  const [activities, setActivities] = useState<Record<string, 'typing' | 'idle' | 'selecting'>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const next: Record<string, 'typing' | 'idle' | 'selecting'> = {};
      peers.forEach((p) => {
        if (!p.online || p.file !== currentFile) return;
        const r = Math.random();
        if (r < 0.4) next[p.id] = 'typing';
        else if (r < 0.55) next[p.id] = 'selecting';
        else next[p.id] = 'idle';
      });
      setActivities(next);
    }, 2500);
    return () => clearInterval(interval);
  }, [peers, currentFile]);

  return activities;
}

/* ── Simulated selections (line ranges) ── */
function usePeerSelections(peers: WSPeer[], currentFile: string) {
  const [selections, setSelections] = useState<
    Record<string, { startLine: number; endLine: number }>
  >({});

  useEffect(() => {
    const interval = setInterval(() => {
      const next: Record<string, { startLine: number; endLine: number }> = {};
      peers.forEach((p) => {
        if (!p.online || p.file !== currentFile || !p.cursor) return;
        if (Math.random() < 0.3) {
          const start = p.cursor.line;
          const end = start + Math.floor(Math.random() * 4) + 1;
          next[p.id] = { startLine: start, endLine: Math.min(end, start + 5) };
        }
      });
      setSelections(next);
    }, 4000);
    return () => clearInterval(interval);
  }, [peers, currentFile]);

  return selections;
}

/* ══════════════════════════════════════════════════ */
/*  CollabCursors — Overlay for Monaco Editor        */
/* ══════════════════════════════════════════════════ */

interface CollabCursorsProps {
  currentFile: string;
  lineHeight?: number;
  editorScrollTop?: number;
}

export function CollabCursors({
  currentFile,
  lineHeight = 20,
  editorScrollTop = 0,
}: CollabCursorsProps) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [peers, setPeers] = useState<WSPeer[]>([]);
  const [followingUser, setFollowingUser] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  // Subscribe to peer updates from WSCollab
  useEffect(() => {
    const handler = (event: string, data: unknown) => {
      if (event === 'peers-updated') {
        setPeers(data as WSPeer[]);
      }
    };
    wsCollab.on('peers-updated', handler);
    setPeers(wsCollab.peers);
    return () => wsCollab.off('peers-updated', handler);
  }, []);

  // Filter peers on this file
  const filePeers = useMemo(
    () => peers.filter((p) => p.online && p.file === currentFile && p.cursor),
    [peers, currentFile]
  );

  const activities = usePeerActivity(peers, currentFile);
  const selections = usePeerSelections(peers, currentFile);

  const getActivityLabel = useCallback(
    (activity: string | undefined) => {
      switch (activity) {
        case 'typing':
          return i.mcTyping;
        case 'selecting':
          return i.mcSelection;
        default:
          return i.mcIdle;
      }
    },
    [i]
  );

  return (
    <>
      {/* ── Cursor overlays per peer ── */}
      <AnimatePresence>
        {filePeers.map((peer) => {
          if (!peer.cursor) return null;
          const topPos = (peer.cursor.line - 1) * lineHeight + 4 - editorScrollTop;
          const activity = activities[peer.id];
          const selection = selections[peer.id];

          return (
            <div key={peer.id} className="contents">
              {/* Selection highlight */}
              {selection && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.12 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-12 right-4 pointer-events-none z-[5]"
                  style={{
                    top: `${(selection.startLine - 1) * lineHeight + 4 - editorScrollTop}px`,
                    height: `${(selection.endLine - selection.startLine + 1) * lineHeight}px`,
                    backgroundColor: peer.color,
                    borderRadius: 2,
                  }}
                />
              )}

              {/* Cursor line + blinking bar */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ type: 'spring', damping: 20 }}
                className="absolute pointer-events-none z-[8] flex items-start gap-0"
                style={{ top: `${topPos}px`, left: `${40 + (peer.cursor.col - 1) * 7.8}px` }}
              >
                {/* Cursor bar */}
                <div
                  className="w-[2px] rounded-full"
                  style={{
                    backgroundColor: peer.color,
                    height: `${lineHeight}px`,
                    animation:
                      activity === 'typing' ? 'none' : 'yyc3CursorBlink 1s ease-in-out infinite',
                  }}
                />
              </motion.div>

              {/* Peer name label (above cursor) */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute pointer-events-auto z-[9] cursor-pointer"
                style={{ top: `${topPos - 16}px`, left: `${40 + (peer.cursor.col - 1) * 7.8}px` }}
                onClick={() => setFollowingUser(followingUser === peer.id ? null : peer.id)}
              >
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-t-md text-white whitespace-nowrap"
                  style={{
                    backgroundColor: peer.color,
                    fontSize: '9px',
                    fontWeight: 600,
                    lineHeight: 1,
                    opacity: 0.9,
                  }}
                >
                  <span>{peer.name}</span>
                  {/* Typing indicator dots */}
                  {activity === 'typing' && (
                    <span className="flex gap-px ml-0.5">
                      <span
                        className="w-1 h-1 rounded-full bg-white animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-1 h-1 rounded-full bg-white animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-1 h-1 rounded-full bg-white animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>

      {/* ── Peer list popover (bottom-right) ── */}
      <div className="absolute bottom-8 right-2 z-[12]">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] backdrop-blur-sm ${t.transition} ${
            t.isDark
              ? 'bg-white/[0.06] hover:bg-white/[0.1] text-white/60'
              : 'bg-black/[0.04] hover:bg-black/[0.08] text-black/60'
          }`}
        >
          <Users className="w-3 h-3" />
          <span>{filePeers.length}</span>
        </button>

        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className={`absolute bottom-full right-0 mb-1 w-48 rounded-xl overflow-hidden ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
            >
              <div className={`px-3 py-2 border-b ${t.border.subtle}`}>
                <span className={`text-[10px] ${t.text.secondary}`} style={{ fontWeight: 600 }}>
                  {i.mcUserCount.replace('{n}', String(filePeers.length))}
                </span>
              </div>
              <div className="py-1 max-h-[200px] overflow-y-auto">
                {filePeers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFollowingUser(followingUser === p.id ? null : p.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[10px] ${t.transition} ${t.interactive.menuItem}`}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white"
                      style={{ backgroundColor: p.color, fontWeight: 700 }}
                    >
                      {p.name[0]}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className={`truncate ${t.text.primary}`} style={{ fontWeight: 500 }}>
                        {p.name}
                      </div>
                      <div className={`text-[8px] ${t.text.dimmed}`}>
                        Ln {p.cursor?.line}, Col {p.cursor?.col} ·{' '}
                        {getActivityLabel(activities[p.id])}
                      </div>
                    </div>
                    {followingUser === p.id ? (
                      <Eye className={`w-3 h-3 ${t.accent.primary}`} />
                    ) : (
                      <EyeOff className={`w-3 h-3 ${t.text.dimmed}`} />
                    )}
                  </button>
                ))}
                {filePeers.length === 0 && (
                  <div className={`px-3 py-3 text-center text-[10px] ${t.text.dimmed}`}>
                    {i.mcIdle}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Follow user banner ── */}
      <AnimatePresence>
        {followingUser &&
          (() => {
            const followed = filePeers.find((p) => p.id === followingUser);
            if (!followed) return null;
            return (
              <motion.div
                key="follow-banner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-1 left-1/2 -translate-x-1/2 z-[15] flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm"
                style={{
                  backgroundColor: `${followed.color}25`,
                  border: `1px solid ${followed.color}40`,
                }}
              >
                <Eye className="w-3 h-3" style={{ color: followed.color }} />
                <span className="text-[9px]" style={{ color: followed.color, fontWeight: 600 }}>
                  {i.mcFollowUser}: {followed.name}
                </span>
                <button
                  onClick={() => setFollowingUser(null)}
                  className="text-[9px] underline opacity-70 hover:opacity-100"
                  style={{ color: followed.color }}
                >
                  {i.mcStopFollowing}
                </button>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* CSS for cursor blink animation */}
      <style>{`
        @keyframes yyc3CursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </>
  );
}
