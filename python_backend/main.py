from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import json
import sys
import os

# Import your existing modules
sys.path.append(os.path.dirname(__file__))

# Import without triggering matplotlib
import warnings
warnings.filterwarnings('ignore')

from column_identification_json import (
    classify_numeric_columns,
    detect_datetime_column,
    detect_datetime_columns,
    detect_categorical_columns
)
from data_analysis_json import (
    get_categorical_descriptive_df,
    get_numerical_descriptive_df,
    get_numeric_correlation_diagnostics
)
# Import baseline model later to avoid matplotlib loading on startup
# from baseline_model_json import train_baseline_model
from models_json import infer_target_type, get_model_ready_features_df

app = FastAPI(title="AutoML Python Backend")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DataRequest(BaseModel):
    data: list[dict]

class ColumnClassificationRequest(BaseModel):
    data: list[dict]

class DescriptiveRequest(BaseModel):
    data: list[dict]
    columnProfile: list[dict]

class DiagnosticRequest(BaseModel):
    data: list[dict]
    columnProfile: list[dict]

class PredictiveRequest(BaseModel):
    data: list[dict]
    columnProfile: list[dict]
    targetColumn: str = None

@app.get("/")
def read_root():
    return {"status": "Python Backend Running", "version": "1.0.0"}

@app.post("/api/python/column-types")
def classify_columns(request: ColumnClassificationRequest):
    try:
        df = pd.DataFrame(request.data)
        
        # Get non-numerical columns
        non_numerical = df.select_dtypes(exclude=["number"]).columns.tolist()
        
        # Classify numeric columns
        numeric_result = json.loads(classify_numeric_columns(df, non_numerical))
        
        # Detect datetime columns
        datetime_result = json.loads(detect_datetime_columns(df))
        datetime_cols = datetime_result["datetime_columns"]
        
        # Detect categorical columns
        categorical_result = json.loads(detect_categorical_columns(df))
        categorical_cols = categorical_result["categorical_columns"]
        
        # Build column profile
        column_profile = []
        for col in df.columns:
            if col in numeric_result["continuous_numeric"]:
                col_type = "continuous"
            elif col in numeric_result["discrete_numeric"]:
                col_type = "discrete"
            elif col in datetime_cols:
                col_type = "datetime"
            elif col in categorical_cols:
                col_type = "categorical"
            else:
                col_type = "unknown"
            
            column_profile.append({
                "column": col,
                "detectedType": col_type,
                "uniqueValues": int(df[col].nunique()),
                "missingPct": float(df[col].isna().sum() / len(df) * 100),
                "reasoning": f"Detected as {col_type} based on data characteristics"
            })
        
        return {
            "continuous": numeric_result["continuous_numeric"],
            "discrete": numeric_result["discrete_numeric"],
            "categorical": categorical_cols,
            "datetime": datetime_cols,
            "columnProfile": column_profile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/python/descriptive")
def descriptive_analysis(request: DescriptiveRequest):
    try:
        df = pd.DataFrame(request.data)
        
        # Extract column types from profile
        continuous = []
        discrete = []
        categorical = []
        
        for profile in request.columnProfile:
            col_type = profile.get("detectedType") or profile.get("Type")
            col_name = profile.get("column") or profile.get("Feature")
            
            if col_type == "continuous":
                continuous.append(col_name)
            elif col_type == "discrete":
                discrete.append(col_name)
            elif col_type == "categorical":
                categorical.append(col_name)
        
        numeric_cols = continuous + discrete
        
        # Get descriptive stats
        numeric_stats = json.loads(get_numerical_descriptive_df(df, numeric_cols))
        categorical_stats = json.loads(get_categorical_descriptive_df(df, categorical))
        
        return {
            "numeric": numeric_stats,
            "categorical": categorical_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/python/diagnostic")
def diagnostic_analysis(request: DiagnosticRequest):
    try:
        df = pd.DataFrame(request.data)
        
        # Extract numeric columns
        continuous = []
        discrete = []
        
        for profile in request.columnProfile:
            col_type = profile.get("detectedType") or profile.get("Type")
            col_name = profile.get("column") or profile.get("Feature")
            
            if col_type == "continuous":
                continuous.append(col_name)
            elif col_type == "discrete":
                discrete.append(col_name)
        
        numeric_cols = continuous + discrete
        
        # Get correlation diagnostics
        diagnostics = json.loads(get_numeric_correlation_diagnostics(
            df,
            numeric_cols,
            continuous,
            discrete
        ))
        
        return diagnostics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/python/predictive")
def predictive_analysis(request: PredictiveRequest):
    try:
        # Lazy import to avoid matplotlib loading
        from baseline_model_json import train_baseline_model
        
        df = pd.DataFrame(request.data)
        
        # Extract column types
        continuous = []
        discrete = []
        categorical = []
        datetime_cols = []
        
        for profile in request.columnProfile:
            col_type = profile.get("detectedType") or profile.get("Type")
            col_name = profile.get("column") or profile.get("Feature")
            
            if col_type == "continuous":
                continuous.append(col_name)
            elif col_type == "discrete":
                discrete.append(col_name)
            elif col_type == "categorical":
                categorical.append(col_name)
            elif col_type == "datetime":
                datetime_cols.append(col_name)
        
        # Auto-detect target if not provided
        target_col = request.targetColumn
        if not target_col:
            # Use last column or look for common target names
            target_names = ["target", "label", "class", "y", "output", "churn", "fraud"]
            for name in target_names:
                if name in df.columns:
                    target_col = name
                    break
            if not target_col:
                target_col = df.columns[-1]
        
        # Infer target type
        target_info = json.loads(infer_target_type(df, target_col))
        
        # Get feature dataframe
        features_df_json = get_model_ready_features_df(
            df,
            target_col,
            continuous,
            discrete,
            categorical,
            datetime_cols
        )
        features_df = pd.DataFrame(json.loads(features_df_json))
        
        # Train baseline model
        model_results = json.loads(train_baseline_model(
            df,
            target_col,
            features_df,
            target_info["target_type"]
        ))
        
        return {
            "targetColumn": target_col,
            "targetType": target_info["target_type"],
            "features": features_df.to_dict("records"),
            "modelResults": model_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
