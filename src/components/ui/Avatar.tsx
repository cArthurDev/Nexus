import React from 'react';
import { PresenceStatus } from '../../types';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: PresenceStatus;
  isSpeaking?: boolean;
  className?: string;
  showStatus?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

const statusSizeClasses = {
  xs: 'w-2 h-2 border-[1.5px]',
  sm: 'w-2.5 h-2.5 border-2',
  md: 'w-3.5 h-3.5 border-2',
  lg: 'w-4 h-4 border-2',
  xl: 'w-5 h-5 border-[3px]',
  '2xl': 'w-6 h-6 border-[3px]',
};

const statusColors: Record<PresenceStatus, string> = {
  online: 'bg-emerald-500',
  idle: 'bg-amber-500',
  dnd: 'bg-rose-500',
  offline: 'bg-slate-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  isSpeaking = false,
  className = '',
  showStatus = true,
}) => {
  const initials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'NexusUser')}`;

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center font-bold text-white transition-all duration-200 ${
          sizeClasses[size]
        } ${
          isSpeaking
            ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-nexus-950 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse-speaking'
            : 'ring-1 ring-white/10'
        } bg-gradient-to-br from-nexus-700 to-nexus-850`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultAvatar;
            }}
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showStatus && status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-nexus-950 shadow-md ${statusSizeClasses[size]} ${statusColors[status]}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
