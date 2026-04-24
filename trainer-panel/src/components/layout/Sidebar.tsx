"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "./Avatar";
import { X } from "lucide-react";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Дашборд",
    href: "/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    id: "clients",
    label: "Клиенты",
    href: "/dashboard/clients",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "chat",
    label: "Чаты",
    href: "/dashboard/chat",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    badge: true,
  },
  {
    id: "settings",
    label: "Настройки",
    href: "/dashboard/settings",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

interface SidebarProps {
  trainerName: string;
  isOnline: boolean;
  unreadCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  trainerName,
  isOnline,
  unreadCount = 0,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.id === "dashboard") return pathname === "/dashboard";
    if (item.id === "chat") return pathname.includes("/chat");
    if (item.id === "clients")
      return pathname.startsWith("/dashboard/clients") && !pathname.includes("/chat");
    if (item.id === "settings") return pathname.startsWith("/dashboard/settings");
    return false;
  };

  return (
    <aside
      className={[
        // Desktop: always visible, relative
        "lg:relative lg:translate-x-0 lg:flex",
        // Mobile: fixed drawer, slide in/out
        "fixed inset-y-0 left-0 z-30 lg:z-auto",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Sizing
        "w-[240px] min-w-[240px] flex flex-col h-screen",
        "bg-[#18181B] border-r border-white/[0.07]",
      ].join(" ")}
    >
      {/* Logo + close button */}
      <div className="flex items-center gap-2.5 px-5 py-6 border-b border-white/[0.07]">
        <div className="w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-[#5434B3] to-[#7C3AED] flex items-center justify-center text-xl flex-shrink-0">
          💪
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px] text-white leading-tight">Fitnes</div>
          <div className="text-[11px] text-[#6B7280] leading-tight">Панель тренера</div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-[#6B7280] hover:text-white transition-colors"
          aria-label="Закрыть меню"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className={[
                "flex items-center gap-2.5 px-5 py-2.5 text-sm no-underline transition-colors",
                "border-l-[3px]",
                active
                  ? "bg-[rgba(124,58,237,0.12)] border-[#7C3AED] text-[#A78BFA] font-semibold"
                  : "border-transparent text-[#9CA3AF] hover:bg-white/[0.04]",
              ].join(" ")}
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0"
              >
                <path d={item.icon} />
              </svg>
              <span className="flex-1">{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span className="bg-[#7C3AED] text-white text-[11px] font-bold rounded-full px-1.5 py-px min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Trainer status */}
      <div className="px-5 py-4 border-t border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <UserAvatar name={trainerName} size={36} />
            <span
              className={[
                "absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full border-2 border-[#18181B]",
                isOnline ? "bg-[#3DD87A]" : "bg-[#6B7280]",
              ].join(" ")}
            />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">{trainerName}</div>
            <div className={`text-[11px] ${isOnline ? "text-[#3DD87A]" : "text-[#6B7280]"}`}>
              {isOnline ? "● Онлайн" : "● Оффлайн"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
