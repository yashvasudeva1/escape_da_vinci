"""
AutoML Backend — T4: Diagnostic Analytics

Provides correlation analysis, multicollinearity detection, and feature diagnostics.
Helps identify relationships and redundancies in the dataset.

Usage:
    from automl_backend.diagnostic import run_diagnostic_analytics
    
    result = run_diagnostic_analytics(
        df,
        continuous_numeric=['age', 'income', 'score'],
        correlation_thresholds={'pearson': 0.5, 'multicollinearity': 0.8}
    )
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

from .correlation_utils import (
    compute_correlation_matrix,
    get_correlation_pairs,
    detect_multicollinearity,
    compute_vif,
    get_top_correlations
)


def run_diagnostic_analytics(
    df: pd.DataFrame,
    continuous_numeric: List[str],
    discrete_numeric: List[str] = None,
    correlation_thresholds: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Run complete diagnostic analytics for AutoML T4 tab.
    
    Computes:
    - Pearson correlation matrix
    - Spearman correlation pairs (rank-based)
    - Kendall correlation pairs (ordinal)
    - Multicollinearity diagnostics
    - VIF analysis (if sufficient features)
    
    Args:
        df: Input DataFrame
        continuous_numeric: List of continuous numeric column names
        discrete_numeric: Optional list of discrete numeric columns (included in analysis)
        correlation_thresholds: Optional dict with threshold overrides:
            - 'pearson': threshold for Pearson pairs (default 0.5)
            - 'spearman': threshold for Spearman pairs (default 0.5)
            - 'kendall': threshold for Kendall pairs (default 0.4)
            - 'multicollinearity': threshold for multicollinearity (default 0.8)
            
    Returns:
        Dictionary with all diagnostic analytics results:
        {
            "pearson_matrix": {...},
            "pearson_pairs": [...],
            "spearman_pairs": [...],
            "kendall_pairs": [...],
            "multicollinearity": [...],
            "vif_analysis": [...],
            "summary": {...}
        }
    """
    if discrete_numeric is None:
        discrete_numeric = []
    
    # Combine all numeric columns for correlation analysis
    numeric_cols = continuous_numeric + discrete_numeric
    
    # Default thresholds
    thresholds = {
        'pearson': 0.5,
        'spearman': 0.5,
        'kendall': 0.4,
        'multicollinearity': 0.8
    }
    
    if correlation_thresholds:
        thresholds.update(correlation_thresholds)
    
    result = {
        "pearson_matrix": {},
        "pearson_pairs": [],
        "spearman_pairs": [],
        "kendall_pairs": [],
        "multicollinearity": [],
        "vif_analysis": [],
        "summary": {}
    }
    
    if not numeric_cols or len(numeric_cols) < 2:
        result["summary"] = {
            "error": "Insufficient numeric columns for correlation analysis",
            "minimum_required": 2,
            "provided": len(numeric_cols)
        }
        return result
    
    # ========================
    # Pearson Correlation Matrix
    # ========================
    result["pearson_matrix"] = get_pearson_corr_matrix(df, numeric_cols)
    
    # ========================
    # Pearson Correlation Pairs
    # ========================
    result["pearson_pairs"] = get_correlation_pairs(
        df, numeric_cols, method="pearson", threshold=thresholds['pearson']
    )
    
    # ========================
    # Spearman Correlation
    # ========================
    result["spearman_pairs"] = get_spearman_correlation_df(
        df, numeric_cols, threshold=thresholds['spearman']
    )
    
    # ========================
    # Kendall Correlation
    # ========================
    result["kendall_pairs"] = get_kendall_correlation_df(
        df, numeric_cols, threshold=thresholds['kendall']
    )
    
    # ========================
    # Multicollinearity
    # ========================
    result["multicollinearity"] = get_numeric_correlation_diagnostics(
        df, numeric_cols, threshold=thresholds['multicollinearity']
    )
    
    # ========================
    # VIF Analysis (if enough features)
    # ========================
    if len(numeric_cols) >= 3:
        result["vif_analysis"] = compute_vif(df, numeric_cols)
    
    # ========================
    # Summary
    # ========================
    result["summary"] = generate_diagnostic_summary(
        result, numeric_cols, thresholds
    )
    
    return result


def get_pearson_corr_matrix(
    df: pd.DataFrame,
    numeric_cols: List[str]
) -> Dict[str, Any]:
    """
    Compute Pearson correlation matrix.
    
    Args:
        df: Input DataFrame
        numeric_cols: List of numeric column names
        
    Returns:
        Dictionary with correlation matrix in split format
    """
    return compute_correlation_matrix(df, numeric_cols, method="pearson")


def get_spearman_correlation_df(
    df: pd.DataFrame,
    numeric_cols: List[str],
    threshold: float = 0.5
) -> List[Dict[str, Any]]:
    """
    Get Spearman rank correlation pairs above threshold.
    
    Args:
        df: Input DataFrame
        numeric_cols: List of numeric column names
        threshold: Minimum absolute correlation to include
        
    Returns:
        List of correlation pair records
    """
    return get_correlation_pairs(df, numeric_cols, method="spearman", threshold=threshold)


def get_kendall_correlation_df(
    df: pd.DataFrame,
    numeric_cols: List[str],
    threshold: float = 0.4
) -> List[Dict[str, Any]]:
    """
    Get Kendall tau correlation pairs above threshold.
    
    Args:
        df: Input DataFrame
        numeric_cols: List of numeric column names
        threshold: Minimum absolute correlation to include
        
    Returns:
        List of correlation pair records
    """
    return get_correlation_pairs(df, numeric_cols, method="kendall", threshold=threshold)


def get_numeric_correlation_diagnostics(
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
    return detect_multicollinearity(df, numeric_cols, threshold=threshold)


def generate_diagnostic_summary(
    results: Dict[str, Any],
    numeric_cols: List[str],
    thresholds: Dict[str, float]
) -> Dict[str, Any]:
    """
    Generate summary of diagnostic findings.
    
    Args:
        results: Diagnostic analytics results
        numeric_cols: Analyzed numeric columns
        thresholds: Thresholds used for analysis
        
    Returns:
        Dictionary with diagnostic summary
    """
    summary = {
        "analyzed_features": len(numeric_cols),
        "thresholds_used": thresholds,
        "findings": {}
    }
    
    # Correlation findings
    pearson_count = len(results.get("pearson_pairs", []))
    spearman_count = len(results.get("spearman_pairs", []))
    kendall_count = len(results.get("kendall_pairs", []))
    
    summary["findings"]["significant_correlations"] = {
        "pearson": pearson_count,
        "spearman": spearman_count,
        "kendall": kendall_count
    }
    
    # Multicollinearity findings
    multicol = results.get("multicollinearity", [])
    high_multicol = [m for m in multicol if m.get("Severity") == "High"]
    moderate_multicol = [m for m in multicol if m.get("Severity") == "Moderate"]
    
    summary["findings"]["multicollinearity"] = {
        "high_severity": len(high_multicol),
        "moderate_severity": len(moderate_multicol),
        "total_issues": len(multicol)
    }
    
    # VIF findings
    vif = results.get("vif_analysis", [])
    high_vif = [v for v in vif if v.get("Status") == "High"]
    moderate_vif = [v for v in vif if v.get("Status") == "Moderate"]
    
    summary["findings"]["vif"] = {
        "high_vif_features": len(high_vif),
        "moderate_vif_features": len(moderate_vif)
    }
    
    # Recommendations
    recommendations = []
    
    if len(high_multicol) > 0:
        features_to_drop = [m["Feature 2"] for m in high_multicol[:3]]
        recommendations.append({
            "priority": "High",
            "action": "Address multicollinearity",
            "details": f"Consider dropping or combining: {', '.join(features_to_drop)}"
        })
    
    if len(high_vif) > 0:
        recommendations.append({
            "priority": "High",
            "action": "Reduce feature redundancy",
            "details": f"{len(high_vif)} features have VIF > 10"
        })
    
    if pearson_count > len(numeric_cols) * 2:
        recommendations.append({
            "priority": "Medium",
            "action": "Consider dimensionality reduction",
            "details": "Many significant correlations detected - PCA may help"
        })
    
    summary["recommendations"] = recommendations
    
    # Overall health score
    issues = len(high_multicol) * 3 + len(moderate_multicol) * 1 + len(high_vif) * 2
    max_issues = len(numeric_cols) * 3
    health_score = max(0, 100 - (issues / max_issues * 100)) if max_issues > 0 else 100
    
    summary["feature_health_score"] = round(health_score, 1)
    
    return summary


def get_dropped_correlation_features(
    multicollinearity_results: List[Dict[str, Any]]
) -> List[str]:
    """
    Get list of features recommended for dropping due to multicollinearity.
    
    Args:
        multicollinearity_results: Output from multicollinearity detection
        
    Returns:
        List of feature names to consider dropping
    """
    if not multicollinearity_results:
        return []
    
    # Collect Feature 2 from high severity pairs (the one to drop)
    to_drop = set()
    
    for pair in multicollinearity_results:
        if pair.get("Severity") in ["High", "Moderate"]:
            to_drop.add(pair["Feature 2"])
    
    return list(to_drop)


def analyze_feature_relationships(
    df: pd.DataFrame,
    feature: str,
    numeric_cols: List[str]
) -> Dict[str, Any]:
    """
    Analyze relationships of a single feature with all other numeric features.
    
    Args:
        df: Input DataFrame
        feature: Target feature to analyze
        numeric_cols: All numeric columns
        
    Returns:
        Dictionary with feature relationship analysis
    """
    if feature not in df.columns:
        return {"error": f"Feature '{feature}' not found"}
    
    other_cols = [c for c in numeric_cols if c != feature and c in df.columns]
    
    if not other_cols:
        return {"error": "No other numeric columns for comparison"}
    
    relationships = []
    
    for col in other_cols:
        # Compute correlations
        pearson = df[[feature, col]].corr(method="pearson").iloc[0, 1]
        spearman = df[[feature, col]].corr(method="spearman").iloc[0, 1]
        
        if pd.isna(pearson) or pd.isna(spearman):
            continue
        
        relationships.append({
            "feature": col,
            "pearson": round(float(pearson), 4),
            "spearman": round(float(spearman), 4),
            "relationship": "Strong" if abs(pearson) > 0.7 else "Moderate" if abs(pearson) > 0.4 else "Weak"
        })
    
    # Sort by absolute Pearson correlation
    relationships.sort(key=lambda x: abs(x["pearson"]), reverse=True)
    
    return {
        "feature": feature,
        "relationships": relationships,
        "most_correlated": relationships[0]["feature"] if relationships else None,
        "correlation_count": {
            "strong": len([r for r in relationships if r["relationship"] == "Strong"]),
            "moderate": len([r for r in relationships if r["relationship"] == "Moderate"]),
            "weak": len([r for r in relationships if r["relationship"] == "Weak"])
        }
    }
