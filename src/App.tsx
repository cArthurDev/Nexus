import React, { useState } from 'react';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ServerProvider, useServer } from './contexts/ServerContext';
import { FriendProvider, useFriend } from './contexts/FriendContext';
import { VoiceProvider, useVoice } from './contexts/VoiceContext';

import { AuthPage } from './components/auth/AuthPage';
import { ServerSidebar } from './components/navigation/ServerSidebar';
import { ChannelSidebar } from './components/server/ChannelSidebar';
import { DmSidebar } from './components/friends/DmSidebar';
import { UserBottomBar } from './components/user/UserBottomBar';
import { ChatArea } from './components/chat/ChatArea';
import { VoiceStage } from './components/voice/VoiceStage';
import { MembersSidebar } from './components/server/MembersSidebar';
import { FriendsView } from './components/friends/FriendsView';
import { DirectChatArea } from './components/friends/DirectChatArea';

import { CreateServerModal } from './components/modals/CreateServerModal';
import { JoinServerModal } from './components/modals/JoinServerModal';
import { CreateChannelModal } from './components/modals/CreateChannelModal';
import { CreateCategoryModal } from './components/modals/CreateCategoryModal';
import { InviteModal } from './components/modals/InviteModal';
import { UserSettingsModal } from './components/modals/UserSettingsModal';
import { ServerSettingsModal } from './components/modals/ServerSettingsModal';

import { Menu, X, Radio, Plus, Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { activeServerId, activeChannel, setActiveServerId, servers } = useServer();
  const { activeDmUserId, setActiveDmUserId } = useFriend();
  const { isInVoice, activeVoiceChannelId } = useVoice();

  // Modals state
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showJoinServer, setShowJoinServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | undefined>();
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Layout view states
  const [isFriendsTabActive, setIsFriendsTabActive] = useState(true);
  const [showMembersSidebar, setShowMembersSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewingVoiceStage, setViewingVoiceStage] = useState(false);

  // If user is not authenticated, show initial Auth Page
  if (!isAuthenticated || !currentUser) {
    return <AuthPage />;
  }

  const handleOpenDm = (userId: string) => {
    setActiveServerId(null);
    setIsFriendsTabActive(false);
    setActiveDmUserId(userId);
  };

  const handleSelectFriendsTab = () => {
    setIsFriendsTabActive(true);
    setActiveDmUserId(null);
  };

  // Determine what to display in main center stage
  const renderCenterContent = () => {
    if (activeServerId === null) {
      // Home Mode: DMs or Friends Tab
      if (!isFriendsTabActive && activeDmUserId) {
        return <DirectChatArea />;
      }
      return <FriendsView onOpenDm={handleOpenDm} />;
    } else {
      // Server Mode
      if (viewingVoiceStage || (isInVoice && activeVoiceChannelId === activeChannel?.id)) {
        return <VoiceStage onOpenSettings={() => setShowUserSettings(true)} />;
      }
      return (
        <ChatArea
          showMembers={showMembersSidebar}
          onToggleMembers={() => setShowMembersSidebar(!showMembersSidebar)}
        />
      );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-nexus-950 text-slate-100 antialiased font-sans">
      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-nexus-900 border border-white/10 text-white shadow-xl"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 1. Leftmost Server Rail */}
      <div
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } md:flex fixed md:relative inset-y-0 left-0 z-30`}
      >
        <ServerSidebar
          onOpenCreateServer={() => {
            setShowCreateServer(true);
            setMobileMenuOpen(false);
          }}
          onOpenJoinServer={() => {
            setShowJoinServer(true);
            setMobileMenuOpen(false);
          }}
        />

        {/* 2. Secondary Sidebar: Channels or DMs + Bottom User Panel */}
        <div className="flex flex-col h-full bg-nexus-900/95 border-r border-white/[0.04]">
          <div className="flex-1 overflow-hidden">
            {activeServerId === null ? (
              <DmSidebar
                isFriendsTabActive={isFriendsTabActive}
                onSelectFriendsTab={handleSelectFriendsTab}
              />
            ) : (
              <ChannelSidebar
                onOpenCreateChannel={(catId) => {
                  setTargetCategoryId(catId);
                  setShowCreateChannel(true);
                }}
                onOpenCreateCategory={() => setShowCreateCategory(true)}
                onOpenServerSettings={() => setShowServerSettings(true)}
                onOpenInvite={() => setShowInvite(true)}
              />
            )}
          </div>

          {/* User Status Bar at the bottom */}
          <UserBottomBar onOpenSettings={() => setShowUserSettings(true)} />
        </div>
      </div>

      {/* 3. Main Center Stage */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-nexus-950">
        {/* Floating Voice Switcher button when connected to voice but viewing text channel */}
        {isInVoice && activeServerId !== null && (
          <div className="bg-nexus-900/90 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Você está conectado ao canal de voz.</span>
            </div>
            <button
              onClick={() => setViewingVoiceStage(!viewingVoiceStage)}
              className="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg transition-colors"
            >
              {viewingVoiceStage ? 'Ver Chat de Texto' : 'Ver Sala de Voz / Câmeras'}
            </button>
          </div>
        )}

        {renderCenterContent()}
      </main>

      {/* 4. Right Members Sidebar (in server text channels) */}
      {activeServerId !== null && showMembersSidebar && !viewingVoiceStage && (
        <div className="hidden lg:flex h-full">
          <MembersSidebar onDirectMessage={handleOpenDm} />
        </div>
      )}

      {/* All Application Modals */}
      <CreateServerModal
        isOpen={showCreateServer}
        onClose={() => setShowCreateServer(false)}
      />

      <JoinServerModal
        isOpen={showJoinServer}
        onClose={() => setShowJoinServer(false)}
      />

      <CreateChannelModal
        isOpen={showCreateChannel}
        defaultCategoryId={targetCategoryId}
        onClose={() => setShowCreateChannel(false)}
      />

      <CreateCategoryModal
        isOpen={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
      />

      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
      />

      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
      />

      <ServerSettingsModal
        isOpen={showServerSettings}
        onClose={() => setShowServerSettings(false)}
      />

    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ServerProvider>
          <FriendProvider>
            <VoiceProvider>
              <MainLayout />
            </VoiceProvider>
          </FriendProvider>
        </ServerProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
