// Utility to check if Python backend is available and make requests
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function callPythonBackend(endpoint: string, data: any) {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 seconds
    });

    if (!response.ok) {
      throw new Error(`Python backend error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Python backend call failed:', error);
    throw error;
  }
}

export async function isPythonBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
