"use client";

export default function BottomTabs({ active, onChange }) {
  const tabs = [
    { key: "timer", label: "Таймер", icon: "⏱" },
    { key: "calendar", label: "Календар", icon: "📅" },
  ];

  return (
    <div className="flex border-t border-zinc-800 bg-zinc-900">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
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
