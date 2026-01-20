import numpy as np 
import pandas as pd
import json

def get_categorical_descriptive_df(df, categorical_cols):
    rows = []

    for col in categorical_cols:
        series = df[col].dropna()
        if series.empty:
            continue

        vc = series.value_counts()
        probs = vc / vc.sum()

        entropy = -np.sum(probs * np.log2(probs))

        rows.append({
            "Column": col,
            "Unique Values": int(series.nunique()),
            "Most Common": str(vc.idxmax()),
            "Frequency": int(vc.max()),
            "Entropy": round(entropy, 2)
        })

    return json.dumps(rows, indent=2)

def get_numerical_descriptive_df(df, numeric_cols):
    rows = {}

    for col in numeric_cols:
        series = df[col].dropna()
        if series.empty:
            continue

        rows[col] = {
            "mean": round(series.mean(), 6),
            "median": round(series.median(), 6),
            "std": round(series.std(), 6),
            "min": round(series.min(), 6),
            "max": round(series.max(), 6),
            "skewness": round(series.skew(), 6),
            "kurtosis": round(series.kurtosis(), 6),
            "cv": round(series.std() / series.mean(), 6) if series.mean() != 0 else None
        }

    return json.dumps(rows, indent=2)

def get_numeric_correlation_diagnostics(
    df,
    numeric_cols,
    threshold=0.8
):
    corr_matrix = df[numeric_cols].corr(method="pearson")
    rows = []

    for i in range(len(numeric_cols)):
        for j in range(i + 1, len(numeric_cols)):
            corr_val = corr_matrix.iloc[i, j]

            if abs(corr_val) >= threshold:
                rows.append({
                    "Feature 1": numeric_cols[i],
                    "Feature 2": numeric_cols[j],
                    "Pearson Correlation": round(corr_val, 4),
                    "Severity": (
                        "High" if abs(corr_val) > 0.8
                        else "Moderate"
                    ),
                    "Suggested Action": (
                        "Drop one feature or apply PCA"
                        if abs(corr_val) > 0.8
                        else "Check redundancy"
                    )
                })

    return json.dumps(rows, indent=2)

def get_correlation_pairs_df(
    df,
    numeric_cols,
    method="spearman",
    threshold=0.6
):
    corr_matrix = df[numeric_cols].corr(method=method)
    rows = []

    for i in range(len(numeric_cols)):
        for j in range(i + 1, len(numeric_cols)):
            corr_value = corr_matrix.iloc[i, j]

            if abs(corr_value) >= threshold:
                rows.append({
                    "Feature 1": numeric_cols[i],
                    "Feature 2": numeric_cols[j],
                    f"{method.title()} Correlation": round(corr_value, 4),
                    "Strength": (
                        "Very Strong" if abs(corr_value) > 0.8
                        else "Strong"
                    ),
                    "Relationship Type": (
                        "Positive" if corr_value > 0 else "Negative"
                    )
                })

    return json.dumps(rows, indent=2)

def get_pearson_corr_matrix(df, numeric_cols):
    corr_matrix = df[numeric_cols].corr(method="pearson")
    return corr_matrix.to_json(orient="split", indent=2)

def get_spearman_correlation_df(df, numeric_cols, threshold=0.6):
    return get_correlation_pairs_df(
        df,
        numeric_cols,
        method="spearman",
        threshold=threshold
    )

def get_kendall_correlation_df(df, numeric_cols, threshold=0.5):
    return get_correlation_pairs_df(
        df,
        numeric_cols,
        method="kendall",
        threshold=threshold
    )


def numeric_prescriptive_df(
    df,
    continuous_numeric,
    discrete_numeric,
    corr_df=None,
    skew_threshold=0.75,
    outlier_threshold_pct=5
):
    rows = []

    numeric_cols = continuous_numeric + discrete_numeric

    for col in numeric_cols:
        series = df[col].dropna()
        if series.empty:
            continue

        skewness = series.skew()
        cv = series.std() / series.mean() if series.mean() != 0 else None

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        outliers = ((series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)).sum()
        outlier_pct = (outliers / len(series)) * 100

        action = "Keep"
        reason = "Healthy distribution"

        if abs(skewness) > skew_threshold:
            action = "Transform"
            reason = "High skewness detected"

        if outlier_pct > outlier_threshold_pct:
            action = "Cap / Remove Outliers"
            reason = "Significant outlier presence"

        if cv and cv > 1.5:
            reason += "; High variability"

        rows.append({
            "Column": col,
            "Type": (
                "Continuous Numeric"
                if col in continuous_numeric
                else "Discrete Numeric"
            ),
            "Skewness": round(skewness, 3),
            "Outlier %": round(outlier_pct, 2),
            "Recommended Action": action,
            "Rationale": reason
        })

    return json.dumps(rows, indent=2)


def categorical_prescriptive_df(
    df,
    categorical_cols,
    dominance_threshold=70,
    rare_threshold=5
):
    rows = []

    for col in categorical_cols:
        series = df[col].dropna()
        if series.empty:
            continue

        vc = series.value_counts()
        total = vc.sum()
        dominant_pct = (vc.iloc[0] / total) * 100
        rare_pct = (vc[vc / total < rare_threshold / 100].sum() / total) * 100

        if dominant_pct > dominance_threshold:
            action = "Target / Frequency Encoding"
            reason = "Highly dominant category"
        elif rare_pct > 10:
            action = "Group Rare Categories"
            reason = "Many low-frequency categories"
        elif series.nunique() <= 10:
            action = "One-Hot Encoding"
            reason = "Low cardinality"
        else:
            action = "Target Encoding"
            reason = "Moderate-to-high cardinality"

        rows.append({
            "Column": col,
            "Unique Values": int(series.nunique()),
            "Dominant %": round(dominant_pct, 2),
            "Rare Category %": round(rare_pct, 2),
            "Recommended Encoding": action,
            "Rationale": reason
        })

    return json.dumps(rows, indent=2)

def correlation_prescriptive_df(corr_diag_df):
    if corr_diag_df is None or (isinstance(corr_diag_df, pd.DataFrame) and corr_diag_df.empty):
        return json.dumps([])

    rows = []

    if isinstance(corr_diag_df, str):
        corr_diag_df = json.loads(corr_diag_df)
    
    if isinstance(corr_diag_df, list):
        for row in corr_diag_df:
            rows.append({
                "Feature to Drop": row["Feature 2"],
                "Reason": f"High correlation with {row['Feature 1']}"
            })
    else:
        for _, row in corr_diag_df.iterrows():
            rows.append({
                "Feature to Drop": row["Feature 2"],
                "Reason": f"High correlation with {row['Feature 1']}"
            })

    return json.dumps(rows, indent=2)

def dataset_prescriptive_summary(df):
    rows = []

    if df.duplicated().sum() > 0:
        rows.append({
            "Action": "Drop Duplicates",
            "Reason": "Duplicate rows detected"
        })

    missing_pct = df.isna().mean().mean() * 100
    if missing_pct > 30:
        rows.append({
            "Action": "Review Missing Data",
            "Reason": "High missing value percentage"
        })

    if df.shape[1] > df.shape[0]:
        rows.append({
            "Action": "Feature Selection",
            "Reason": "More features than samples"
        })

    return json.dumps(rows, indent=2)
