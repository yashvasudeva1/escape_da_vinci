"""
AutoML Backend — Target Detection

Provides intelligent target column detection and classification.
Automatically infers target type for ML task selection.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple


def infer_target_type(
    df: pd.DataFrame,
    target_col: str
) -> Dict[str, Any]:
    """
    Infer the ML task type based on target column characteristics.
    
    Args:
        df: Input DataFrame
        target_col: Name of target column
        
    Returns:
        Dictionary with target type and reasoning
    """
    if target_col not in df.columns:
        return {
            "target_type": "Unknown",
            "reasoning": f"Column '{target_col}' not found in dataset"
        }
    
    series = df[target_col].dropna()
    
    if series.empty:
        return {
            "target_type": "Unknown",
            "reasoning": "Target column contains only missing values"
        }
    
    unique_count = series.nunique()
    total_count = len(series)
    unique_ratio = unique_count / total_count
    
    # Binary classification
    if unique_count == 2:
        unique_values = series.unique().tolist()
        return {
            "target_type": "Binary Classification",
            "unique_values": [str(v) for v in unique_values],
            "class_distribution": series.value_counts().to_dict(),
            "reasoning": "Exactly 2 unique values detected"
        }
    
    # Check if numeric
    if pd.api.types.is_numeric_dtype(series):
        # Discrete classification vs regression
        if unique_count <= 20 and unique_ratio < 0.05:
            return {
                "target_type": "Multiclass Classification",
                "num_classes": unique_count,
                "class_distribution": series.value_counts().head(10).to_dict(),
                "reasoning": f"Numeric with {unique_count} discrete values (≤20 unique, <5% ratio)"
            }
        else:
            return {
                "target_type": "Regression",
                "unique_count": unique_count,
                "value_range": {
                    "min": float(series.min()),
                    "max": float(series.max()),
                    "mean": float(series.mean()),
                    "std": float(series.std())
                },
                "reasoning": f"Continuous numeric with {unique_count} unique values"
            }
    
    # Categorical/Object type
    if unique_count <= 50:
        return {
            "target_type": "Multiclass Classification",
            "num_classes": unique_count,
            "class_distribution": series.value_counts().head(10).to_dict(),
            "reasoning": f"Categorical with {unique_count} classes"
        }
    
    return {
        "target_type": "Unknown",
        "unique_count": unique_count,
        "reasoning": "High cardinality categorical - may need preprocessing"
    }


def auto_detect_target(
    df: pd.DataFrame,
    categorical_cols: List[str] = None,
    discrete_cols: List[str] = None
) -> Optional[str]:
    """
    Automatically detect the most likely target column.
    
    Uses heuristics:
    1. Common target column names
    2. Position (last column)
    3. Column characteristics (binary, low cardinality)
    
    Args:
        df: Input DataFrame
        categorical_cols: Known categorical columns
        discrete_cols: Known discrete numeric columns
        
    Returns:
        Detected target column name or None
    """
    # Priority 1: Common target names
    target_keywords = [
        "target", "label", "class", "y", "output",
        "churn", "fraud", "default", "survived", "outcome",
        "result", "status", "category", "type", "grade", "rating"
    ]
    
    for keyword in target_keywords:
        for col in df.columns:
            if keyword == col.lower() or keyword in col.lower():
                return col
    
    # Priority 2: Binary columns at the end
    for col in reversed(df.columns.tolist()):
        if df[col].nunique() == 2:
            return col
    
    # Priority 3: Low cardinality categorical at the end
    if categorical_cols:
        for col in reversed(df.columns.tolist()):
            if col in categorical_cols and df[col].nunique() <= 10:
                return col
    
    # Priority 4: Low cardinality discrete numeric at the end
    if discrete_cols:
        for col in reversed(df.columns.tolist()):
            if col in discrete_cols and df[col].nunique() <= 10:
                return col
    
    # Priority 5: Last column
    return df.columns[-1]


def validate_target_column(
    df: pd.DataFrame,
    target_col: str,
    min_samples_per_class: int = 5
) -> Dict[str, Any]:
    """
    Validate target column for ML training.
    
    Args:
        df: Input DataFrame
        target_col: Target column name
        min_samples_per_class: Minimum samples per class for classification
        
    Returns:
        Validation result with warnings and recommendations
    """
    result = {
        "is_valid": True,
        "warnings": [],
        "recommendations": []
    }
    
    if target_col not in df.columns:
        result["is_valid"] = False
        result["error"] = f"Column '{target_col}' not found"
        return result
    
    series = df[target_col]
    
    # Check for missing values
    missing_pct = series.isna().sum() / len(series) * 100
    if missing_pct > 0:
        result["warnings"].append(f"{missing_pct:.1f}% missing values in target")
        if missing_pct > 20:
            result["recommendations"].append("Consider imputation or removing rows with missing target")
    
    # Check class balance for classification
    unique_count = series.nunique()
    if unique_count <= 20:  # Classification task
        class_counts = series.value_counts()
        
        # Check minimum samples per class
        min_class_count = class_counts.min()
        if min_class_count < min_samples_per_class:
            result["warnings"].append(f"Class '{class_counts.idxmin()}' has only {min_class_count} samples")
            result["recommendations"].append("Consider oversampling or collecting more data")
        
        # Check class imbalance
        imbalance_ratio = class_counts.max() / class_counts.min()
        if imbalance_ratio > 10:
            result["warnings"].append(f"Severe class imbalance (ratio: {imbalance_ratio:.1f})")
            result["recommendations"].append("Use class weights, SMOTE, or stratified sampling")
        elif imbalance_ratio > 3:
            result["warnings"].append(f"Moderate class imbalance (ratio: {imbalance_ratio:.1f})")
            result["recommendations"].append("Consider using stratified cross-validation")
    
    # Check for constant target
    if unique_count == 1:
        result["is_valid"] = False
        result["error"] = "Target column has only one unique value"
    
    return result


def get_class_distribution(
    df: pd.DataFrame,
    target_col: str
) -> Dict[str, Any]:
    """
    Get detailed class distribution for classification targets.
    
    Args:
        df: Input DataFrame
        target_col: Target column name
        
    Returns:
        Dictionary with class distribution metrics
    """
    if target_col not in df.columns:
        return {"error": f"Column '{target_col}' not found"}
    
    series = df[target_col].dropna()
    
    if series.empty:
        return {"error": "No valid values in target column"}
    
    vc = series.value_counts()
    total = len(series)
    
    classes = []
    for cls, count in vc.items():
        classes.append({
            "class": str(cls),
            "count": int(count),
            "percentage": round(float(count / total * 100), 2)
        })
    
    return {
        "num_classes": int(series.nunique()),
        "total_samples": int(total),
        "classes": classes,
        "majority_class": str(vc.idxmax()),
        "minority_class": str(vc.idxmin()),
        "imbalance_ratio": round(float(vc.max() / vc.min()), 2) if vc.min() > 0 else float('inf'),
        "is_balanced": float(vc.max() / vc.min()) < 3 if vc.min() > 0 else False
    }
