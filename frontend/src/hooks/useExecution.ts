import useExecutionStore from "../store/executionStore.ts";
import { executeCode} from "../services/api.ts";
import axios from "axios";

interface UseExecutionReturn {
    runCode: () => Promise<void>;
}

export default function useExecution(): UseExecutionReturn {
    const { code, language, setSteps, setLoading, setError, reset } = useExecutionStore();

    const runCode = async (): Promise<void> => {
        reset();
        setLoading(true);
        try {
            const result = await executeCode(code, language);
            setSteps(result.steps);
        } catch (error: unknown) {
            if(axios.isAxiosError(error)) {
                setError(error.response?.data?.error ?? error.message);
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Execution Failed');
            }
        } finally {
            setLoading(false);
        }
    }

    return { runCode };
}