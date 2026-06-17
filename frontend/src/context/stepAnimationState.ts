import { createContext } from 'react'
import type { EventType } from '../types'

export interface StepMotionPreset {
  initial: Record<string, unknown>
  animate: Record<string, unknown>
  transition?: Record<string, unknown>
}

export const EVENT_VARIANTS: Record<EventType, StepMotionPreset> = {
  call: {
    initial: { scale: 0.92, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 320, damping: 26 },
  },
  line: {
    initial: { opacity: 0.85 },
    animate: { opacity: 1 },
    transition: { duration: 0.12 },
  },
  return: {
    initial: { y: -8, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
  exception: {
    initial: { x: 0 },
    animate: { x: [0, -4, 4, -4, 4, 0] },
    transition: { duration: 0.4 },
  },
  error: {
    initial: { x: 0 },
    animate: { x: [0, -4, 4, -4, 4, 0] },
    transition: { duration: 0.4 },
  },
}

export interface StepAnimationContextValue {
  currentEvent: EventType | null
  variants: StepMotionPreset
}

export const StepAnimationContext = createContext<StepAnimationContextValue>({
  currentEvent: null,
  variants: EVENT_VARIANTS.line,
})
