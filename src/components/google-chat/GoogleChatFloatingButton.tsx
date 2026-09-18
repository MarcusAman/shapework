import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

interface GoogleChatFloatingButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

export const GoogleChatFloatingButton: React.FC<GoogleChatFloatingButtonProps> = ({
  onClick,
  unreadCount = 2
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
      <button
        onClick={onClick}
        type="button"
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-white hover:bg-stone-50 text-stone-900 border border-stone-200/90 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer hover:scale-105"
        title="Google Chat • Brokerage Directory & Nora AI"
      >
        {/* Google Chat & Nora Orb Icon Stack */}
        <div className="relative">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#00635C] border border-emerald-200/80 flex items-center justify-center shadow-2xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          {/* Active Presence Dot */}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
        </div>

        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-bold text-stone-900">Google Chat</span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
              77 Active
            </span>
          </div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">
            Team Directory & Nora
          </span>
        </div>

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-[#00635C] text-white rounded-full shadow-2xs">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
