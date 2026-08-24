import React from 'react';
import { useServer } from '../../contexts/ServerContext';
import { Avatar } from '../ui/Avatar';
import { Crown, ShieldCheck, Shield, User } from 'lucide-react';
import { UserRole } from '../../types';

interface MembersSidebarProps {
  onDirectMessage?: (userId: string) => void;
}

export const MembersSidebar: React.FC<MembersSidebarProps> = ({ onDirectMessage }) => {
  const { members } = useServer();

  const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
    owner: {
      label: 'Dono',
      icon: <Crown className="w-3.5 h-3.5 text-amber-400" />,
      color: 'text-amber-400'
    },
    admin: {
      label: 'Administrador',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-nexus-accent" />,
      color: 'text-nexus-accent'
    },
    moderator: {
      label: 'Moderador',
      icon: <Shield className="w-3.5 h-3.5 text-nexus-purple" />,
      color: 'text-nexus-purple'
    },
    member: {
      label: 'Membro',
      icon: null,
      color: 'text-slate-300'
    }
  };

  // Group members by role
  const owners = members.filter(m => m.role === 'owner');
  const admins = members.filter(m => m.role === 'admin');
  const mods = members.filter(m => m.role === 'moderator');
  const regulars = members.filter(m => m.role === 'member');

  const groups = [
    { role: 'owner' as UserRole, members: owners },
    { role: 'admin' as UserRole, members: admins },
    { role: 'moderator' as UserRole, members: mods },
    { role: 'member' as UserRole, members: regulars },
  ].filter(g => g.members.length > 0);

  return (
    <aside className="w-60 bg-nexus-900/90 border-l border-white/[0.04] flex flex-col h-full select-none shrink-0">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin">
        {groups.map((group) => (
          <div key={group.role} className="space-y-1">
            <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>{roleConfig[group.role].label}</span>
              <span>—</span>
              <span>{group.members.length}</span>
            </div>

            <div className="space-y-0.5">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  onClick={() => onDirectMessage && onDirectMessage(member.user_id)}
                  className="group flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-nexus-850 transition-colors cursor-pointer"
                  title={`Conversar com ${member.profile.display_name}`}
                >
                  <Avatar
                    src={member.profile.avatar_url}
                    name={member.profile.display_name}
                    status={member.profile.presence_status}
                    size="sm"
                  />

                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold truncate ${roleConfig[member.role].color}`}>
                        {member.profile.display_name}
                      </span>
                      {roleConfig[member.role].icon}
                    </div>

                    {member.profile.custom_status && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {member.profile.custom_status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
