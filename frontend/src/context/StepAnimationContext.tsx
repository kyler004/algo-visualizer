import { type ReactNode } from 'react'
import {
  StepAnimationContext,
  EVENT_VARIANTS,
} from './stepAnimationState'

export function StepAnimationProvider({
  event,
  children,
}: {
  event?: import('../types').EventType
  children: ReactNode
}) {
  const variants = event ? EVENT_VARIANTS[event] : EVENT_VARIANTS.line

  return (
    <StepAnimationContext.Provider value={{ currentEvent: event ?? null, variants }}>
      {children}
    </StepAnimationContext.Provider>
  )
}
