/**
 * @file RbacPanel.tsx
 * @description YYC³便携式智能AI系统 - 协作者RBAC权限管理面板
 * Collaborator RBAC Permission Management Panel
 * 5 roles (Owner/Admin/Editor/Viewer/Guest), per-permission matrix,
 * invite by email, block/unblock, transfer ownership.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,rbac,permissions,security
 */

import {
  Shield,
  X,
  UserPlus,
  Trash2,
  ChevronDown,
  Check,
  Crown,
  Settings,
  Pen,
  Eye,
  Users,
  Mail,
  Ban,
  ShieldCheck,
  BookOpen,
  Pencil,
  Rocket,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

/* ── Types ── */
type Role = 'owner' | 'admin' | 'editor' | 'viewer' | 'guest';
type Permission = 'read' | 'write' | 'delete' | 'manage' | 'deploy';
type MemberStatus = 'active' | 'pending' | 'blocked';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  role: Role;
  status: MemberStatus;
  lastActive: number;
}

/* ── Role permission matrix ── */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ['read', 'write', 'delete', 'manage', 'deploy'],
  admin: ['read', 'write', 'delete', 'manage', 'deploy'],
  editor: ['read', 'write', 'delete'],
  viewer: ['read'],
  guest: ['read'],
};

const ROLE_CONFIG: { role: Role; icon: typeof Crown; labelKey: string; color: string }[] = [
  { role: 'owner', icon: Crown, labelKey: 'rbOwner', color: '#f59e0b' },
  { role: 'admin', icon: ShieldCheck, labelKey: 'rbAdmin', color: '#6366f1' },
  { role: 'editor', icon: Pen, labelKey: 'rbEditor', color: '#10b981' },
  { role: 'viewer', icon: Eye, labelKey: 'rbViewer', color: '#3b82f6' },
  { role: 'guest', icon: Users, labelKey: 'rbGuest', color: '#94a3b8' },
];

const PERM_CONFIG: { perm: Permission; icon: typeof BookOpen; labelKey: string }[] = [
  { perm: 'read', icon: BookOpen, labelKey: 'rbRead' },
  { perm: 'write', icon: Pencil, labelKey: 'rbWrite' },
  { perm: 'delete', icon: Trash2, labelKey: 'rbDelete' },
  { perm: 'manage', icon: Settings, labelKey: 'rbManage' },
  { perm: 'deploy', icon: Rocket, labelKey: 'rbDeploy' },
];

/* ── Mock data ── */
const MOCK_MEMBERS: TeamMember[] = [
  {
    id: 'u1',
    name: 'You',
    email: 'you@yyc3.dev',
    avatar: 'Y',
    color: '#818cf8',
    role: 'owner',
    status: 'active',
    lastActive: Date.now(),
  },
  {
    id: 'u2',
    name: 'Alice',
    email: 'alice@yyc3.dev',
    avatar: 'A',
    color: '#6366f1',
    role: 'admin',
    status: 'active',
    lastActive: Date.now() - 600000,
  },
  {
    id: 'u3',
    name: 'Bob',
    email: 'bob@yyc3.dev',
    avatar: 'B',
    color: '#f59e0b',
    role: 'editor',
    status: 'active',
    lastActive: Date.now() - 3600000,
  },
  {
    id: 'u4',
    name: 'Carol',
    email: 'carol@yyc3.dev',
    avatar: 'C',
    color: '#10b981',
    role: 'viewer',
    status: 'pending',
    lastActive: Date.now() - 86400000,
  },
  {
    id: 'u5',
    name: 'Dave',
    email: 'dave@yyc3.dev',
    avatar: 'D',
    color: '#ec4899',
    role: 'editor',
    status: 'blocked',
    lastActive: Date.now() - 172800000,
  },
];

/* ══════════════════════════════════════════ */
/*  RbacPanel Component                       */
/* ══════════════════════════════════════════ */

interface RbacPanelProps {
  open: boolean;
  onClose: () => void;
}

export function RbacPanel({ open, onClose }: RbacPanelProps) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [members, setMembers] = useState<TeamMember[]>(MOCK_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('viewer');
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    members.forEach((m) => {
      c[m.role] = (c[m.role] || 0) + 1;
    });
    return c;
  }, [members]);

  const changeRole = useCallback(
    (memberId: string, newRole: Role) => {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
      setRoleDropdown(null);
      toast.success(i.rbChangeRole);
    },
    [i]
  );

  const removeMember = useCallback(
    (memberId: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success(i.rbRemove);
    },
    [i]
  );

  const toggleBlock = useCallback((memberId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, status: m.status === 'blocked' ? 'active' : 'blocked' } : m
      )
    );
  }, []);

  const inviteMember = useCallback(() => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;
    const newMember: TeamMember = {
      id: `u-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      avatar: inviteEmail[0].toUpperCase(),
      color: '#94a3b8',
      role: inviteRole,
      status: 'pending',
      lastActive: Date.now(),
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail('');
    toast.success(i.rbInvite);
  }, [inviteEmail, inviteRole, i]);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-gradient-to-br from-amber-50 to-orange-50'}`}
              >
                <Shield className={`w-4 h-4 ${t.isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>
                  {i.rbTitle}
                </h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>
                  {i.rbSubtitle} · {members.length} {i.rbMembers}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role badges */}
          <div className={`flex items-center gap-2 px-6 py-2 border-b ${t.border.subtle}`}>
            {ROLE_CONFIG.map((rc) => {
              const Icon = rc.icon;
              const cnt = counts[rc.role] || 0;
              return (
                <div
                  key={rc.role}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}
                >
                  <Icon className="w-2.5 h-2.5" style={{ color: rc.color }} />
                  <span className={t.text.muted}>
                    {(i as unknown as Record<string, string>)[rc.labelKey]}
                  </span>
                  <span className={t.text.dimmed}>{cnt}</span>
                </div>
              );
            })}
          </div>

          {/* Invite bar */}
          <div className={`flex items-center gap-2 px-6 py-2 border-b ${t.border.subtle}`}>
            <Mail className={`w-3.5 h-3.5 ${t.text.muted}`} />
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') inviteMember();
              }}
              placeholder={i.rbInviteEmail}
              className={`flex-1 text-[10px] bg-transparent outline-none ${t.text.primary} ${t.text.placeholder}`}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className={`text-[9px] px-2 py-1 rounded outline-none ${t.input.select}`}
            >
              {ROLE_CONFIG.filter((r) => r.role !== 'owner').map((r) => (
                <option key={r.role} value={r.role}>
                  {(i as unknown as Record<string, string>)[r.labelKey]}
                </option>
              ))}
            </select>
            <button
              onClick={inviteMember}
              disabled={!inviteEmail.includes('@')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] ${t.transition} ${
                inviteEmail.includes('@')
                  ? t.accent.solidBtn + ' text-white'
                  : 'opacity-30 cursor-not-allowed'
              }`}
              style={{ fontWeight: 600 }}
            >
              <UserPlus className="w-3 h-3" /> {i.rbInvite}
            </button>
          </div>

          {/* Permission matrix header */}
          <div
            className={`grid gap-0 px-6 py-1.5 border-b ${t.border.subtle}`}
            style={{ gridTemplateColumns: '2fr repeat(5, 1fr)' }}
          >
            <div
              className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`}
              style={{ fontWeight: 600 }}
            >
              {i.rbMembers}
            </div>
            {PERM_CONFIG.map((pc) => {
              const PIcon = pc.icon;
              return (
                <div
                  key={pc.perm}
                  className={`text-[7px] uppercase tracking-wider text-center ${t.text.dimmed}`}
                  style={{ fontWeight: 600 }}
                >
                  <PIcon className="w-2.5 h-2.5 mx-auto mb-0.5" />
                  {(i as unknown as Record<string, string>)[pc.labelKey]}
                </div>
              );
            })}
          </div>

          {/* Member list */}
          <div className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
            {members.map((member) => {
              const rc = ROLE_CONFIG.find((r) => r.role === member.role)!;
              const RIcon = rc.icon;
              const perms = ROLE_PERMISSIONS[member.role];
              const isBlocked = member.status === 'blocked';

              return (
                <div
                  key={member.id}
                  className={`grid gap-0 px-6 py-2.5 border-b ${t.border.subtle} ${t.transition} ${
                    isBlocked ? 'opacity-40' : ''
                  } ${t.interactive.menuItem}`}
                  style={{ gridTemplateColumns: '2fr repeat(5, 1fr)' }}
                >
                  {/* User info */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white flex-shrink-0"
                      style={{ backgroundColor: member.color, fontWeight: 700 }}
                    >
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] truncate ${t.text.primary}`}
                          style={{ fontWeight: 600 }}
                        >
                          {member.name}
                        </span>
                        {member.status === 'pending' && (
                          <span
                            className={`text-[7px] px-1 py-0 rounded ${t.isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}
                          >
                            {i.rbPending}
                          </span>
                        )}
                        {isBlocked && (
                          <span
                            className={`text-[7px] px-1 py-0 rounded ${t.isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}
                          >
                            {i.rbBlocked}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[8px] ${t.text.dimmed}`}>{member.email}</span>
                        <span className={`text-[7px] ${t.text.dimmed}`}>
                          {' '}
                          · {i.rbLastActive}: {formatTime(member.lastActive)}
                        </span>
                      </div>
                    </div>
                    {/* Role selector */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setRoleDropdown(roleDropdown === member.id ? null : member.id)
                        }
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] ${t.transition} ${t.interactive.iconBtn}`}
                        disabled={member.role === 'owner'}
                      >
                        <RIcon className="w-2.5 h-2.5" style={{ color: rc.color }} />
                        <span style={{ color: rc.color, fontWeight: 500 }}>
                          {(i as unknown as Record<string, string>)[rc.labelKey]}
                        </span>
                        {member.role !== 'owner' && <ChevronDown className="w-2 h-2" />}
                      </button>
                      {roleDropdown === member.id && (
                        <div
                          className={`absolute right-0 top-full mt-1 z-10 rounded-lg overflow-hidden min-w-[100px] ${t.surface.popover} ${t.border.popover} shadow-xl`}
                        >
                          {ROLE_CONFIG.filter((r) => r.role !== 'owner').map((r) => {
                            const RI = r.icon;
                            return (
                              <button
                                key={r.role}
                                onClick={() => changeRole(member.id, r.role)}
                                className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-[9px] text-left ${t.transition} ${
                                  member.role === r.role
                                    ? t.accent.primaryBg + ' ' + t.accent.primary
                                    : t.interactive.menuItem
                                }`}
                              >
                                <RI className="w-3 h-3" style={{ color: r.color }} />
                                {(i as unknown as Record<string, string>)[r.labelKey]}
                                {member.role === r.role && (
                                  <Check className="w-2.5 h-2.5 ml-auto" />
                                )}
                              </button>
                            );
                          })}
                          <div className={`border-t ${t.border.subtle}`} />
                          <button
                            onClick={() => toggleBlock(member.id)}
                            className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-[9px] text-left ${t.transition} ${t.interactive.menuItem} ${isBlocked ? 'text-emerald-400' : 'text-red-400'}`}
                          >
                            <Ban className="w-3 h-3" /> {isBlocked ? i.rbUnblock : i.rbBlock}
                          </button>
                          {member.role !== 'owner' && (
                            <button
                              onClick={() => removeMember(member.id)}
                              className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-[9px] text-left text-red-400 ${t.transition} ${t.interactive.menuItem}`}
                            >
                              <Trash2 className="w-3 h-3" /> {i.rbRemove}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Permission checkboxes */}
                  {PERM_CONFIG.map((pc) => {
                    const hasPerm = perms.includes(pc.perm);
                    return (
                      <div key={pc.perm} className="flex items-center justify-center">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center ${
                            hasPerm
                              ? t.isDark
                                ? 'bg-emerald-500/20'
                                : 'bg-emerald-50'
                              : t.isDark
                                ? 'bg-white/[0.03]'
                                : 'bg-slate-50'
                          }`}
                        >
                          {hasPerm ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <X className={`w-2 h-2 ${t.text.dimmed}`} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
}
