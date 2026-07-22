const MODES = [
  { id: 'thrust', label: 'Thrust', icon: 'arrows_on' },
  { id: 'breathe', label: 'Breathe', icon: 'air' },
  { id: 'wave', label: 'Wave', icon: 'water' },
  { id: 'pulse', label: 'Pulse', icon: 'pulse' },
]

export default function AnimationControls({ params, onParamChange, mode, onModeChange, isPlaying, onToggle, onSave, onSurprise, hasAudio, onAudioSync }) {
  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-4 py-3">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all active:scale-90 whitespace-nowrap ${
              mode === m.id ? 'bg-accent text-surface' : 'bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <SliderControl label="Speed" value={params.speed} onChange={(v) => onParamChange('speed', v)} />
        <SliderControl label="Intensity" value={params.intensity} onChange={(v) => onParamChange('intensity', v)} />
        <SliderControl label="Jiggle" value={params.jiggle} onChange={(v) => onParamChange('jiggle', v)} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-white/15 text-white hover:bg-white/25 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={onSurprise}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:opacity-90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">casino</span>
          Surprise Me
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          Save
        </button>

        {hasAudio && (
          <button
            onClick={onAudioSync}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">music_note</span>
            Sync
          </button>
        )}
      </div>
    </div>
  )
}

function SliderControl({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-white/50 w-14 shrink-0">{label}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-white"
      />
      <span className="text-[10px] text-white/40 w-6 text-right font-mono">
        {Math.round(value * 100)}
      </span>
    </div>
  )
}
