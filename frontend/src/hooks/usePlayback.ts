import { useEffect } from 'react';
import useExecutionStore  from "../store/executionStore.ts";

export default function usePlayback() {
    const { isPlaying, playbackSpeed, nextStep, currentStepIndex, steps } = useExecutionStore();
    useExecutionStore();

    useEffect(() => {
        if (!isPlaying || steps.length === 0) return
        if (currentStepIndex >= steps.length - 1) {
            useExecutionStore.getState().setPlaying(false)
            return
        }
        const timer = setTimeout(nextStep, playbackSpeed)
        return () => clearTimeout(timer)
    }, [isPlaying, currentStepIndex, playbackSpeed, steps.length])
}