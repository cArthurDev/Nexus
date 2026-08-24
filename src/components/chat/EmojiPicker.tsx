import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Expressões',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎', '🤩', '🥳', '😏', '🤔', '🤫', '🫡', '🤐', '🤨', '😐', '😑', '😶', '😴', '🤤', '😷', '🤒', '🤕', '🤢', '🤮', '🤯', '🤠', '🥸', '🥺', '😭', '😤', '😡', '🤬', '💀', '☠️', '🤡', '👻', '👽', '👾', '🤖']
  },
  {
    name: 'Gestos & Pessoas',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🧠', '🫀', '👀', '👁️', '👅', '👄']
  },
  {
    name: 'Gaming & Tech',
    emojis: ['🎮', '🕹️', '👾', '💻', '🖥️', '⌨️', '🖱️', '📱', '🔋', '🔌', '💾', '💿', '📀', '🎥', '🎬', '🎧', '🎤', '🎙️', '📻', '📡', '🚀', '🛸', '⚡', '💡', '🔥', '✨', '⭐', '🌟', '💥', '💯', '🏆', '🥇', '🎯', '🔮', '🎲', '🧩']
  },
  {
    name: 'Símbolos & Acentos',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☯️', '☸️', '🔯', '🕎', '♾️', '🆔', '⚛️', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈯', '❇️', '✳️', '❎', '✅', '✔️', '❌', '❕', '❗', '❓', '❔', '‼️', '⁉️']
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);

  const filteredCategories = EMOJI_CATEGORIES.map(cat => ({
    ...cat,
    emojis: cat.emojis.filter(e => e.includes(search) || search === '')
  })).filter(cat => cat.emojis.length > 0);

  return (
    <div className="w-72 bg-nexus-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-2.5 z-50 animate-slide-up backdrop-blur-xl">
      {/* Search Input */}
      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar emoji..."
          className="w-full pl-8 pr-3 py-1.5 bg-nexus-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-nexus-accent transition-colors"
          autoFocus
        />
      </div>

      {/* Categories header */}
      {!search && (
        <div className="flex gap-1 mb-2 pb-1 border-b border-white/5 overflow-x-auto scrollbar-none">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(idx)}
              className={`px-2 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === idx
                  ? 'bg-nexus-accent/20 text-nexus-accent font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="h-56 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
        {filteredCategories.map((cat, idx) => (
          <div key={cat.name} className={search || activeCategory === idx ? 'block' : 'hidden'}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
              {cat.name}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cat.emojis.map((emoji, eIdx) => (
                <button
                  key={`${emoji}-${eIdx}`}
                  onClick={() => {
                    onSelectEmoji(emoji);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-nexus-800 flex items-center justify-center text-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
