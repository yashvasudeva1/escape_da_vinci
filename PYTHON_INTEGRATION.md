# AutoML Intelligence System - Python Integration

## Architecture

This project uses a **hybrid architecture** with both TypeScript and Python backends:

- **Next.js (Port 3000)**: Frontend UI + TypeScript API routes
- **FastAPI (Port 8000)**: Python backend for ML operations

The system automatically falls back to TypeScript implementations if Python backend is unavailable.

## Setup

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Install Python Dependencies
```bash
cd python_backend
pip install -r requirements.txt
```

## Running the Application

### Option 1: Run Both Servers Separately

**Terminal 1 - Python Backend:**
```bash
cd python_backend
python main.py
# Runs on http://localhost:8000
```

**Terminal 2 - Next.js Frontend:**
```bash
npm run dev
# Runs on http://localhost:3000
```

### Option 2: Use Start Script (Recommended)
```bash
./start.sh
# Starts both servers automatically
```

## Python Backend Endpoints

The Python FastAPI server provides the following endpoints:

### `POST /api/python/column-types`
Classifies columns into continuous, discrete, categorical, and datetime types.

**Request:**
```json
{
  "data": [{"col1": 1, "col2": "A"}, ...]
}
```

**Response:**
```json
{
  "continuous": ["col1"],
  "discrete": [],
  "categorical": ["col2"],
  "datetime": [],
  "columnProfile": [...]
}
```

### `POST /api/python/descriptive`
Generates descriptive statistics for numeric and categorical columns.

**Request:**
```json
{
  "data": [...],
  "columnProfile": [...]
}
```

**Response:**
```json
{
  "numeric": {"col1": {"mean": 5.2, ...}},
  "categorical": [{"Column": "col2", ...}]
}
```

### `POST /api/python/diagnostic`
Performs correlation analysis and multicollinearity detection.

**Request:**
```json
{
  "data": [...],
  "columnProfile": [...]
}
```

### `POST /api/python/predictive`
Trains baseline ML models (classification/regression/clustering).

**Request:**
```json
{
  "data": [...],
  "columnProfile": [...],
  "targetColumn": "target" // optional
}
```

**Response:**
```json
{
  "targetColumn": "churn",
  "targetType": "Binary Classification",
  "features": [...],
  "modelResults": {
    "task": "classification",
    "metrics": {"Test Accuracy": 0.87, ...},
    "confusion_matrix": [[...]]
  }
}
```

## How It Works

1. **File Upload**: User uploads CSV/Excel file through Next.js frontend
2. **Data Parsing**: Next.js parses the file and sends data to pipeline
3. **Python Processing**: Next.js API routes check if Python backend is available
   - If available: Calls Python FastAPI endpoints for ML operations
   - If unavailable: Falls back to TypeScript implementations
4. **Results Display**: Frontend displays results from whichever backend was used

## Python Module Structure

```
python_backend/
├── main.py                          # FastAPI server
├── column_identification_json.py    # Column type detection
├── data_analysis_json.py            # Statistical analysis
├── baseline_model_json.py           # ML model training
├── models_json.py                   # Model utilities
└── requirements.txt                 # Python dependencies
```

## Environment Variables

Create `.env.local` to customize:

```bash
# Python backend URL (default: http://localhost:8000)
PYTHON_BACKEND_URL=http://localhost:8000
```

## Troubleshooting

### Python backend not starting
```bash
# Check if port 8000 is already in use
lsof -ti:8000

# Kill process if needed
kill -9 $(lsof -ti:8000)

# Reinstall dependencies
cd python_backend
pip install --upgrade -r requirements.txt
```

### Matplotlib font cache issue
If Python backend hangs on startup, matplotlib might be building font cache:
```bash
# Clear matplotlib cache
rm -rf ~/.matplotlib
```

### TypeScript fallback always used
1. Verify Python backend is running: `curl http://localhost:8000/`
2. Check browser console for connection errors
3. Ensure CORS is properly configured

## Development

### Adding New Python Endpoints

1. Add function to appropriate Python module
2. Create FastAPI endpoint in `main.py`
3. Update Next.js API route to call Python endpoint
4. Add TypeScript fallback implementation

### Testing Python Backend
```bash
# Test root endpoint
curl http://localhost:8000/

# Test column classification
curl -X POST http://localhost:8000/api/python/column-types \
  -H "Content-Type: application/json" \
  -d '{"data": [{"age": 25}, {"age": 30}]}'
```

## Production Deployment

For production, consider:
1. Deploy Python backend as separate service (e.g., AWS Lambda, Google Cloud Run)
2. Update `PYTHON_BACKEND_URL` environment variable
3. Enable authentication between services
4. Add rate limiting and caching
5. Use Redis for session management

## Tech Stack

**Frontend/API:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Zustand (state management)
- Tailwind CSS

**Python Backend:**
- FastAPI
- pandas
- scikit-learn
- NumPy

**Data Processing:**
- papaparse (CSV parsing)
- xlsx (Excel parsing)
- simple-statistics
- ml-matrix
