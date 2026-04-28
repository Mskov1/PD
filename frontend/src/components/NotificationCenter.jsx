import { useState } from "react";
import { Bell, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const SEVERITY_COLORS = {
  success: "var(--ht-harvest)",
  warning: "var(--ht-harvest)",
  info: "var(--ht-water)",
  error: "var(--ht-error)",
};

const TYPE_LABELS = {
  harvest_ready: "Harvest",
  harvest_soon: "Upcoming",
  low_water: "Water",
  low_nutrients: "Nutrients",
  system_error: "Error",
};

export default function NotificationCenter({ notifications, onMarkRead }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="notification-bell"
          variant="ghost"
          className="relative rounded-full w-10 h-10 p-0 transition-all hover:-translate-y-0.5"
        >
          <Bell size={20} weight={unreadCount > 0 ? "fill" : "duotone"} style={{ color: "var(--ht-text-primary)" }} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white notif-pulse"
              style={{ backgroundColor: "var(--ht-error)" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--ht-bg-surface)",
          borderColor: "rgba(19,42,27,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}
        align="end"
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
          <h4 className="text-sm font-medium" style={{ fontFamily: "Outfit, sans-serif" }}>Notifications</h4>
        </div>
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>No notifications</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  data-testid={`notification-${n.id}`}
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                  style={{
                    backgroundColor: n.read ? "transparent" : "rgba(45,90,60,0.04)",
                    borderLeft: `3px solid ${SEVERITY_COLORS[n.severity] || "var(--ht-brand-secondary)"}`,
                  }}
                  onClick={() => !n.read && onMarkRead(n.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 rounded-full"
                        style={{
                          backgroundColor: `${SEVERITY_COLORS[n.severity]}20`,
                          color: SEVERITY_COLORS[n.severity],
                        }}
                      >
                        {TYPE_LABELS[n.type] || n.type}
                      </Badge>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--ht-brand-primary)" }} />
                      )}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--ht-text-primary)" }}>{n.message}</p>
                  </div>
                  {!n.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-6 h-6 p-0 flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
                    >
                      <Check size={12} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
