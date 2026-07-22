const POSITIONS = [
  { id: 'missionary', label: 'Missionary', icon: 'arrows_on' },
  { id: 'doggy', label: 'Doggy', icon: 'pets' },
  { id: 'cowgirl', label: 'Cowgirl', icon: 'self_improvement' },
  { id: 'oral', label: 'Oral', icon: 'face' },
  { id: 'passion', label: 'Passion', icon: 'favorite' },
  { id: 'random', label: 'Random', icon: 'casino' },
]

export default function AnimationControls({
  params, onParamChange, mode, onModeChange,
  isPlaying, onToggle, onSave, onSurprise,
  hasAudio, onAudioSync, positionName,
  effects, onEffectsChange,
}) {
  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-4 py-3">
      {positionName && mode !== 'random' && (
        <div className="text-center">
          <span className="text-[10px] text-white/30 uppercase tracking-widest">{positionName}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {POSITIONS.map((m) => (
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
        <SliderControl label="Depth" value={params.depth} onChange={(v) => onParamChange('depth', v)} />
        <SliderControl label="Intensity" value={params.intensity} onChange={(v) => onParamChange('intensity', v)} />
        <SliderControl label="Jiggle" value={params.jiggle} onChange={(v) => onParamChange('jiggle', v)} />
        <SliderControl label="Angle" value={params.angle} onChange={(v) => onParamChange('angle', v)} />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white/15 text-white hover:bg-white/25 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[14px]">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={onSurprise}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:opacity-90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[14px]">casino</span>
          Surprise
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[14px]">save</span>
          Save
        </button>

        <button
          onClick={() => onEffectsChange('condom')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 ${
            effects.condom ? 'bg-pink-500/30 text-pink-200 ring-1 ring-pink-400/50' : 'bg-white/10 text-white/60 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">shield</span>
          Condom
        </button>

        <button
          onClick={() => onEffectsChange('pill')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 ${
            effects.pill ? 'bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/50' : 'bg-white/10 text-white/60 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">medication</span>
          Pill
        </button>

        <button
          onClick={() => onEffectsChange('lube')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 ${
            effects.lube ? 'bg-purple-500/30 text-purple-200 ring-1 ring-purple-400/50' : 'bg-white/10 text-white/60 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">water_drop</span>
          Lube
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onEffectsChange('cumInside')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[14px]">bloodtype</span>
          Cum Inside
        </button>
        <button
          onClick={() => onEffectsChange('cumOutside')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[14px]">water_lux</span>
          Cum Outside
        </button>
        <button
          onClick={() => onEffectsChange('more')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 text-violet-200 hover:from-violet-600/40 hover:to-fuchsia-600/40 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[14px]">auto_fix</span>
          More
        </button>
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
