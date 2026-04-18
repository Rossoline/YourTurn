"use client";

export default function BottomTabs({ active, onChange }) {
  const tabs = [
    { key: "timer", label: "Таймер", icon: "⏱" },
    { key: "calendar", label: "Календар", icon: "📅" },
    { key: "chat", label: "Чат", icon: "💬" },
  ];

  return (
    <div role="tablist" className="flex border-t border-zinc-800 bg-zinc-900">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          aria-label={tab.label}
          onClick={() => onChange(tab.key)}
          className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 min-h-[48px] transition-colors ${
            active === tab.key
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
