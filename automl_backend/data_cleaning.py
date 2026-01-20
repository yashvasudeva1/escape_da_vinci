"""
AutoML Backend - Data Cleaning

Provides data quality metrics and dataset cleaning functions.
Handles duplicates, missing values, and outliers.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple, Optional


def get_data_quality_metrics_df(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Compute data quality metrics for each column.
    
    Args:
        df: Input DataFrame
        
    Returns:
        List of quality metrics per column
    """
    rows = []
    n_rows = len(df)
    
    if n_rows == 0:
        return []
    
    duplicate_mask = df.duplicated(keep=False)
    numeric_cols = df.select_dtypes(include=["int64", "float64", "int32", "float32"]).columns
    
    for col in df.columns:
        null_count = int(df[col].isna().sum())
        null_pct = round((null_count / n_rows) * 100, 2)
        
        duplicate_count = int(df.loc[duplicate_mask, col].notna().sum())
        
        outlier_count = 0
        outlier_pct = 0.0
        if col in numeric_cols:
            series = df[col].dropna()
            if len(series) > 0:
                q1 = series.quantile(0.25)
                q3 = series.quantile(0.75)
                iqr = q3 - q1
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                outlier_count = int(((series < lower) | (series > upper)).sum())
                outlier_pct = round((outlier_count / len(series)) * 100, 2)
        
        rows.append({
            "Column": col,
            "Null Count": null_count,
            "Null %": null_pct,
            "Duplicate Rows Involved": duplicate_count,
            "Outlier Count": outlier_count,
            "Outlier %": outlier_pct,
            "Unique Values": int(df[col].nunique()),
            "Data Type": str(df[col].dtype)
        })
    
    return rows


def clean_dataset(
    df: pd.DataFrame,
    null_threshold: float = 0.40,
    remove_duplicates: bool = True,
    handle_nulls: bool = True,
    remove_outliers: bool = True,
    outlier_cols: List[str] = None
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Clean dataset by handling duplicates, nulls, and outliers.
    
    Args:
        df: Input DataFrame
        null_threshold: Maximum null ratio before dropping column
        remove_duplicates: Whether to remove duplicate rows
        handle_nulls: Whether to impute null values
        remove_outliers: Whether to remove outliers
        outlier_cols: Specific columns for outlier removal (None = all numeric)
        
    Returns:
        Tuple of (cleaned DataFrame, cleaning report)
    """
    df_cleaned = df.copy()
    report = {
        "original_rows": len(df),
        "original_cols": len(df.columns),
        "actions": []
    }
    
    if remove_duplicates:
        dup_count = df_cleaned.duplicated().sum()
        if dup_count > 0:
            df_cleaned = df_cleaned.drop_duplicates()
            report["actions"].append({
                "action": "Remove Duplicates",
                "rows_removed": int(dup_count)
            })
    
    if handle_nulls:
        cols_dropped = []
        cols_imputed = []
        
        for col in df_cleaned.columns:
            null_ratio = df_cleaned[col].isna().mean()
            
            if null_ratio > null_threshold:
                continue
            
            if df_cleaned[col].isna().any():
                if pd.api.types.is_numeric_dtype(df_cleaned[col]):
                    median_val = df_cleaned[col].median()
                    df_cleaned[col] = df_cleaned[col].fillna(median_val)
                    cols_imputed.append({"column": col, "method": "median", "value": float(median_val)})
                else:
                    mode_val = df_cleaned[col].mode()
                    if not mode_val.empty:
                        df_cleaned[col] = df_cleaned[col].fillna(mode_val.iloc[0])
                        cols_imputed.append({"column": col, "method": "mode", "value": str(mode_val.iloc[0])})
        
        if cols_imputed:
            report["actions"].append({
                "action": "Impute Missing Values",
                "columns_imputed": len(cols_imputed),
                "details": cols_imputed
            })
    
    if remove_outliers:
        numeric_cols = df_cleaned.select_dtypes(include=["int64", "float64", "int32", "float32"]).columns
        if outlier_cols:
            numeric_cols = [c for c in outlier_cols if c in numeric_cols]
        
        rows_before = len(df_cleaned)
        
        for col in numeric_cols:
            q1 = df_cleaned[col].quantile(0.25)
            q3 = df_cleaned[col].quantile(0.75)
            iqr = q3 - q1
            
            if iqr == 0:
                continue
            
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            
            df_cleaned = df_cleaned[
                (df_cleaned[col] >= lower) &
                (df_cleaned[col] <= upper)
            ]
        
        rows_removed = rows_before - len(df_cleaned)
        if rows_removed > 0:
            report["actions"].append({
                "action": "Remove Outliers",
                "rows_removed": int(rows_removed),
                "columns_checked": list(numeric_cols)
            })
    
    report["final_rows"] = len(df_cleaned)
    report["final_cols"] = len(df_cleaned.columns)
    report["rows_removed_total"] = report["original_rows"] - report["final_rows"]
    report["removal_percentage"] = round(
        (report["rows_removed_total"] / report["original_rows"]) * 100, 2
    ) if report["original_rows"] > 0 else 0
    
    return df_cleaned, report


def get_cleaning_recommendations(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Generate cleaning recommendations based on data quality analysis.
    
    Args:
        df: Input DataFrame
        
    Returns:
        List of cleaning recommendations
    """
    recommendations = []
    n_rows = len(df)
    
    if n_rows == 0:
        return [{"priority": "High", "action": "Dataset is empty", "reason": "No data to process"}]
    
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        dup_pct = (dup_count / n_rows) * 100
        recommendations.append({
            "priority": "High" if dup_pct > 10 else "Medium",
            "action": "Remove duplicate rows",
            "reason": f"{dup_count} duplicates found ({dup_pct:.1f}%)",
            "impact": f"Will remove {dup_count} rows"
        })
    
    for col in df.columns:
        null_pct = df[col].isna().mean() * 100
        
        if null_pct > 50:
            recommendations.append({
                "priority": "High",
                "action": f"Consider dropping column '{col}'",
                "reason": f"{null_pct:.1f}% missing values",
                "impact": "Column may not be useful for modeling"
            })
        elif null_pct > 10:
            recommendations.append({
                "priority": "Medium",
                "action": f"Impute missing values in '{col}'",
                "reason": f"{null_pct:.1f}% missing values",
                "impact": "Use median (numeric) or mode (categorical)"
            })
    
    numeric_cols = df.select_dtypes(include=["number"]).columns
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 10:
            continue
        
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        
        if iqr == 0:
            continue
        
        outlier_count = ((series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)).sum()
        outlier_pct = (outlier_count / len(series)) * 100
        
        if outlier_pct > 5:
            recommendations.append({
                "priority": "Medium",
                "action": f"Handle outliers in '{col}'",
                "reason": f"{outlier_count} outliers ({outlier_pct:.1f}%)",
                "impact": "Consider capping, removing, or transforming"
            })
    
    for col in df.columns:
        if df[col].nunique() == 1:
            recommendations.append({
                "priority": "High",
                "action": f"Drop constant column '{col}'",
                "reason": "Only one unique value",
                "impact": "Provides no predictive information"
            })
    
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 3))
    
    return recommendations


def get_distribution_insights(
    df: pd.DataFrame,
    column_name: str,
    column_type: str
) -> Dict[str, Any]:
    """
    Get distribution insights for a specific column.
    
    Args:
        df: Input DataFrame
        column_name: Column to analyze
        column_type: Type of column ('continuous', 'discrete', 'categorical', 'datetime')
        
    Returns:
        Dictionary with distribution insights
    """
    if column_name not in df.columns:
        return {"error": f"Column '{column_name}' not found"}
    
    if column_type == "continuous":
        return _continuous_numeric_distribution(df, column_name)
    elif column_type == "discrete":
        return _discrete_numeric_distribution(df, column_name)
    elif column_type == "categorical":
        return _categorical_distribution(df, column_name)
    elif column_type == "datetime":
        return _datetime_distribution(df, column_name)
    else:
        return {"error": "Unsupported column type"}


def _continuous_numeric_distribution(df: pd.DataFrame, column_name: str) -> Dict[str, Any]:
    """Compute distribution insights for continuous numeric column."""
    col = df[column_name].dropna()
    
    if len(col) < 3:
        return {"column": column_name, "status": "Insufficient data"}
    
    skewness = float(col.skew())
    
    if abs(skewness) > 1:
        dist_type = "Highly Right Skewed" if skewness > 0 else "Highly Left Skewed"
        suggestion = "Apply log or sqrt transformation" if skewness > 0 else "Apply square or exponential transformation"
    elif abs(skewness) > 0.5:
        dist_type = "Moderately Right Skewed" if skewness > 0 else "Moderately Left Skewed"
        suggestion = "Apply log or Box-Cox transformation" if skewness > 0 else "Apply power transformation"
    else:
        dist_type = "Approximately Normal"
        suggestion = "No transformation required"
    
    return {
        "column": column_name,
        "skewness": round(skewness, 4),
        "distribution_type": dist_type,
        "normalization_suggestion": suggestion,
        "mean": round(float(col.mean()), 4),
        "std": round(float(col.std()), 4),
        "min": round(float(col.min()), 4),
        "max": round(float(col.max()), 4)
    }


def _discrete_numeric_distribution(df: pd.DataFrame, column_name: str) -> Dict[str, Any]:
    """Compute distribution insights for discrete numeric column."""
    col = df[column_name].dropna()
    
    if len(col) == 0:
        return {"column": column_name, "status": "No data"}
    
    value_counts = col.value_counts()
    top_pct = (value_counts.iloc[0] / len(col)) * 100
    
    if top_pct > 70:
        balance = "Highly Concentrated"
        suggestion = "Consider treating as categorical"
    elif top_pct > 40:
        balance = "Moderately Concentrated"
        suggestion = "Check if ordinal encoding is appropriate"
    else:
        balance = "Well Distributed"
        suggestion = "No action required"
    
    return {
        "column": column_name,
        "unique_values": int(col.nunique()),
        "dominant_value_pct": round(top_pct, 2),
        "distribution_type": balance,
        "modeling_suggestion": suggestion,
        "value_distribution": value_counts.head(10).to_dict()
    }


def _categorical_distribution(df: pd.DataFrame, column_name: str) -> Dict[str, Any]:
    """Compute distribution insights for categorical column."""
    col = df[column_name].dropna()
    
    if len(col) == 0:
        return {"column": column_name, "status": "No data"}
    
    value_counts = col.value_counts()
    top_pct = (value_counts.iloc[0] / len(col)) * 100
    
    if top_pct > 70:
        balance = "Highly Dominated"
        suggestion = "Group rare categories or apply target encoding"
    elif top_pct > 40:
        balance = "Moderately Dominated"
        suggestion = "Consider frequency encoding"
    else:
        balance = "Well Balanced"
        suggestion = "One-hot encoding is safe"
    
    unique_count = col.nunique()
    if unique_count > 20:
        suggestion = "High cardinality - use target encoding or hashing"
    
    return {
        "column": column_name,
        "unique_categories": unique_count,
        "dominant_category_pct": round(top_pct, 2),
        "category_balance": balance,
        "encoding_suggestion": suggestion,
        "top_categories": value_counts.head(10).to_dict()
    }


def _datetime_distribution(df: pd.DataFrame, column_name: str) -> Dict[str, Any]:
    """Compute distribution insights for datetime column."""
    col = pd.to_datetime(df[column_name], errors="coerce").dropna()
    
    if len(col) == 0:
        return {"column": column_name, "status": "No valid datetime values"}
    
    month_counts = (
        col.dt.month_name()
        .value_counts()
        .reindex([
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ])
        .fillna(0)
        .astype(int)
    )
    
    peak_month = month_counts.idxmax()
    
    return {
        "column": column_name,
        "min_date": str(col.min()),
        "max_date": str(col.max()),
        "date_range_days": int((col.max() - col.min()).days),
        "unique_dates": int(col.dt.date.nunique()),
        "peak_activity_month": peak_month,
        "monthly_distribution": month_counts.to_dict()
    }
