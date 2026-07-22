const MOODS = [
  { id: 'none', label: 'None', icon: 'filter_none' },
  { id: 'dim', label: 'Dim', icon: 'dark_mode' },
  { id: 'candle', label: 'Candle', icon: 'local_fire_department' },
  { id: 'red', label: 'Red', icon: 'favorite' },
  { id: 'soft', label: 'Soft', icon: 'blur_on' },
]

export default function MoodFilterBar({ activeMood, onMoodChange }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-2 py-2">
      {MOODS.map((mood) => (
        <button
          key={mood.id}
          onClick={() => onMoodChange(mood.id)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all active:scale-90 whitespace-nowrap ${
            activeMood === mood.id
              ? 'bg-accent text-surface'
              : 'bg-surface-high text-muted hover:text-accent'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">{mood.icon}</span>
          {mood.label}
        </button>
      ))}
    </div>
  )
}
