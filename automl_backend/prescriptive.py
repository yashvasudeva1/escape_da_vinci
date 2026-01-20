"""
AutoML Backend — T6: Prescriptive Analytics

Provides actionable recommendations for data preprocessing and feature engineering.
Generates prescriptive insights for improving model performance.

Usage:
    from automl_backend.prescriptive import run_prescriptive_analytics
    
    result = run_prescriptive_analytics(
        df,
        continuous_numeric=['age', 'income'],
        discrete_numeric=['quantity'],
        categorical_cols=['category'],
        corr_diag_df=diagnostic_results['multicollinearity']
    )
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Union


def run_prescriptive_analytics(
    df: pd.DataFrame,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    categorical_cols: List[str],
    corr_diag_df: Union[List[Dict[str, Any]], pd.DataFrame] = None,
    skew_threshold: float = 0.75,
    outlier_threshold_pct: float = 5.0,
    dominance_threshold: float = 70.0,
    rare_threshold: float = 5.0
) -> Dict[str, Any]:
    """
    Run complete prescriptive analytics for AutoML T6 tab.
    
    Generates actionable recommendations for:
    - Numeric feature transformations
    - Categorical encoding strategies
    - Correlation-based feature selection
    - Dataset-level improvements
    
    Args:
        df: Input DataFrame
        continuous_numeric: List of continuous numeric columns
        discrete_numeric: List of discrete numeric columns
        categorical_cols: List of categorical columns
        corr_diag_df: Multicollinearity diagnostics from T4
        skew_threshold: Threshold for skewness-based recommendations
        outlier_threshold_pct: Threshold for outlier percentage warnings
        dominance_threshold: Threshold for dominant category detection
        rare_threshold: Threshold for rare category detection
        
    Returns:
        Dictionary with all prescriptive analytics results:
        {
            "numeric_recommendations": [...],
            "categorical_recommendations": [...],
            "correlation_actions": [...],
            "dataset_actions": [...],
            "feature_engineering": [...],
            "summary": {...}
        }
    """
    result = {
        "numeric_recommendations": [],
        "categorical_recommendations": [],
        "correlation_actions": [],
        "dataset_actions": [],
        "feature_engineering": [],
        "summary": {}
    }
    
    # ========================
    # Numeric Recommendations
    # ========================
    result["numeric_recommendations"] = numeric_prescriptive_df(
        df,
        continuous_numeric,
        discrete_numeric,
        skew_threshold=skew_threshold,
        outlier_threshold_pct=outlier_threshold_pct
    )
    
    # ========================
    # Categorical Recommendations
    # ========================
    result["categorical_recommendations"] = categorical_prescriptive_df(
        df,
        categorical_cols,
        dominance_threshold=dominance_threshold,
        rare_threshold=rare_threshold
    )
    
    # ========================
    # Correlation Actions
    # ========================
    result["correlation_actions"] = correlation_prescriptive_df(corr_diag_df)
    
    # ========================
    # Dataset Actions
    # ========================
    result["dataset_actions"] = dataset_prescriptive_summary(df)
    
    # ========================
    # Feature Engineering Suggestions
    # ========================
    result["feature_engineering"] = generate_feature_engineering_suggestions(
        df,
        continuous_numeric,
        discrete_numeric,
        categorical_cols
    )
    
    # ========================
    # Summary
    # ========================
    result["summary"] = generate_prescriptive_summary(result)
    
    return result


def numeric_prescriptive_df(
    df: pd.DataFrame,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    skew_threshold: float = 0.75,
    outlier_threshold_pct: float = 5.0
) -> List[Dict[str, Any]]:
    """
    Generate prescriptive recommendations for numeric columns.
    
    Args:
        df: Input DataFrame
        continuous_numeric: Continuous numeric columns
        discrete_numeric: Discrete numeric columns
        skew_threshold: Threshold for skewness warnings
        outlier_threshold_pct: Threshold for outlier percentage warnings
        
    Returns:
        List of recommendation records
    """
    recommendations = []
    numeric_cols = continuous_numeric + discrete_numeric
    
    for col in numeric_cols:
        if col not in df.columns:
            continue
        
        series = df[col].dropna()
        
        if series.empty:
            recommendations.append({
                "Column": col,
                "Type": "Continuous Numeric" if col in continuous_numeric else "Discrete Numeric",
                "Issue": "All Missing",
                "Skewness": None,
                "Outlier %": None,
                "Recommended Action": "Drop or Impute",
                "Rationale": "Column contains no valid data",
                "Priority": "High"
            })
            continue
        
        # Calculate metrics
        skewness = float(series.skew())
        
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        
        if iqr > 0:
            outliers = ((series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)).sum()
            outlier_pct = float(outliers / len(series) * 100)
        else:
            outlier_pct = 0.0
        
        cv = float(series.std() / series.mean()) if series.mean() != 0 else None
        
        # Determine recommendation
        issues = []
        actions = []
        rationales = []
        priority = "Low"
        
        # Check skewness
        if abs(skewness) > 2:
            issues.append("Highly Skewed")
            actions.append("Apply log or Box-Cox transformation")
            rationales.append(f"Skewness of {skewness:.2f} may affect model")
            priority = "High"
        elif abs(skewness) > skew_threshold:
            issues.append("Moderately Skewed")
            actions.append("Consider sqrt or log transformation")
            rationales.append(f"Skewness of {skewness:.2f} detected")
            if priority == "Low":
                priority = "Medium"
        
        # Check outliers
        if outlier_pct > 10:
            issues.append("Many Outliers")
            actions.append("Cap outliers or use robust scaler")
            rationales.append(f"{outlier_pct:.1f}% outliers detected")
            priority = "High"
        elif outlier_pct > outlier_threshold_pct:
            issues.append("Outliers Present")
            actions.append("Consider outlier treatment")
            rationales.append(f"{outlier_pct:.1f}% outliers detected")
            if priority == "Low":
                priority = "Medium"
        
        # Check variability
        if cv and cv > 2:
            issues.append("High Variability")
            rationales.append(f"Coefficient of variation: {cv:.2f}")
        
        # Check for constant or near-constant
        if series.nunique() == 1:
            issues = ["Constant Value"]
            actions = ["Drop column"]
            rationales = ["No variance - provides no information"]
            priority = "High"
        elif series.nunique() <= 3 and col in continuous_numeric:
            issues.append("Low Cardinality")
            actions.append("Consider as categorical")
            rationales.append(f"Only {series.nunique()} unique values")
        
        # Default if no issues
        if not issues:
            issues = ["Healthy"]
            actions = ["Standard scaling"]
            rationales = ["Normal distribution characteristics"]
        
        recommendations.append({
            "Column": col,
            "Type": "Continuous Numeric" if col in continuous_numeric else "Discrete Numeric",
            "Issue": "; ".join(issues),
            "Skewness": round(skewness, 3),
            "Outlier %": round(outlier_pct, 2),
            "CV": round(cv, 3) if cv else None,
            "Recommended Action": "; ".join(actions),
            "Rationale": "; ".join(rationales),
            "Priority": priority
        })
    
    # Sort by priority
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["Priority"], 3))
    
    return recommendations


def categorical_prescriptive_df(
    df: pd.DataFrame,
    categorical_cols: List[str],
    dominance_threshold: float = 70.0,
    rare_threshold: float = 5.0
) -> List[Dict[str, Any]]:
    """
    Generate prescriptive recommendations for categorical columns.
    
    Args:
        df: Input DataFrame
        categorical_cols: Categorical columns
        dominance_threshold: Threshold for dominant category (%)
        rare_threshold: Threshold for rare category (%)
        
    Returns:
        List of recommendation records
    """
    recommendations = []
    
    for col in categorical_cols:
        if col not in df.columns:
            continue
        
        series = df[col].dropna()
        
        if series.empty:
            recommendations.append({
                "Column": col,
                "Unique Values": 0,
                "Issue": "All Missing",
                "Dominant %": None,
                "Rare Category %": None,
                "Recommended Encoding": "Drop",
                "Rationale": "Column contains no valid data",
                "Priority": "High"
            })
            continue
        
        vc = series.value_counts()
        total = len(series)
        unique_count = series.nunique()
        
        dominant_pct = float(vc.iloc[0] / total * 100)
        
        # Calculate rare category percentage
        rare_mask = vc / total < (rare_threshold / 100)
        rare_pct = float(vc[rare_mask].sum() / total * 100)
        
        # Determine recommendation
        issues = []
        priority = "Low"
        
        # Check for dominant category
        if dominant_pct > 95:
            issues.append("Near-constant")
            encoding = "Consider dropping"
            rationale = "Single category dominates - minimal information"
            priority = "High"
        elif dominant_pct > dominance_threshold:
            issues.append("Highly Dominant Category")
            encoding = "Target or Frequency Encoding"
            rationale = f"{dominant_pct:.1f}% samples in one category"
            priority = "Medium"
        # Check rare categories
        elif rare_pct > 30:
            issues.append("Many Rare Categories")
            encoding = "Group rare categories then encode"
            rationale = f"{rare_pct:.1f}% in rare categories"
            priority = "Medium"
        elif rare_pct > 10:
            issues.append("Some Rare Categories")
            encoding = "Consider grouping rare categories"
            rationale = f"{rare_pct:.1f}% in rare categories"
        # Check cardinality
        elif unique_count == 2:
            issues.append("Binary")
            encoding = "Binary Encoding (0/1)"
            rationale = "Two categories - simple encoding"
        elif unique_count <= 10:
            issues.append("Low Cardinality")
            encoding = "One-Hot Encoding"
            rationale = f"{unique_count} categories - manageable expansion"
        elif unique_count <= 50:
            issues.append("Moderate Cardinality")
            encoding = "Target Encoding or Ordinal Encoding"
            rationale = f"{unique_count} categories - one-hot may be too sparse"
        else:
            issues.append("High Cardinality")
            encoding = "Target Encoding or Hashing"
            rationale = f"{unique_count} categories - embedding or hashing recommended"
            priority = "Medium"
        
        if not issues:
            issues = ["Normal"]
        
        recommendations.append({
            "Column": col,
            "Unique Values": unique_count,
            "Issue": "; ".join(issues),
            "Dominant %": round(dominant_pct, 2),
            "Rare Category %": round(rare_pct, 2),
            "Recommended Encoding": encoding,
            "Rationale": rationale,
            "Priority": priority
        })
    
    # Sort by priority
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["Priority"], 3))
    
    return recommendations


def correlation_prescriptive_df(
    corr_diag_df: Union[List[Dict[str, Any]], pd.DataFrame, None]
) -> List[Dict[str, Any]]:
    """
    Generate prescriptive actions for correlated features.
    
    Args:
        corr_diag_df: Multicollinearity diagnostics from T4
        
    Returns:
        List of correlation action records
    """
    if corr_diag_df is None:
        return []
    
    # Convert to list if DataFrame
    if isinstance(corr_diag_df, pd.DataFrame):
        if corr_diag_df.empty:
            return []
        corr_diag_df = corr_diag_df.to_dict('records')
    
    if not corr_diag_df:
        return []
    
    actions = []
    
    for row in corr_diag_df:
        feature_1 = row.get("Feature 1", "")
        feature_2 = row.get("Feature 2", "")
        correlation = row.get("Pearson Correlation", 0)
        severity = row.get("Severity", "Low")
        
        if severity == "High":
            action = "Drop one feature"
            rationale = f"High correlation ({correlation:.3f}) with {feature_1}"
            priority = "High"
        elif severity == "Moderate":
            action = "Consider PCA or feature combination"
            rationale = f"Moderate correlation ({correlation:.3f}) with {feature_1}"
            priority = "Medium"
        else:
            action = "Monitor"
            rationale = f"Low correlation with {feature_1}"
            priority = "Low"
        
        actions.append({
            "Feature to Consider": feature_2,
            "Correlated With": feature_1,
            "Correlation": round(float(correlation), 4),
            "Severity": severity,
            "Recommended Action": action,
            "Rationale": rationale,
            "Priority": priority
        })
    
    return actions


def dataset_prescriptive_summary(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Generate dataset-level prescriptive recommendations.
    
    Args:
        df: Input DataFrame
        
    Returns:
        List of dataset action records
    """
    actions = []
    
    # Check for duplicates
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        dup_pct = dup_count / len(df) * 100
        actions.append({
            "Issue": "Duplicate Rows",
            "Count": int(dup_count),
            "Percentage": round(float(dup_pct), 2),
            "Action": "Drop Duplicates",
            "Rationale": "Duplicate rows can bias model training",
            "Priority": "High" if dup_pct > 10 else "Medium"
        })
    
    # Check missing values
    missing_pct = df.isna().mean().mean() * 100
    if missing_pct > 30:
        actions.append({
            "Issue": "High Missing Values",
            "Count": int(df.isna().sum().sum()),
            "Percentage": round(float(missing_pct), 2),
            "Action": "Review imputation strategy or drop columns",
            "Rationale": "Excessive missing data reduces model reliability",
            "Priority": "High"
        })
    elif missing_pct > 10:
        actions.append({
            "Issue": "Moderate Missing Values",
            "Count": int(df.isna().sum().sum()),
            "Percentage": round(float(missing_pct), 2),
            "Action": "Apply appropriate imputation",
            "Rationale": "Missing values need handling before modeling",
            "Priority": "Medium"
        })
    
    # Check feature to sample ratio
    n_features = len(df.columns)
    n_samples = len(df)
    
    if n_features > n_samples:
        actions.append({
            "Issue": "More Features Than Samples",
            "Count": n_features,
            "Percentage": round(float(n_features / n_samples * 100), 2),
            "Action": "Apply feature selection or dimensionality reduction",
            "Rationale": "High-dimensional data prone to overfitting",
            "Priority": "High"
        })
    elif n_features > n_samples * 0.3:
        actions.append({
            "Issue": "High Feature-to-Sample Ratio",
            "Count": n_features,
            "Percentage": round(float(n_features / n_samples * 100), 2),
            "Action": "Consider feature selection",
            "Rationale": "Many features relative to samples",
            "Priority": "Medium"
        })
    
    # Check for constant columns
    constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
    if constant_cols:
        actions.append({
            "Issue": "Constant Columns",
            "Count": len(constant_cols),
            "Columns": constant_cols[:5],  # Show first 5
            "Action": "Drop constant columns",
            "Rationale": "No variance - provide no predictive value",
            "Priority": "High"
        })
    
    # Check for ID-like columns
    id_like = []
    for col in df.columns:
        if df[col].nunique() == len(df):
            if col.lower() in ['id', 'index', 'key'] or 'id' in col.lower():
                id_like.append(col)
    
    if id_like:
        actions.append({
            "Issue": "ID-like Columns",
            "Count": len(id_like),
            "Columns": id_like,
            "Action": "Exclude from features",
            "Rationale": "Unique identifiers should not be used as features",
            "Priority": "High"
        })
    
    # Sample size recommendation
    if n_samples < 100:
        actions.append({
            "Issue": "Small Sample Size",
            "Count": n_samples,
            "Action": "Use simple models, cross-validation, avoid overfitting",
            "Rationale": "Limited data requires careful model selection",
            "Priority": "Medium"
        })
    
    return actions


def generate_feature_engineering_suggestions(
    df: pd.DataFrame,
    continuous_numeric: List[str],
    discrete_numeric: List[str],
    categorical_cols: List[str]
) -> List[Dict[str, Any]]:
    """
    Generate feature engineering suggestions.
    
    Args:
        df: Input DataFrame
        continuous_numeric: Continuous numeric columns
        discrete_numeric: Discrete numeric columns
        categorical_cols: Categorical columns
        
    Returns:
        List of feature engineering suggestions
    """
    suggestions = []
    
    # Polynomial features for top numeric columns
    if len(continuous_numeric) >= 2:
        suggestions.append({
            "Type": "Polynomial Features",
            "Scope": "Top numeric features",
            "Description": "Create squared and interaction terms",
            "Example": f"{continuous_numeric[0]}^2, {continuous_numeric[0]}*{continuous_numeric[1] if len(continuous_numeric) > 1 else ''}",
            "Impact": "Medium",
            "Complexity": "Low"
        })
    
    # Log transform for skewed features
    skewed_cols = []
    for col in continuous_numeric:
        if col in df.columns:
            if abs(df[col].skew()) > 1:
                skewed_cols.append(col)
    
    if skewed_cols:
        suggestions.append({
            "Type": "Log Transformation",
            "Scope": f"{len(skewed_cols)} skewed features",
            "Description": "Apply log(1+x) to reduce skewness",
            "Columns": skewed_cols[:5],
            "Impact": "High",
            "Complexity": "Low"
        })
    
    # Binning for continuous
    if continuous_numeric:
        suggestions.append({
            "Type": "Binning/Discretization",
            "Scope": "Continuous features",
            "Description": "Create buckets for continuous values",
            "Example": f"Bin {continuous_numeric[0]} into quartiles",
            "Impact": "Low-Medium",
            "Complexity": "Low"
        })
    
    # Categorical interactions
    if len(categorical_cols) >= 2:
        suggestions.append({
            "Type": "Categorical Interactions",
            "Scope": "Categorical pairs",
            "Description": "Combine categorical features",
            "Example": f"{categorical_cols[0]}_{categorical_cols[1]}",
            "Impact": "Medium",
            "Complexity": "Low"
        })
    
    # Ratio features
    if len(continuous_numeric) >= 2:
        suggestions.append({
            "Type": "Ratio Features",
            "Scope": "Related numeric pairs",
            "Description": "Create ratio features for related columns",
            "Example": f"{continuous_numeric[0]} / {continuous_numeric[1]}",
            "Impact": "Medium",
            "Complexity": "Low"
        })
    
    return suggestions


def generate_prescriptive_summary(results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate summary of prescriptive recommendations.
    
    Args:
        results: All prescriptive analytics results
        
    Returns:
        Summary dictionary
    """
    summary = {
        "total_recommendations": 0,
        "high_priority": 0,
        "medium_priority": 0,
        "low_priority": 0,
        "categories": {}
    }
    
    # Count recommendations by priority
    for key in ["numeric_recommendations", "categorical_recommendations", 
                "correlation_actions", "dataset_actions"]:
        recs = results.get(key, [])
        summary["categories"][key] = len(recs)
        summary["total_recommendations"] += len(recs)
        
        for rec in recs:
            priority = rec.get("Priority", "Low")
            if priority == "High":
                summary["high_priority"] += 1
            elif priority == "Medium":
                summary["medium_priority"] += 1
            else:
                summary["low_priority"] += 1
    
    # Add feature engineering count
    summary["categories"]["feature_engineering"] = len(results.get("feature_engineering", []))
    summary["total_recommendations"] += summary["categories"]["feature_engineering"]
    
    # Overall assessment
    if summary["high_priority"] > 5:
        summary["assessment"] = "Critical - Many high-priority issues require attention"
    elif summary["high_priority"] > 0:
        summary["assessment"] = "Needs Work - Some high-priority issues to address"
    elif summary["medium_priority"] > 5:
        summary["assessment"] = "Fair - Consider addressing medium-priority items"
    else:
        summary["assessment"] = "Good - Dataset ready for modeling with minor improvements"
    
    return summary
