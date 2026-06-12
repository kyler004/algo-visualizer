import useExecutionStore from '../../store/executionStore'

export default function OutputPanel() {
    const { steps, currentStepIndex } = useExecutionStore()

    const outputLines: string[] = []
    for (let i = 0; i <= currentStepIndex; i++) {
        steps[i]?.output?.forEach((line) => {
            if (line.trim()) outputLines.push(line.trim())
        })
    }

    return (
        <div className="bg-bg-panel p-4 flex-1">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
                Output
            </h3>
            <div className="font-mono text-sm space-y-1 min-h-[40px]">
                {outputLines.length === 0 ? (
                    <p className="text-text-secondary">
                        {steps.length > 0 ? 'No output yet' : 'Run code to see output'}
                    </p>
                ) : (
                    outputLines.map((line, i) => (
                        <div key={i} className="text-accent-green">
                            <span className="text-text-secondary mr-2">›</span>{line}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}