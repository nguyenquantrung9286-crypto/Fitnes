"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "./Avatar";
import { Menu } from "lucide-react";

interface TopBarProps {
  trainerName: string;
  unreadCount?: number;
  onMenuClick?: () => void;
}

export function TopBar({ trainerName, unreadCount = 0, onMenuClick }: TopBarProps) {
  const pathname = usePathname();

  const getBreadcrumb = () => {
    if (pathname === "/dashboard") return "Дашборд";
    if (pathname === "/dashboard/clients") return "Клиенты";
    if (pathname === "/dashboard/settings") return "Настройки";
    if (pathname === "/dashboard/chat") return "Чаты";
    if (pathname.includes("/chat")) return "Чат";
    if (pathname.includes("/assign")) return "Назначить тренировку";
    if (pathname.match(/\/dashboard\/clients\/[^/]+$/)) return "Профиль клиента";
    return "";
  };

  return (
    <header className="h-[60px] flex-shrink-0 bg-[#18181B] border-b border-white/[0.07] flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 text-[#9CA3AF] hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"
          aria-label="Открыть меню"
        >
          <Menu size={22} />
        </button>
        <span className="text-[16px] font-semibold text-white">{getBreadcrumb()}</span>
      </div>

      <div className="flex items-center gap-4">
        {unreadCount > 0 && (
          <Link
            href="/dashboard/chat"
            className="relative text-[#9CA3AF] hover:text-white transition-colors"
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 bg-[#7C3AED] text-white text-[10px] font-bold rounded-full px-1 min-w-[16px] text-center leading-4">
              {unreadCount}
            </span>
          </Link>
        )}
        <UserAvatar name={trainerName} size={32} />
      </div>
    </header>
  );
}
