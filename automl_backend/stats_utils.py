"""
AutoML Backend — Statistics Utilities

Provides core statistical computation functions for descriptive and diagnostic analytics.
All functions are pure, deterministic, and return JSON-serializable outputs.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple


def compute_numeric_stats(series: pd.Series) -> Dict[str, Any]:
    """
    Compute comprehensive descriptive statistics for a numeric series.
    
    Args:
        series: Pandas Series with numeric values
        
    Returns:
        Dictionary with statistical measures
    """
    clean = series.dropna()
    
    if clean.empty:
        return None
    
    mean_val = float(clean.mean())
    std_val = float(clean.std())
    
    stats = {
        "mean": round(mean_val, 6),
        "median": round(float(clean.median()), 6),
        "std": round(std_val, 6),
        "min": round(float(clean.min()), 6),
        "max": round(float(clean.max()), 6),
        "skewness": round(float(clean.skew()), 6),
        "kurtosis": round(float(clean.kurtosis()), 6),
        "cv": round(std_val / mean_val, 6) if mean_val != 0 else None,
        "q25": round(float(clean.quantile(0.25)), 6),
        "q75": round(float(clean.quantile(0.75)), 6),
        "count": int(len(clean)),
        "missing": int(series.isna().sum())
    }
    
    return stats


def compute_categorical_stats(series: pd.Series) -> Dict[str, Any]:
    """
    Compute descriptive statistics for a categorical series.
    
    Args:
        series: Pandas Series with categorical values
        
    Returns:
        Dictionary with categorical statistics
    """
    clean = series.dropna()
    
    if clean.empty:
        return None
    
    vc = clean.value_counts()
    probs = vc / vc.sum()
    
    # Shannon entropy
    entropy = float(-np.sum(probs * np.log2(probs + 1e-10)))
    
    # Top categories
    top_categories = []
    for val, count in vc.head(5).items():
        top_categories.append({
            "value": str(val),
            "count": int(count),
            "percent": round(float(count / len(clean) * 100), 2)
        })
    
    stats = {
        "unique_count": int(clean.nunique()),
        "most_common": str(vc.idxmax()),
        "frequency": int(vc.max()),
        "entropy": round(entropy, 4),
        "top_categories": top_categories,
        "dominant_pct": round(float(vc.iloc[0] / len(clean) * 100), 2),
        "count": int(len(clean)),
        "missing": int(series.isna().sum())
    }
    
    return stats


def compute_distribution_metrics(
    series: pd.Series,
    column_type: str
) -> Dict[str, Any]:
    """
    Compute distribution insights for a column based on its type.
    
    Args:
        series: Pandas Series
        column_type: One of 'continuous', 'discrete', 'categorical', 'datetime'
        
    Returns:
        Dictionary with distribution metrics and insights
    """
    clean = series.dropna()
    
    if clean.empty:
        return {"error": "No valid data"}
    
    result = {
        "column_type": column_type,
        "total_count": int(len(series)),
        "valid_count": int(len(clean)),
        "missing_count": int(series.isna().sum()),
        "missing_pct": round(float(series.isna().sum() / len(series) * 100), 2)
    }
    
    if column_type in ["continuous", "discrete"]:
        result.update(_numeric_distribution_metrics(clean, column_type))
    elif column_type == "categorical":
        result.update(_categorical_distribution_metrics(clean))
    elif column_type == "datetime":
        result.update(_datetime_distribution_metrics(clean))
    
    return result


def _numeric_distribution_metrics(series: pd.Series, column_type: str) -> Dict[str, Any]:
    """Compute distribution metrics for numeric columns."""
    q1 = float(series.quantile(0.25))
    q3 = float(series.quantile(0.75))
    iqr = q3 - q1
    
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    
    outliers = ((series < lower_bound) | (series > upper_bound)).sum()
    outlier_pct = float(outliers / len(series) * 100)
    
    skewness = float(series.skew())
    
    # Determine distribution shape
    if abs(skewness) < 0.5:
        shape = "Approximately Symmetric"
    elif skewness > 0:
        shape = "Right-Skewed (Positive)"
    else:
        shape = "Left-Skewed (Negative)"
    
    # Build histogram bins
    if column_type == "continuous":
        hist, bin_edges = np.histogram(series, bins=20)
        histogram = [
            {
                "bin_start": round(float(bin_edges[i]), 4),
                "bin_end": round(float(bin_edges[i + 1]), 4),
                "count": int(hist[i])
            }
            for i in range(len(hist))
        ]
    else:
        # Discrete: use value counts
        vc = series.value_counts().sort_index()
        histogram = [
            {"value": str(val), "count": int(count)}
            for val, count in vc.items()
        ][:30]  # Limit for display
    
    return {
        "q1": round(q1, 4),
        "q3": round(q3, 4),
        "iqr": round(iqr, 4),
        "lower_bound": round(lower_bound, 4),
        "upper_bound": round(upper_bound, 4),
        "outlier_count": int(outliers),
        "outlier_pct": round(outlier_pct, 2),
        "skewness": round(skewness, 4),
        "distribution_shape": shape,
        "histogram": histogram
    }


def _categorical_distribution_metrics(series: pd.Series) -> Dict[str, Any]:
    """Compute distribution metrics for categorical columns."""
    vc = series.value_counts()
    total = len(series)
    
    # Category frequency distribution
    freq_dist = [
        {
            "category": str(cat),
            "count": int(count),
            "percent": round(float(count / total * 100), 2)
        }
        for cat, count in vc.head(20).items()
    ]
    
    # Concentration metrics
    top_1_pct = float(vc.iloc[0] / total * 100) if len(vc) > 0 else 0
    top_3_pct = float(vc.head(3).sum() / total * 100) if len(vc) >= 3 else top_1_pct
    
    # Imbalance detection
    if top_1_pct > 80:
        balance_status = "Highly Imbalanced"
    elif top_1_pct > 60:
        balance_status = "Moderately Imbalanced"
    else:
        balance_status = "Balanced"
    
    return {
        "unique_count": int(series.nunique()),
        "frequency_distribution": freq_dist,
        "top_1_concentration": round(top_1_pct, 2),
        "top_3_concentration": round(top_3_pct, 2),
        "balance_status": balance_status,
        "rare_categories": int((vc / total < 0.01).sum())
    }


def _datetime_distribution_metrics(series: pd.Series) -> Dict[str, Any]:
    """Compute distribution metrics for datetime columns."""
    # Ensure datetime type
    dt_series = pd.to_datetime(series, errors='coerce').dropna()
    
    if dt_series.empty:
        return {"error": "Could not parse datetime values"}
    
    min_date = dt_series.min()
    max_date = dt_series.max()
    date_range = (max_date - min_date).days
    
    # Temporal distribution by period
    monthly_counts = dt_series.dt.to_period('M').value_counts().sort_index()
    monthly_dist = [
        {"period": str(period), "count": int(count)}
        for period, count in monthly_counts.tail(12).items()
    ]
    
    return {
        "min_date": str(min_date),
        "max_date": str(max_date),
        "date_range_days": int(date_range),
        "unique_dates": int(dt_series.dt.date.nunique()),
        "monthly_distribution": monthly_dist,
        "weekday_distribution": dt_series.dt.dayofweek.value_counts().sort_index().to_dict()
    }


def detect_outliers_iqr(
    series: pd.Series,
    multiplier: float = 1.5
) -> Tuple[int, float, List[Any]]:
    """
    Detect outliers using the IQR method.
    
    Args:
        series: Numeric pandas Series
        multiplier: IQR multiplier for bounds (default 1.5)
        
    Returns:
        Tuple of (outlier_count, outlier_percentage, outlier_indices)
    """
    clean = series.dropna()
    
    if clean.empty:
        return 0, 0.0, []
    
    q1 = clean.quantile(0.25)
    q3 = clean.quantile(0.75)
    iqr = q3 - q1
    
    lower = q1 - multiplier * iqr
    upper = q3 + multiplier * iqr
    
    outlier_mask = (clean < lower) | (clean > upper)
    outlier_count = int(outlier_mask.sum())
    outlier_pct = float(outlier_count / len(clean) * 100)
    outlier_indices = clean[outlier_mask].index.tolist()
    
    return outlier_count, outlier_pct, outlier_indices


def compute_normality_metrics(series: pd.Series) -> Dict[str, Any]:
    """
    Compute metrics related to normality assessment.
    
    Args:
        series: Numeric pandas Series
        
    Returns:
        Dictionary with normality indicators
    """
    clean = series.dropna()
    
    if len(clean) < 8:
        return {"error": "Insufficient data for normality assessment"}
    
    skewness = float(clean.skew())
    kurtosis = float(clean.kurtosis())
    
    # Rule of thumb: normal if |skew| < 2 and |kurtosis| < 7
    likely_normal = abs(skewness) < 2 and abs(kurtosis) < 7
    
    return {
        "skewness": round(skewness, 4),
        "kurtosis": round(kurtosis, 4),
        "excess_kurtosis": round(kurtosis, 4),  # pandas kurtosis is excess by default
        "likely_normal": likely_normal,
        "recommendation": (
            "Data appears normally distributed"
            if likely_normal
            else "Consider transformation (log, sqrt, Box-Cox)"
        )
    }
