#!/bin/bash

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r python_backend/requirements.txt

# Start Python backend
echo "Starting Python backend on port 8000..."
cd python_backend && python main.py &
PYTHON_PID=$!

# Start Next.js frontend
echo "Starting Next.js frontend on port 3000..."
npm run dev &
NEXT_PID=$!

echo "✅ Both servers started!"
echo "Python Backend: http://localhost:8000"
echo "Next.js Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $PYTHON_PID $NEXT_PID; exit" INT
wait
