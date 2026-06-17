import { useEffect } from 'react'
import useExecutionStore from '../../store/executionStore'
import { hasStructureFields } from '../../utils/valueUtils'
import type { VisualizerTab } from '../../types'
import VariablesPanel from './VariablesPanel'
import CallStackPanel from './CallStackPanel'
import OutputPanel from './OutputPanel'
import StructureGraphPanel from './StructureGraphPanel'
import ReferenceGraphPanel from './ReferenceGraphPanel'

const TABS: { id: VisualizerTab; label: string }[] = [
  { id: 'variables', label: 'Variables' },
  { id: 'structure', label: 'Structure' },
  { id: 'graph', label: 'Graph' },
]

export default function VisualizerTabs() {
  const { steps, currentStepIndex, visualizerTab, setVisualizerTab } = useExecutionStore()
  const currentStep = steps[currentStepIndex]
  const variables = currentStep?.variables ?? {}

  useEffect(() => {
    if (hasStructureFields(variables) && visualizerTab === 'variables') {
      setVisualizerTab('structure')
    }
  }, [currentStepIndex, steps.length])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-1 px-4 py-2 bg-bg-secondary border-b border-border-subtle shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setVisualizerTab(tab.id)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors
              ${visualizerTab === tab.id
                ? 'bg-accent-blue/15 text-accent-blue'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
        {visualizerTab === 'variables' && (
          <>
            <VariablesPanel />
            <CallStackPanel />
            <OutputPanel />
          </>
        )}
        {visualizerTab === 'structure' && <StructureGraphPanel />}
        {visualizerTab === 'graph' && <ReferenceGraphPanel />}
      </div>
    </div>
  )
}
