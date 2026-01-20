/**
 * Centralized API Client for AutoML
 * Handles all backend communication with proper error handling, loading states, and retries
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 2;

// Types for API responses
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface UploadResponse {
  data: Record<string, unknown>[];
  metadata: {
    filename: string;
    rows: number;
    columns: number;
  };
}

export interface CleaningResponse {
  before: { rows: number; columns: number };
  after: { rows: number; columns: number };
  cleaningLog: Array<{
    action: string;
    column?: string;
    reason: string;
    rowsAffected?: number;
  }>;
  missingSummary: Record<string, number>;
  outlierSummary: Record<string, number>;
  cleanedData: Record<string, unknown>[];
}

export interface ColumnTypeResponse {
  column: string;
  detectedType: 'continuous' | 'discrete' | 'categorical' | 'datetime' | 'unknown';
  reasoning: string;
  uniqueValues: number;
  missingPct: number;
}

export interface DescriptiveResponse {
  numericStats: Array<{
    column: string;
    mean: number;
    median: number;
    std: number;
    skewness: number;
    kurtosis: number;
    cv: number;
    min: number;
    max: number;
    q25: number;
    q75: number;
  }>;
  categoricalStats: Array<{
    column: string;
    uniqueCount: number;
    entropy: number;
    topCategories: Array<{ value: string; count: number; percent: number }>;
    dominantCategory: string;
    dominantPct: number;
  }>;
}

export interface DiagnosticResponse {
  correlations: Array<{
    pair: string;
    pearson: number;
    spearman: number;
    kendall: number;
    interpretation: string;
  }>;
  multicollinearity: Array<{
    feature: string;
    vif: number;
    status: 'acceptable' | 'moderate' | 'high';
  }>;
  pearsonMatrix: number[][];
}

export interface PredictiveResponse {
  targetColumn: string;
  targetType: 'classification' | 'regression' | 'clustering';
  featuresUsed: string[];
  modelType: string;
  metrics: Record<string, number>;
  featureImportance: Array<{ feature: string; importance: number }>;
  confusionMatrix?: number[][];
}

export interface PrescriptiveResponse {
  featureEngineering: Array<{
    suggestion: string;
    rationale: string;
    impact: 'high' | 'medium' | 'low';
    complexity: 'high' | 'medium' | 'low';
  }>;
  dataQualityRisks: Array<{
    risk: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  businessLevers: Array<{
    lever: string;
    description: string;
    actionability: 'high' | 'medium' | 'low';
  }>;
  modelImprovements: string[];
}

export interface ExportResponse {
  url: string;
  filename: string;
  contentType: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Core fetch wrapper with timeout, retry logic, and error handling
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES,
  timeout = DEFAULT_TIMEOUT
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchOptions: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage: string;
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed.error || parsed.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorBody || `HTTP ${response.status}`;
      }
      throw new ApiError(errorMessage, response.status, errorBody);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    const err = error as Error;
    
    // Handle timeout
    if (err.name === 'AbortError') {
      if (retries > 0) {
        await sleep(1000);
        return fetchWithRetry<T>(url, options, retries - 1, timeout);
      }
      throw new ApiError('Request timed out', 408);
    }

    // Handle network errors with retry
    if (retries > 0 && err.message.includes('fetch')) {
      await sleep(1000);
      return fetchWithRetry<T>(url, options, retries - 1, timeout);
    }

    throw new ApiError(err.message || 'Network error');
  }
}

// API Client object with all endpoints
export const api = {
  /**
   * Upload a file for analysis
   */
  async upload(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new ApiError(error.error || 'Failed to upload file', response.status);
    }

    return response.json();
  },

  /**
   * Run data cleaning on the dataset
   */
  async cleaning(data: Record<string, unknown>[]): Promise<CleaningResponse> {
    return fetchWithRetry<CleaningResponse>(`${API_BASE_URL}/api/cleaning`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },

  /**
   * Get column type classifications
   */
  async columnTypes(data: Record<string, unknown>[]): Promise<ColumnTypeResponse[]> {
    return fetchWithRetry<ColumnTypeResponse[]>(`${API_BASE_URL}/api/column-types`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },

  /**
   * Get descriptive statistics
   */
  async descriptive(
    data: Record<string, unknown>[],
    columnProfile: ColumnTypeResponse[]
  ): Promise<DescriptiveResponse> {
    return fetchWithRetry<DescriptiveResponse>(`${API_BASE_URL}/api/descriptive`, {
      method: 'POST',
      body: JSON.stringify({ data, columnProfile }),
    });
  },

  /**
   * Get diagnostic analytics
   */
  async diagnostic(
    data: Record<string, unknown>[],
    columnProfile: ColumnTypeResponse[]
  ): Promise<DiagnosticResponse> {
    return fetchWithRetry<DiagnosticResponse>(`${API_BASE_URL}/api/diagnostic`, {
      method: 'POST',
      body: JSON.stringify({ data, columnProfile }),
    });
  },

  /**
   * Run predictive analytics / train model
   */
  async predictive(
    data: Record<string, unknown>[],
    columnProfile: ColumnTypeResponse[],
    targetColumn?: string
  ): Promise<PredictiveResponse> {
    return fetchWithRetry<PredictiveResponse>(`${API_BASE_URL}/api/predictive`, {
      method: 'POST',
      body: JSON.stringify({ data, columnProfile, targetColumn }),
    });
  },

  /**
   * Get prescriptive analytics
   */
  async prescriptive(
    data: Record<string, unknown>[],
    columnProfile: ColumnTypeResponse[],
    predictiveResults: PredictiveResponse | null,
    diagnosticStats: DiagnosticResponse | null
  ): Promise<PrescriptiveResponse> {
    return fetchWithRetry<PrescriptiveResponse>(`${API_BASE_URL}/api/prescriptive`, {
      method: 'POST',
      body: JSON.stringify({
        data,
        columnProfile,
        predictiveResults,
        diagnosticStats,
      }),
    });
  },

  /**
   * Run full analysis pipeline
   */
  async analyze(
    data: Record<string, unknown>[],
    columnProfile: ColumnTypeResponse[]
  ): Promise<{
    cleaning?: CleaningResponse;
    columnProfile?: ColumnTypeResponse[];
    descriptive?: DescriptiveResponse;
    diagnostic?: DiagnosticResponse;
    predictive?: PredictiveResponse;
    prescriptive?: PrescriptiveResponse;
  }> {
    return fetchWithRetry(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: JSON.stringify({ data, columnProfile }),
    }, MAX_RETRIES, 120000); // 2 minute timeout for full pipeline
  },

  /**
   * Export data in various formats
   */
  async exportData(
    format: 'csv' | 'json' | 'pdf' | 'excel',
    exportType: 'cleaned-data' | 'report' | 'statistics' | 'correlations' | 'model'
  ): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format, exportType }),
    });

    if (!response.ok) {
      throw new ApiError('Export failed', response.status);
    }

    return response.blob();
  },

  /**
   * Check if Python backend is available
   */
  async checkPythonBackend(): Promise<boolean> {
    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}/`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};

export default api;
