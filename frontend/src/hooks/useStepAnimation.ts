import { useContext } from 'react'
import { StepAnimationContext } from '../context/stepAnimationState'

export function useStepAnimation() {
  return useContext(StepAnimationContext)
}
