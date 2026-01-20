"""
AutoML Backend — Correlation Utilities

Provides correlation analysis functions for diagnostic analytics.
Supports Pearson, Spearman, and Kendall correlation methods.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple


def compute_correlation_matrix(
    df: pd.DataFrame,
    numeric_cols: List[str],
    method: str = "pearson"
) -> Dict[str, Any]:
    """
    Compute correlation matrix for numeric columns.
    
    Args:
        df: Input DataFrame
        numeric_cols: List of numeric column names
        method: Correlation method ('pearson', 'spearman', 'kendall')
        
    Returns:
        Dictionary with matrix data in split format
    """
    if not numeric_cols or len(numeric_cols) < 2:
        return {
            "columns": [],
            "index": [],
            "data": []
        }
    
    valid_cols = [col for col in numeric_cols if col in df.columns]
    
    if len(valid_cols) < 2:
        return {
            "columns": [],
            "index": [],
            "data": []
        }
    
    corr_matrix = df[valid_cols].corr(method=method)
    
    # Handle NaN values
    corr_matrix = corr_matrix.fillna(0)
    
    return {
        "columns": corr_matrix.columns.tolist(),
        "index": corr_matrix.index.tolist(),
        "data": [[round(float(val), 4) for val in row] for row in corr_matrix.values]
    }


def get_correlation_pairs(
    df: pd.DataFrame,
    numeric_cols: List[str],
    method: str = "pearson",
    threshold: float = 0.5
) -> List[Dict[str, Any]]:
    """
    Extract significant correlation pairs above threshold.
    
    Args:
        df: Input DataFrame
        numeric_cols: List of numeric column names
        method: Correlation method ('pearson', 'spearman', 'kendall')
        threshold: Minimum absolute correlation to include
        
    Returns:
        List of correlation pair records
    """
    if not numeric_cols or len(numeric_cols) < 2:
        return []
    
    valid_cols = [col for col in numeric_cols if col in df.columns]
    
    if len(valid_cols) < 2:
        return []
    
    corr_matrix = df[valid_cols].corr(method=method)
    pairs = []
    
    for i in range(len(valid_cols)):
        for j in range(i + 1, len(valid_cols)):
            corr_val = corr_matrix.iloc[i, j]
            
            # Skip NaN correlations
            if pd.isna(corr_val):
                continue
            
            if abs(corr_val) >= threshold:
                strength = _classify_correlation_strength(corr_val)
                relationship = "Positive" if corr_val > 0 else "Negative"
                
                pairs.append({
                    "Feature 1": valid_cols[i],
                    "Feature 2": valid_cols[j],
                    f"{method.title()} Correlation": round(float(corr_val), 4),
                    "Strength": strength,
                    "Relationship Type": relationship,
                    "Interpretation": _interpret_correlation(corr_val, valid_cols[i], valid_cols[j])
                })
    
    # Sort by absolute correlation descending
    pairs.sort(key=lambda x: abs(x[f"{method.title()} Correlation"]), reverse=True)
    
    return pairs


def _classify_correlation_strength(corr_val: float) -> str:
    """Classify correlation strength based on absolute value."""
    abs_corr = abs(corr_val)
    
    if abs_corr >= 0.9:
        return "Very Strong"
    elif abs_corr >= 0.7:
        return "Strong"
    elif abs_corr >= 0.5:
        return "Moderate"
    elif abs_corr >= 0.3:
        return "Weak"
    else:
        return "Very Weak"


def _interpret_correlation(corr_val: float, feat1: str, feat2: str) -> str:
    """Generate human-readable interpretation of correlation."""
    abs_corr = abs(corr_val)
    direction = "increases" if corr_val > 0 else "decreases"
    
    if abs_corr >= 0.8:
        return f"As {feat1} {direction}, {feat2} strongly follows the same pattern"
    elif abs_corr >= 0.5:
        return f"Moderate linear relationship: {feat1} and {feat2} move together"
    else:
        return f"Weak linear relationship between {feat1} and {feat2}"


def detect_multicollinearity(
    df: pd.DataFrame,
    numeric_cols: List[str],
    threshold: float = 0.8
) -> List[Dict[str, Any]]:
    """
    Detect multicollinearity issues in numeric features.
    
    Args:
        df: Input DataFrame
        numeric_cols: List of numeric column names
        threshold: Correlation threshold for multicollinearity detection
        
    Returns:
        List of multicollinearity diagnostic records
    """
    if not numeric_cols or len(numeric_cols) < 2:
        return []
    
    valid_cols = [col for col in numeric_cols if col in df.columns]
    
    if len(valid_cols) < 2:
        return []
    
    corr_matrix = df[valid_cols].corr(method="pearson")
    diagnostics = []
    
    for i in range(len(valid_cols)):
        for j in range(i + 1, len(valid_cols)):
            corr_val = corr_matrix.iloc[i, j]
            
            # Skip NaN correlations
            if pd.isna(corr_val):
                continue
            
            if abs(corr_val) >= threshold:
                if abs(corr_val) >= 0.9:
                    severity = "High"
                    action = "Drop one feature or apply PCA/dimensionality reduction"
                elif abs(corr_val) >= 0.8:
                    severity = "Moderate"
                    action = "Consider dropping one or combining features"
                else:
                    severity = "Low"
                    action = "Monitor for redundancy"
                
                diagnostics.append({
                    "Feature 1": valid_cols[i],
                    "Feature 2": valid_cols[j],
                    "Pearson Correlation": round(float(corr_val), 4),
                    "Severity": severity,
                    "Suggested Action": action,
                    "Impact": _describe_multicollinearity_impact(severity)
                })
    
    # Sort by absolute correlation descending
    diagnostics.sort(key=lambda x: abs(x["Pearson Correlation"]), reverse=True)
    
    return diagnostics


def _describe_multicollinearity_impact(severity: str) -> str:
    """Describe the impact of multicollinearity based on severity."""
    impacts = {
        "High": "Can destabilize model coefficients and inflate variance",
        "Moderate": "May affect feature importance interpretation",
        "Low": "Minimal impact, but watch for model complexity"
    }
    return impacts.get(severity, "Unknown impact")


def compute_vif(
    df: pd.DataFrame,
    numeric_cols: List[str]
) -> List[Dict[str, Any]]:
    """
    Compute Variance Inflation Factor for multicollinearity detection.
    
    VIF > 5 indicates moderate multicollinearity
    VIF > 10 indicates high multicollinearity
    
    Args:
        df: Input DataFrame
        numeric_cols: List of numeric column names
        
    Returns:
        List of VIF diagnostic records
    """
    if not numeric_cols or len(numeric_cols) < 2:
        return []
    
    valid_cols = [col for col in numeric_cols if col in df.columns]
    
    if len(valid_cols) < 2:
        return []
    
    # Drop rows with any NaN in numeric columns
    clean_df = df[valid_cols].dropna()
    
    if len(clean_df) < len(valid_cols) + 1:
        return [{"error": "Insufficient clean data for VIF calculation"}]
    
    vif_results = []
    
    try:
        from numpy.linalg import LinAlgError
        
        for i, col in enumerate(valid_cols):
            # Prepare X (other features) and y (current feature)
            other_cols = [c for c in valid_cols if c != col]
            
            if not other_cols:
                continue
            
            X = clean_df[other_cols].values
            y = clean_df[col].values
            
            # Add constant for intercept
            X_with_const = np.column_stack([np.ones(len(X)), X])
            
            try:
                # Compute R-squared using OLS
                beta = np.linalg.lstsq(X_with_const, y, rcond=None)[0]
                y_pred = X_with_const @ beta
                ss_res = np.sum((y - y_pred) ** 2)
                ss_tot = np.sum((y - np.mean(y)) ** 2)
                r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
                
                # VIF = 1 / (1 - R^2)
                vif = 1 / (1 - r_squared) if r_squared < 1 else float('inf')
                
                if vif > 10:
                    status = "High"
                elif vif > 5:
                    status = "Moderate"
                else:
                    status = "Acceptable"
                
                vif_results.append({
                    "Feature": col,
                    "VIF": round(float(vif), 2) if vif != float('inf') else 999.99,
                    "R_Squared": round(float(r_squared), 4),
                    "Status": status,
                    "Recommendation": (
                        "Consider removing" if status == "High"
                        else "Monitor carefully" if status == "Moderate"
                        else "No action needed"
                    )
                })
            except (LinAlgError, ValueError):
                vif_results.append({
                    "Feature": col,
                    "VIF": None,
                    "Status": "Could not compute",
                    "Recommendation": "Check for constant or perfectly collinear features"
                })
    except ImportError:
        return [{"error": "NumPy linear algebra required for VIF computation"}]
    
    # Sort by VIF descending
    vif_results.sort(key=lambda x: x.get("VIF") or 0, reverse=True)
    
    return vif_results


def get_top_correlations(
    df: pd.DataFrame,
    numeric_cols: List[str],
    n: int = 10,
    method: str = "pearson"
) -> List[Dict[str, Any]]:
    """
    Get top N strongest correlations.
    
    Args:
        df: Input DataFrame
        numeric_cols: List of numeric column names
        n: Number of top correlations to return
        method: Correlation method
        
    Returns:
        List of top correlation records
    """
    pairs = get_correlation_pairs(df, numeric_cols, method=method, threshold=0.0)
    
    # Sort by absolute correlation
    pairs.sort(key=lambda x: abs(x[f"{method.title()} Correlation"]), reverse=True)
    
    return pairs[:n]
