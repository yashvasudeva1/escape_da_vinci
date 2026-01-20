"""
AutoML Backend — T5: Predictive Analytics

Provides ML model training, evaluation, and prediction capabilities.
Supports classification (binary/multiclass) and regression tasks.

Usage:
    from automl_backend.predictive import run_predictive_analytics
    
    result = run_predictive_analytics(
        df,
        target_col='target',
        continuous_numeric=['age', 'income'],
        discrete_numeric=['quantity'],
        categorical_cols=['category'],
        datetime_cols=['date']
    )
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Union
import warnings

warnings.filterwarnings('ignore')

from .target_detection import infer_target_type, validate_target_column, get_class_distribution
from .feature_engineering import (
    get_model_ready_features,
    get_model_recommendations,
    get_training_plan
)


def run_predictive_analytics(
    df: pd.DataFrame,
    target_col: str,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    categorical_cols: List[str],
    datetime_cols: List[str] = None,
    dropped_corr_features: List[str] = None,
    test_size: float = 0.2,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Run complete predictive analytics for AutoML T5 tab.
    
    Performs:
    - Target type detection
    - Feature preparation
    - Model recommendations
    - Baseline model training
    - Evaluation metrics
    
    Args:
        df: Input DataFrame
        target_col: Target column name
        continuous_numeric: List of continuous numeric columns
        discrete_numeric: List of discrete numeric columns
        categorical_cols: List of categorical columns
        datetime_cols: List of datetime columns (excluded from features)
        dropped_corr_features: Features to exclude due to multicollinearity
        test_size: Test split proportion (default 0.2)
        random_state: Random seed for reproducibility
        
    Returns:
        Dictionary with all predictive analytics results:
        {
            "target_type": "...",
            "target_validation": {...},
            "features_df": [...],
            "model_recommendations": [...],
            "training_plan": {...},
            "metrics": {...},
            "feature_importance": [...],
            "confusion_matrix": [[...]] or None,
            "classification_report": {...} or None
        }
    """
    if datetime_cols is None:
        datetime_cols = []
    if dropped_corr_features is None:
        dropped_corr_features = []
    
    result = {
        "target_type": None,
        "target_validation": {},
        "features_df": [],
        "model_recommendations": [],
        "training_plan": {},
        "metrics": {},
        "feature_importance": [],
        "confusion_matrix": None,
        "classification_report": None
    }
    
    # ========================
    # Target Type Detection
    # ========================
    target_info = infer_target_type(df, target_col)
    result["target_type"] = target_info.get("target_type", "Unknown")
    result["target_info"] = target_info
    
    # ========================
    # Target Validation
    # ========================
    result["target_validation"] = validate_target_column(df, target_col)
    
    if not result["target_validation"].get("is_valid", False):
        result["error"] = result["target_validation"].get("error", "Target validation failed")
        return result
    
    # ========================
    # Class Distribution (for classification)
    # ========================
    if "Classification" in result["target_type"]:
        result["class_distribution"] = get_class_distribution(df, target_col)
    
    # ========================
    # Model-Ready Features
    # ========================
    result["features_df"] = get_model_ready_features(
        df,
        target_col,
        continuous_numeric,
        discrete_numeric,
        categorical_cols,
        datetime_cols,
        dropped_corr_features
    )
    
    if not result["features_df"]:
        result["error"] = "No valid features available for modeling"
        return result
    
    # ========================
    # Model Recommendations
    # ========================
    result["model_recommendations"] = get_model_recommendations(result["target_type"])
    
    # ========================
    # Training Plan
    # ========================
    result["training_plan"] = get_training_plan(
        df, target_col, result["target_type"], result["features_df"]
    )
    
    # ========================
    # Train Baseline Model
    # ========================
    try:
        training_result = train_baseline_model(
            df,
            target_col,
            result["features_df"],
            result["target_type"],
            test_size=test_size,
            random_state=random_state
        )
        
        result["metrics"] = training_result.get("metrics", {})
        result["feature_importance"] = training_result.get("feature_importance", [])
        result["confusion_matrix"] = training_result.get("confusion_matrix")
        result["classification_report"] = training_result.get("classification_report")
        result["model_type"] = training_result.get("model_type", "Unknown")
        
    except Exception as e:
        result["training_error"] = str(e)
        result["metrics"] = {}
    
    return result


def train_baseline_model(
    df: pd.DataFrame,
    target_col: str,
    feature_df: Union[List[Dict[str, Any]], pd.DataFrame],
    target_type: str,
    test_size: float = 0.2,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Train a baseline model for the given target type.
    
    Args:
        df: Input DataFrame
        target_col: Target column name
        feature_df: List of feature dictionaries or DataFrame
        target_type: One of 'Regression', 'Binary Classification', 'Multiclass Classification'
        test_size: Test split proportion
        random_state: Random seed
        
    Returns:
        Dictionary with training results including metrics
    """
    try:
        from sklearn.model_selection import train_test_split
        from sklearn.pipeline import Pipeline
        from sklearn.compose import ColumnTransformer
        from sklearn.preprocessing import StandardScaler, OneHotEncoder
        from sklearn.impute import SimpleImputer
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score, f1_score,
            mean_squared_error, mean_absolute_error, r2_score,
            confusion_matrix, classification_report
        )
        from sklearn.linear_model import LinearRegression, LogisticRegression
        from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    except ImportError:
        return {"error": "scikit-learn not installed"}
    
    # Convert feature_df to DataFrame if needed
    if isinstance(feature_df, list):
        feature_df = pd.DataFrame(feature_df)
    
    if feature_df.empty:
        return {"error": "No features provided"}
    
    # Prepare features and target
    feature_cols = feature_df["Feature"].tolist()
    X = df[feature_cols].copy()
    y = df[target_col].copy()
    
    # Remove rows with missing target
    valid_idx = y.notna()
    X = X[valid_idx]
    y = y[valid_idx]
    
    if len(X) < 10:
        return {"error": "Insufficient samples for training"}
    
    # Identify column types
    numeric_features = feature_df[
        feature_df["Type"].str.contains("Numeric", case=False, na=False)
    ]["Feature"].tolist()
    
    categorical_features = feature_df[
        feature_df["Type"].str.lower() == "categorical"
    ]["Feature"].tolist()
    
    # Validate columns exist
    numeric_features = [f for f in numeric_features if f in X.columns]
    categorical_features = [f for f in categorical_features if f in X.columns]
    
    # Build preprocessing pipeline
    transformers = []
    
    if numeric_features:
        numeric_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        transformers.append(('num', numeric_transformer, numeric_features))
    
    if categorical_features:
        categorical_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        transformers.append(('cat', categorical_transformer, categorical_features))
    
    if not transformers:
        return {"error": "No valid features for preprocessing"}
    
    preprocessor = ColumnTransformer(transformers=transformers)
    
    # Select model based on target type
    if target_type == "Regression":
        model = RandomForestRegressor(n_estimators=100, random_state=random_state, n_jobs=-1)
        task = "regression"
        model_name = "Random Forest Regressor"
    elif target_type == "Binary Classification":
        model = LogisticRegression(max_iter=1000, random_state=random_state)
        task = "classification"
        model_name = "Logistic Regression"
    else:  # Multiclass
        model = RandomForestClassifier(n_estimators=100, random_state=random_state, n_jobs=-1)
        task = "classification"
        model_name = "Random Forest Classifier"
    
    # Create full pipeline
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('model', model)
    ])
    
    # Train/test split
    stratify = y if task == "classification" and y.nunique() > 1 else None
    
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=random_state,
            stratify=stratify
        )
    except ValueError as e:
        # Fallback without stratification
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=random_state
        )
    
    # Train model
    pipeline.fit(X_train, y_train)
    
    # Predictions
    y_train_pred = pipeline.predict(X_train)
    y_test_pred = pipeline.predict(X_test)
    
    # Calculate metrics
    result = {
        "model_type": model_name,
        "task": task,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "metrics": {}
    }
    
    if task == "classification":
        result["metrics"] = {
            "train_accuracy": round(float(accuracy_score(y_train, y_train_pred)), 4),
            "test_accuracy": round(float(accuracy_score(y_test, y_test_pred)), 4),
            "precision": round(float(precision_score(y_test, y_test_pred, average="weighted", zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, y_test_pred, average="weighted", zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_test, y_test_pred, average="weighted", zero_division=0)), 4)
        }
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_test_pred)
        result["confusion_matrix"] = cm.tolist()
        
        # Classification report
        report = classification_report(y_test, y_test_pred, output_dict=True, zero_division=0)
        # Convert numpy values to Python types
        result["classification_report"] = _convert_report_to_serializable(report)
        
    else:  # Regression
        train_rmse = float(np.sqrt(mean_squared_error(y_train, y_train_pred)))
        test_rmse = float(np.sqrt(mean_squared_error(y_test, y_test_pred)))
        
        result["metrics"] = {
            "train_rmse": round(train_rmse, 4),
            "test_rmse": round(test_rmse, 4),
            "mae": round(float(mean_absolute_error(y_test, y_test_pred)), 4),
            "r2_score": round(float(r2_score(y_test, y_test_pred)), 4),
            "mape": round(float(_calculate_mape(y_test, y_test_pred)), 4)
        }
    
    # Feature importance
    result["feature_importance"] = _extract_feature_importance(
        pipeline, feature_cols, numeric_features, categorical_features
    )
    
    return result


def _calculate_mape(y_true: pd.Series, y_pred: np.ndarray) -> float:
    """Calculate Mean Absolute Percentage Error."""
    y_true = np.array(y_true)
    mask = y_true != 0
    if not mask.any():
        return 0.0
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100


def _convert_report_to_serializable(report: Dict) -> Dict:
    """Convert classification report to JSON-serializable format."""
    result = {}
    for key, value in report.items():
        if isinstance(value, dict):
            result[str(key)] = {
                k: round(float(v), 4) if isinstance(v, (int, float, np.floating)) else v
                for k, v in value.items()
            }
        elif isinstance(value, (int, float, np.floating)):
            result[str(key)] = round(float(value), 4)
        else:
            result[str(key)] = value
    return result


def _extract_feature_importance(
    pipeline: Any,
    all_features: List[str],
    numeric_features: List[str],
    categorical_features: List[str]
) -> List[Dict[str, Any]]:
    """
    Extract feature importance from trained pipeline.
    
    Args:
        pipeline: Trained sklearn pipeline
        all_features: All feature names
        numeric_features: Numeric feature names
        categorical_features: Categorical feature names
        
    Returns:
        List of feature importance records
    """
    try:
        model = pipeline.named_steps['model']
        
        # Check if model has feature importances
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            importances = np.abs(model.coef_).flatten()
        else:
            return []
        
        # Get feature names from preprocessor
        preprocessor = pipeline.named_steps['preprocessor']
        
        feature_names = []
        
        # Add numeric feature names
        feature_names.extend(numeric_features)
        
        # Add one-hot encoded categorical feature names
        if categorical_features:
            try:
                cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
                cat_feature_names = cat_encoder.get_feature_names_out(categorical_features).tolist()
                feature_names.extend(cat_feature_names)
            except Exception:
                feature_names.extend(categorical_features)
        
        # Match importances to features
        if len(importances) != len(feature_names):
            # Fallback: use original feature names
            feature_names = all_features[:len(importances)]
        
        importance_list = []
        for name, imp in zip(feature_names, importances):
            importance_list.append({
                "feature": name,
                "importance": round(float(imp), 4)
            })
        
        # Sort by importance descending
        importance_list.sort(key=lambda x: x["importance"], reverse=True)
        
        # Normalize to sum to 1
        total = sum(x["importance"] for x in importance_list)
        if total > 0:
            for item in importance_list:
                item["importance_normalized"] = round(item["importance"] / total, 4)
        
        return importance_list[:20]  # Return top 20
        
    except Exception:
        return []


def get_feature_importance_summary(
    feature_importance: List[Dict[str, Any]],
    top_n: int = 10
) -> Dict[str, Any]:
    """
    Summarize feature importance results.
    
    Args:
        feature_importance: List of feature importance records
        top_n: Number of top features to highlight
        
    Returns:
        Summary dictionary
    """
    if not feature_importance:
        return {"error": "No feature importance available"}
    
    top_features = feature_importance[:top_n]
    
    return {
        "top_features": [f["feature"] for f in top_features],
        "top_importances": [f["importance"] for f in top_features],
        "total_features": len(feature_importance),
        "top_n_cumulative_importance": sum(f.get("importance_normalized", 0) for f in top_features)
    }


# ========================
# Legacy-compatible functions
# ========================

def get_model_ready_features_df(
    df: pd.DataFrame,
    target_col: str,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    categorical_cols: List[str],
    datetime_cols: List[str],
    dropped_corr_features: List[str] = None
) -> List[Dict[str, Any]]:
    """Legacy-compatible wrapper for get_model_ready_features."""
    return get_model_ready_features(
        df, target_col, continuous_numeric, discrete_numeric,
        categorical_cols, datetime_cols, dropped_corr_features
    )


def get_model_recommendations_df(target_type: str) -> List[Dict[str, Any]]:
    """Legacy-compatible wrapper for get_model_recommendations."""
    return get_model_recommendations(target_type)
