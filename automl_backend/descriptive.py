"""
AutoML Backend — T3: Descriptive Analytics

Provides comprehensive descriptive statistics for datasets.
Generates numerical, categorical, and distribution insights.

Usage:
    from automl_backend.descriptive import run_descriptive_analytics
    
    result = run_descriptive_analytics(
        df,
        continuous_numeric=['age', 'income'],
        discrete_numeric=['quantity'],
        categorical_cols=['category', 'region']
    )
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

from .stats_utils import (
    compute_numeric_stats,
    compute_categorical_stats,
    compute_distribution_metrics
)


def run_descriptive_analytics(
    df: pd.DataFrame,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    categorical_cols: List[str],
    datetime_cols: List[str] = None
) -> Dict[str, Any]:
    """
    Run complete descriptive analytics for AutoML T3 tab.
    
    Computes:
    - Numerical statistics (mean, median, std, skewness, etc.)
    - Categorical statistics (unique values, entropy, frequency)
    - Distribution insights for each column
    
    Args:
        df: Input DataFrame
        continuous_numeric: List of continuous numeric column names
        discrete_numeric: List of discrete numeric column names
        categorical_cols: List of categorical column names
        datetime_cols: Optional list of datetime column names
        
    Returns:
        Dictionary with all descriptive analytics results:
        {
            "numerical_stats": {...},
            "categorical_stats": [...],
            "distribution_insights": {...},
            "summary": {...}
        }
    """
    if datetime_cols is None:
        datetime_cols = []
    
    result = {
        "numerical_stats": {},
        "categorical_stats": [],
        "distribution_insights": {},
        "summary": {}
    }
    
    # ========================
    # Numerical Statistics
    # ========================
    numeric_cols = continuous_numeric + discrete_numeric
    result["numerical_stats"] = get_numerical_descriptive_stats(df, numeric_cols)
    
    # ========================
    # Categorical Statistics
    # ========================
    result["categorical_stats"] = get_categorical_descriptive_stats(df, categorical_cols)
    
    # ========================
    # Distribution Insights
    # ========================
    result["distribution_insights"] = get_distribution_insights(
        df,
        continuous_numeric,
        discrete_numeric,
        categorical_cols,
        datetime_cols
    )
    
    # ========================
    # Summary Statistics
    # ========================
    result["summary"] = generate_descriptive_summary(
        df,
        continuous_numeric,
        discrete_numeric,
        categorical_cols,
        datetime_cols
    )
    
    return result


def get_numerical_descriptive_stats(
    df: pd.DataFrame,
    numeric_cols: List[str]
) -> Dict[str, Dict[str, Any]]:
    """
    Compute descriptive statistics for numeric columns.
    
    Args:
        df: Input DataFrame
        numeric_cols: List of numeric column names
        
    Returns:
        Dictionary mapping column names to their statistics
    """
    stats = {}
    
    for col in numeric_cols:
        if col not in df.columns:
            continue
        
        col_stats = compute_numeric_stats(df[col])
        
        if col_stats is not None:
            stats[col] = col_stats
    
    return stats


def get_categorical_descriptive_stats(
    df: pd.DataFrame,
    categorical_cols: List[str]
) -> List[Dict[str, Any]]:
    """
    Compute descriptive statistics for categorical columns.
    
    Args:
        df: Input DataFrame
        categorical_cols: List of categorical column names
        
    Returns:
        List of categorical statistics records
    """
    stats = []
    
    for col in categorical_cols:
        if col not in df.columns:
            continue
        
        col_stats = compute_categorical_stats(df[col])
        
        if col_stats is not None:
            col_stats["Column"] = col
            stats.append(col_stats)
    
    return stats


def get_distribution_insights(
    df: pd.DataFrame,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    categorical_cols: List[str],
    datetime_cols: List[str]
) -> Dict[str, Dict[str, Any]]:
    """
    Generate distribution insights for each column.
    
    Args:
        df: Input DataFrame
        continuous_numeric: Continuous numeric columns
        discrete_numeric: Discrete numeric columns
        categorical_cols: Categorical columns
        datetime_cols: Datetime columns
        
    Returns:
        Dictionary mapping column names to their distribution insights
    """
    insights = {}
    
    # Continuous numeric
    for col in continuous_numeric:
        if col in df.columns:
            insights[col] = compute_distribution_metrics(df[col], "continuous")
    
    # Discrete numeric
    for col in discrete_numeric:
        if col in df.columns:
            insights[col] = compute_distribution_metrics(df[col], "discrete")
    
    # Categorical
    for col in categorical_cols:
        if col in df.columns:
            insights[col] = compute_distribution_metrics(df[col], "categorical")
    
    # Datetime
    for col in datetime_cols:
        if col in df.columns:
            insights[col] = compute_distribution_metrics(df[col], "datetime")
    
    return insights


def generate_descriptive_summary(
    df: pd.DataFrame,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    categorical_cols: List[str],
    datetime_cols: List[str]
) -> Dict[str, Any]:
    """
    Generate overall descriptive summary of the dataset.
    
    Args:
        df: Input DataFrame
        continuous_numeric: Continuous numeric columns
        discrete_numeric: Discrete numeric columns
        categorical_cols: Categorical columns
        datetime_cols: Datetime columns
        
    Returns:
        Dictionary with summary statistics
    """
    total_cols = len(df.columns)
    total_rows = len(df)
    
    # Missing value analysis
    missing_by_col = df.isna().sum()
    cols_with_missing = int((missing_by_col > 0).sum())
    total_missing = int(missing_by_col.sum())
    missing_pct = round(float(total_missing / (total_rows * total_cols) * 100), 2)
    
    # Column type breakdown
    column_types = {
        "continuous_numeric": len(continuous_numeric),
        "discrete_numeric": len(discrete_numeric),
        "categorical": len(categorical_cols),
        "datetime": len(datetime_cols),
        "other": total_cols - len(continuous_numeric) - len(discrete_numeric) - len(categorical_cols) - len(datetime_cols)
    }
    
    # Memory usage
    memory_mb = round(float(df.memory_usage(deep=True).sum() / 1024 / 1024), 2)
    
    # Data quality indicators
    duplicate_rows = int(df.duplicated().sum())
    
    summary = {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "column_types": column_types,
        "missing_values": {
            "total_missing_cells": total_missing,
            "columns_with_missing": cols_with_missing,
            "missing_percentage": missing_pct
        },
        "duplicate_rows": duplicate_rows,
        "memory_usage_mb": memory_mb,
        "data_quality_score": _calculate_data_quality_score(df, missing_pct, duplicate_rows)
    }
    
    return summary


def _calculate_data_quality_score(
    df: pd.DataFrame,
    missing_pct: float,
    duplicate_rows: int
) -> Dict[str, Any]:
    """Calculate a simple data quality score."""
    score = 100.0
    issues = []
    
    # Penalize for missing values
    if missing_pct > 30:
        score -= 30
        issues.append("High missing value percentage")
    elif missing_pct > 10:
        score -= 15
        issues.append("Moderate missing values")
    elif missing_pct > 0:
        score -= 5
    
    # Penalize for duplicates
    dup_pct = duplicate_rows / len(df) * 100
    if dup_pct > 20:
        score -= 20
        issues.append("High duplicate row percentage")
    elif dup_pct > 5:
        score -= 10
        issues.append("Some duplicate rows present")
    elif dup_pct > 0:
        score -= 2
    
    # Penalize for constant columns
    constant_cols = sum(df.nunique() <= 1)
    if constant_cols > 0:
        score -= constant_cols * 2
        issues.append(f"{constant_cols} constant column(s)")
    
    score = max(0, min(100, score))
    
    if score >= 80:
        rating = "Good"
    elif score >= 60:
        rating = "Fair"
    elif score >= 40:
        rating = "Poor"
    else:
        rating = "Critical"
    
    return {
        "score": round(score, 1),
        "rating": rating,
        "issues": issues
    }


# ========================
# Legacy-compatible functions
# ========================

def get_numerical_descriptive_df(
    df: pd.DataFrame,
    numeric_cols: List[str]
) -> Dict[str, Dict[str, Any]]:
    """
    Legacy-compatible function for numerical descriptive stats.
    Returns dictionary format matching original implementation.
    """
    return get_numerical_descriptive_stats(df, numeric_cols)


def get_categorical_descriptive_df(
    df: pd.DataFrame,
    categorical_cols: List[str]
) -> List[Dict[str, Any]]:
    """
    Legacy-compatible function for categorical descriptive stats.
    Returns list format matching original implementation.
    """
    return get_categorical_descriptive_stats(df, categorical_cols)


def get_distribution_insights_df(
    df: pd.DataFrame,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    categorical_cols: List[str],
    datetime_cols: List[str] = None
) -> Dict[str, Dict[str, Any]]:
    """
    Legacy-compatible function for distribution insights.
    """
    if datetime_cols is None:
        datetime_cols = []
    
    return get_distribution_insights(
        df,
        continuous_numeric,
        discrete_numeric,
        categorical_cols,
        datetime_cols
    )
