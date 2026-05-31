import useExecutionStore from '../../store/executionStore'
import type { EventType } from '../../types'

interface EventBadgeStyle {
    color: string
    dot:   string
    label: string
}

const EVENT_BADGE: Record<EventType, EventBadgeStyle> = {
    line:      { color: 'text-accent-blue',   dot: 'bg-accent-blue',   label: 'line'      },
    call:      { color: 'text-accent-green',  dot: 'bg-accent-green',  label: 'call'      },
    return:    { color: 'text-accent-purple', dot: 'bg-accent-purple', label: 'return'    },
    exception: { color: 'text-accent-red',    dot: 'bg-accent-red',    label: 'exception' },
    error:     { color: 'text-accent-red',    dot: 'bg-accent-red',    label: 'error'     },
}

interface SpeedOption {
    label: string
    ms: number
}

const SPEEDS: SpeedOption[] = [
    { label: '0.5×', ms: 1600 },
    { label: '1×',   ms: 800  },
    { label: '2×',   ms: 400  },
    { label: '4×',   ms: 150  },
]

export default function StepControls() {
    const {
        steps, currentStepIndex, isPlaying, playbackSpeed,
        nextStep, prevStep, goToStep, setPlaying, setPlaybackSpeed,
    } = useExecutionStore()

    const hasSteps    = steps.length > 0
    const isAtStart   = currentStepIndex <= 0
    const isAtEnd     = currentStepIndex >= steps.length - 1
    const currentStep = steps[currentStepIndex]
    const badge: EventBadgeStyle = currentStep
        ? EVENT_BADGE[currentStep.event]
        : EVENT_BADGE.line

    return (
        <div className="h-full flex items-center px-6 gap-5 bg-bg-secondary border-t border-border-subtle">

            <div className="flex items-center gap-1.5">
                <button onClick={prevStep} disabled={!hasSteps || isAtStart}
                        className="p-2 rounded hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous step">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M10 2L4 7l6 5V2z"/>
                    </svg>
                </button>

                <button onClick={() => setPlaying(!isPlaying)}
                        disabled={!hasSteps || (isAtEnd && !isPlaying)}
                        className="p-2 rounded bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying
                        ? <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M4 2h2v10H4V2zm4 0h2v10H8V2z"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2l9 5-9 5V2z"/></svg>
                    }
                </button>

                <button onClick={nextStep} disabled={!hasSteps || isAtEnd}
                        className="p-2 rounded hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Next step">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M4 2l6 5-6 5V2z"/>
                    </svg>
                </button>
            </div>

            <div className="flex items-center gap-3 text-sm font-mono min-w-[120px]">
        <span className="text-text-secondary">
          {hasSteps ? `${currentStepIndex + 1} / ${steps.length}` : '— / —'}
        </span>
                {currentStep && (
                    <span className={`flex items-center gap-1.5 text-xs ${badge.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
          </span>
                )}
            </div>

            <input type="range"
                   min={0} max={Math.max(0, steps.length - 1)}
                   value={currentStepIndex === -1 ? 0 : currentStepIndex}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => goToStep(Number(e.target.value))}
                   disabled={!hasSteps}
                   className="flex-1 max-w-xs disabled:opacity-30"
            />

            <div className="flex items-center gap-1 ml-auto">
                {SPEEDS.map((s) => (
                    <button key={s.ms} onClick={() => setPlaybackSpeed(s.ms)}
                            className={`px-2 py-0.5 rounded text-xs font-mono transition-colors
              ${playbackSpeed === s.ms
                                ? 'bg-accent-blue/20 text-accent-blue'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}>
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    )
}