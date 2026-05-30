import axios from 'axios';
import type { ExecutionResult, Language } from '../types';

const api = axios.create({
    baseURL: '/api',
    timeout: 30_000,
    headers: {'Content-Type': 'application/json; charset=UTF-8'},
});

export const executeCode = async(code: string, language:Language): Promise<ExecutionResult> => {
    const { data } = await api.post<ExecutionResult>('/execute/', {code, language});
    return data;
}

export default api;