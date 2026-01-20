"""
AutoML Backend — Feature Engineering

Provides feature engineering recommendations and model-ready feature analysis.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional


def get_model_ready_features(
    df: pd.DataFrame,
    target_col: str,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    categorical_cols: List[str],
    datetime_cols: List[str],
    dropped_corr_features: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Identify model-ready features with preprocessing recommendations.
    
    Args:
        df: Input DataFrame
        target_col: Target column name
        continuous_numeric: List of continuous numeric columns
        discrete_numeric: List of discrete numeric columns
        categorical_cols: List of categorical columns
        datetime_cols: List of datetime columns
        dropped_corr_features: Features to exclude due to high correlation
        
    Returns:
        List of feature recommendations
    """
    if dropped_corr_features is None:
        dropped_corr_features = []
    
    features = []
    
    for col in df.columns:
        # Skip target column
        if col == target_col:
            continue
        
        # Skip datetime columns (need special handling)
        if col in datetime_cols:
            continue
        
        # Skip dropped features
        if col in dropped_corr_features:
            continue
        
        # Skip constant columns
        if df[col].nunique() <= 1:
            continue
        
        # Determine feature type and preprocessing
        if col in continuous_numeric:
            feature_type = "Continuous Numeric"
            preprocessing = "Standard scaling recommended"
            additional_notes = _get_continuous_notes(df[col])
            
        elif col in discrete_numeric:
            feature_type = "Discrete Numeric"
            unique_count = df[col].nunique()
            if unique_count <= 5:
                preprocessing = "One-hot encoding (if ordinal relationship unclear)"
            else:
                preprocessing = "Ordinal encoding or scaling"
            additional_notes = f"{unique_count} unique values"
            
        elif col in categorical_cols:
            feature_type = "Categorical"
            unique_count = df[col].nunique()
            
            if unique_count == 2:
                preprocessing = "Binary encoding"
            elif unique_count <= 10:
                preprocessing = "One-hot encoding"
            elif unique_count <= 50:
                preprocessing = "Target encoding or frequency encoding"
            else:
                preprocessing = "Target encoding (high cardinality)"
            
            additional_notes = f"{unique_count} categories"
            
        else:
            # Unknown type - try to infer
            if pd.api.types.is_numeric_dtype(df[col]):
                feature_type = "Numeric (auto-detected)"
                preprocessing = "Scaling recommended"
            else:
                feature_type = "Text/Other"
                preprocessing = "Requires manual preprocessing"
            additional_notes = "Type inferred"
        
        features.append({
            "Feature": col,
            "Type": feature_type,
            "Recommended Preprocessing": preprocessing,
            "Missing %": round(float(df[col].isna().sum() / len(df) * 100), 2),
            "Unique Values": int(df[col].nunique()),
            "Notes": additional_notes
        })
    
    return features


def _get_continuous_notes(series: pd.Series) -> str:
    """Generate notes for continuous numeric features."""
    clean = series.dropna()
    
    if clean.empty:
        return "All missing values"
    
    skewness = abs(clean.skew())
    
    notes = []
    
    if skewness > 2:
        notes.append("Highly skewed - log transform may help")
    elif skewness > 1:
        notes.append("Moderately skewed")
    
    # Check for outliers
    q1, q3 = clean.quantile([0.25, 0.75])
    iqr = q3 - q1
    outlier_pct = ((clean < q1 - 1.5 * iqr) | (clean > q3 + 1.5 * iqr)).sum() / len(clean) * 100
    
    if outlier_pct > 5:
        notes.append(f"{outlier_pct:.1f}% outliers")
    
    return "; ".join(notes) if notes else "Normal distribution"


def get_model_recommendations(target_type: str) -> List[Dict[str, Any]]:
    """
    Get recommended ML models based on target type.
    
    Args:
        target_type: One of 'Regression', 'Binary Classification', 'Multiclass Classification'
        
    Returns:
        List of model recommendations with reasoning
    """
    model_map = {
        "Regression": [
            {
                "Recommended Model": "Linear Regression",
                "Why Use It": "Simple baseline, interpretable coefficients",
                "Complexity": "Low",
                "Best For": "Linear relationships, explainability"
            },
            {
                "Recommended Model": "Ridge / Lasso Regression",
                "Why Use It": "Handles multicollinearity, regularization",
                "Complexity": "Low",
                "Best For": "Many features, feature selection"
            },
            {
                "Recommended Model": "Random Forest Regressor",
                "Why Use It": "Non-linear relationships, robust to outliers",
                "Complexity": "Medium",
                "Best For": "Complex relationships, feature importance"
            },
            {
                "Recommended Model": "XGBoost Regressor",
                "Why Use It": "High accuracy, handles missing values",
                "Complexity": "Medium-High",
                "Best For": "Competitive performance, structured data"
            },
            {
                "Recommended Model": "LightGBM Regressor",
                "Why Use It": "Fast training, memory efficient",
                "Complexity": "Medium-High",
                "Best For": "Large datasets, speed requirements"
            }
        ],
        "Binary Classification": [
            {
                "Recommended Model": "Logistic Regression",
                "Why Use It": "Interpretable, probability outputs",
                "Complexity": "Low",
                "Best For": "Baseline, explainability requirements"
            },
            {
                "Recommended Model": "Random Forest Classifier",
                "Why Use It": "Non-linear, feature importance",
                "Complexity": "Medium",
                "Best For": "Imbalanced data, complex patterns"
            },
            {
                "Recommended Model": "XGBoost Classifier",
                "Why Use It": "State-of-the-art accuracy",
                "Complexity": "Medium-High",
                "Best For": "Maximum accuracy, structured data"
            },
            {
                "Recommended Model": "LightGBM Classifier",
                "Why Use It": "Fast, handles categorical features",
                "Complexity": "Medium-High",
                "Best For": "Large datasets, quick iteration"
            },
            {
                "Recommended Model": "Support Vector Machine",
                "Why Use It": "Effective in high dimensions",
                "Complexity": "Medium",
                "Best For": "Small to medium datasets"
            }
        ],
        "Multiclass Classification": [
            {
                "Recommended Model": "Multinomial Logistic Regression",
                "Why Use It": "Simple baseline, interpretable",
                "Complexity": "Low",
                "Best For": "Baseline model, linear boundaries"
            },
            {
                "Recommended Model": "Random Forest Classifier",
                "Why Use It": "Handles many classes well",
                "Complexity": "Medium",
                "Best For": "Robust multiclass handling"
            },
            {
                "Recommended Model": "XGBoost Classifier",
                "Why Use It": "Strong multiclass performance",
                "Complexity": "Medium-High",
                "Best For": "Competitive accuracy"
            },
            {
                "Recommended Model": "LightGBM Classifier",
                "Why Use It": "Efficient multiclass training",
                "Complexity": "Medium-High",
                "Best For": "Large datasets, many classes"
            },
            {
                "Recommended Model": "CatBoost Classifier",
                "Why Use It": "Great with categoricals, no tuning needed",
                "Complexity": "Medium",
                "Best For": "Mixed feature types"
            }
        ]
    }
    
    return model_map.get(target_type, [])


def suggest_feature_engineering(
    df: pd.DataFrame,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    categorical_cols: List[str],
    datetime_cols: List[str]
) -> List[Dict[str, Any]]:
    """
    Suggest feature engineering opportunities.
    
    Args:
        df: Input DataFrame
        continuous_numeric: Continuous numeric columns
        discrete_numeric: Discrete numeric columns
        categorical_cols: Categorical columns
        datetime_cols: Datetime columns
        
    Returns:
        List of feature engineering suggestions
    """
    suggestions = []
    
    # Datetime features
    for col in datetime_cols:
        suggestions.append({
            "Feature": col,
            "Suggestion": "Extract datetime components",
            "New Features": ["year", "month", "day", "dayofweek", "hour", "is_weekend"],
            "Impact": "High",
            "Rationale": "Temporal patterns often contain valuable information"
        })
    
    # Skewed continuous features
    for col in continuous_numeric:
        series = df[col].dropna()
        if series.empty:
            continue
            
        skewness = abs(series.skew())
        if skewness > 1:
            suggestions.append({
                "Feature": col,
                "Suggestion": "Apply log or Box-Cox transformation",
                "New Features": [f"{col}_log", f"{col}_sqrt"],
                "Impact": "Medium-High",
                "Rationale": f"Skewness of {skewness:.2f} may affect model performance"
            })
    
    # High cardinality categoricals
    for col in categorical_cols:
        unique_count = df[col].nunique()
        if unique_count > 20:
            suggestions.append({
                "Feature": col,
                "Suggestion": "Reduce cardinality or use target encoding",
                "New Features": [f"{col}_encoded", f"{col}_grouped"],
                "Impact": "Medium",
                "Rationale": f"High cardinality ({unique_count}) may cause overfitting with one-hot"
            })
    
    # Interaction features for numeric pairs
    if len(continuous_numeric) >= 2:
        suggestions.append({
            "Feature": "Numeric Interactions",
            "Suggestion": "Create interaction features",
            "New Features": ["feature_1 * feature_2", "feature_1 / feature_2"],
            "Impact": "Medium",
            "Rationale": "Interactions may capture non-linear relationships"
        })
    
    # Polynomial features for key numerics
    if continuous_numeric:
        suggestions.append({
            "Feature": "Polynomial Features",
            "Suggestion": "Add polynomial terms for top features",
            "New Features": ["feature^2", "feature^3"],
            "Impact": "Low-Medium",
            "Rationale": "Can capture non-linear effects"
        })
    
    # Binning for continuous
    for col in continuous_numeric[:3]:  # Limit suggestions
        suggestions.append({
            "Feature": col,
            "Suggestion": "Create binned/discretized version",
            "New Features": [f"{col}_binned"],
            "Impact": "Low",
            "Rationale": "May help tree-based models find splits"
        })
    
    return suggestions


def get_training_plan(
    df: pd.DataFrame,
    target_col: str,
    target_type: str,
    features: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generate comprehensive training plan.
    
    Args:
        df: Input DataFrame
        target_col: Target column name
        target_type: Inferred target type
        features: Model-ready features
        
    Returns:
        Dictionary with complete training plan
    """
    num_samples = len(df)
    num_features = len(features)
    
    # Determine train/test split strategy
    if num_samples < 1000:
        cv_strategy = "5-fold cross-validation (small dataset)"
        test_size = 0.2
    elif num_samples < 10000:
        cv_strategy = "5-fold cross-validation"
        test_size = 0.2
    else:
        cv_strategy = "Single train/test split with validation set"
        test_size = 0.15
    
    # Check for class imbalance
    imbalance_handling = None
    if "Classification" in target_type:
        vc = df[target_col].value_counts()
        ratio = vc.max() / vc.min() if vc.min() > 0 else float('inf')
        
        if ratio > 10:
            imbalance_handling = "SMOTE or class weights strongly recommended"
        elif ratio > 3:
            imbalance_handling = "Consider class weights or stratified sampling"
    
    # Feature preprocessing summary
    preprocessing_steps = []
    
    numeric_features = [f for f in features if "Numeric" in f["Type"]]
    categorical_features = [f for f in features if f["Type"] == "Categorical"]
    
    if numeric_features:
        preprocessing_steps.append(f"Scale {len(numeric_features)} numeric features")
    
    if categorical_features:
        preprocessing_steps.append(f"Encode {len(categorical_features)} categorical features")
    
    # Missing value handling
    missing_cols = [f for f in features if f.get("Missing %", 0) > 0]
    if missing_cols:
        preprocessing_steps.append(f"Impute missing values in {len(missing_cols)} features")
    
    return {
        "target_column": target_col,
        "target_type": target_type,
        "num_samples": num_samples,
        "num_features": num_features,
        "recommended_models": get_model_recommendations(target_type),
        "cross_validation": cv_strategy,
        "test_size": test_size,
        "imbalance_handling": imbalance_handling,
        "preprocessing_steps": preprocessing_steps,
        "estimated_training_time": _estimate_training_time(num_samples, num_features)
    }


def _estimate_training_time(num_samples: int, num_features: int) -> str:
    """Estimate training time based on dataset size."""
    complexity = num_samples * num_features
    
    if complexity < 100000:
        return "Fast (< 1 minute)"
    elif complexity < 1000000:
        return "Moderate (1-5 minutes)"
    elif complexity < 10000000:
        return "Slow (5-30 minutes)"
    else:
        return "Very slow (> 30 minutes) - consider sampling"
