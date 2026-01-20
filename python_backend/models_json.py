import pandas as pd
import numpy as np
import json


def infer_target_type(df, target_col):
    series = df[target_col].dropna()

    if series.empty:
        return json.dumps({"target_type": "Unknown"})

    if series.nunique() == 2:
        target_type = "Binary Classification"
    elif pd.api.types.is_numeric_dtype(series):
        if series.nunique() <= 20:
            target_type = "Multiclass Classification"
        else:
            target_type = "Regression"
    else:
        target_type = "Multiclass Classification"
    
    return json.dumps({"target_type": target_type})

def get_model_ready_features_df(
    df,
    target_col,
    continuous_numeric,
    discrete_numeric,
    categorical_cols,
    datetime_cols,
    dropped_corr_features=None
):
    if dropped_corr_features is None:
        dropped_corr_features = []

    rows = []

    for col in df.columns:
        if col == target_col:
            continue

        if col in datetime_cols:
            continue

        if col in dropped_corr_features:
            continue

        if df[col].nunique() <= 1:
            continue

        if col in continuous_numeric:
            role = "Continuous Numeric"
            encoding = "Scaling recommended"

        elif col in discrete_numeric:
            role = "Discrete Numeric"
            encoding = "Ordinal / One-hot encoding"

        elif col in categorical_cols:
            role = "Categorical"
            encoding = "One-hot / Target encoding"

        else:
            continue

        rows.append({
            "Feature": col,
            "Type": role,
            "Recommended Preprocessing": encoding
        })

    return json.dumps(rows, indent=2)

def get_model_recommendations_df(target_type):
    model_map = {
        "Regression": [
            {"Recommended Model": "Linear Regression", "Why Use It": "Baseline model"},
            {"Recommended Model": "Ridge / Lasso", "Why Use It": "Handles multicollinearity"},
            {"Recommended Model": "Random Forest Regressor", "Why Use It": "Non-linear, robust"},
            {"Recommended Model": "XGBoost Regressor", "Why Use It": "High performance"},
            {"Recommended Model": "LightGBM Regressor", "Why Use It": "Fast & scalable"}
        ],
        "Binary Classification": [
            {"Recommended Model": "Logistic Regression", "Why Use It": "Baseline classifier"},
            {"Recommended Model": "Random Forest Classifier", "Why Use It": "Handles non-linearity"},
            {"Recommended Model": "XGBoost Classifier", "Why Use It": "High accuracy"},
            {"Recommended Model": "LightGBM Classifier", "Why Use It": "Fast & efficient"},
            {"Recommended Model": "SVM", "Why Use It": "Good for small datasets"}
        ],
        "Multiclass Classification": [
            {"Recommended Model": "Multinomial Logistic Regression", "Why Use It": "Baseline"},
            {"Recommended Model": "Random Forest", "Why Use It": "Robust multiclass handling"},
            {"Recommended Model": "XGBoost", "Why Use It": "Strong performance"},
            {"Recommended Model": "LightGBM", "Why Use It": "Efficient multiclass"},
            {"Recommended Model": "CatBoost", "Why Use It": "Great for categoricals"}
        ]
    }

    models = model_map.get(target_type, [])

    return json.dumps(models, indent=2)

def get_training_plan(
    df,
    target_col,
    continuous_numeric,
    discrete_numeric,
    categorical_cols,
    datetime_cols,
    dropped_corr_features=None
):
    series = df[target_col].dropna()

    if series.empty:
        target_type = "Unknown"
    elif series.nunique() == 2:
        target_type = "Binary Classification"
    elif pd.api.types.is_numeric_dtype(series):
        if series.nunique() <= 20:
            target_type = "Multiclass Classification"
        else:
            target_type = "Regression"
    else:
        target_type = "Multiclass Classification"

    feature_json = get_model_ready_features_df(
        df,
        target_col,
        continuous_numeric,
        discrete_numeric,
        categorical_cols,
        datetime_cols,
        dropped_corr_features
    )

    model_json = get_model_recommendations_df(target_type)

    return json.dumps({
        "target_type": target_type,
        "features": json.loads(feature_json),
        "recommended_models": json.loads(model_json)
    }, indent=2)
