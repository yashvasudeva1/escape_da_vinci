"""
AutoML Backend - Column Classifier

Provides intelligent column type classification for datasets.
Identifies numeric (continuous/discrete), categorical, datetime, and ID-like columns.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional


COMMON_DT_FORMATS = [
    "%Y-%m-%d",
    "%Y/%m/%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%m-%d-%Y",
    "%m/%d/%Y",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%d-%m-%Y %H:%M:%S",
    "%d/%m/%Y %H:%M:%S",
]


def classify_all_columns(
    df: pd.DataFrame,
    numeric_threshold: float = 0.9,
    discrete_ratio: float = 0.05,
    discrete_max_unique: int = 20
) -> Dict[str, List[str]]:
    """
    Classify all columns in a DataFrame into their types.
    
    Priority order:
    1. Identify native numeric columns first (int64, float64)
    2. Detect numeric-like object columns (convertible to numeric)
    3. Detect datetime from remaining non-numeric columns
    4. Detect categorical from remaining columns
    5. Split numeric into discrete/continuous
    6. Detect ID-like columns
    7. Remove ID columns from all other categories
    
    Args:
        df: Input DataFrame
        numeric_threshold: Threshold for numeric detection
        discrete_ratio: Unique ratio threshold for discrete classification
        discrete_max_unique: Maximum unique values for discrete classification
        
    Returns:
        Dictionary with column type lists
    """
    # Step 1: Identify native numeric dtype columns
    native_numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    
    # Step 2: Identify non-numeric dtype columns for further classification
    non_numeric_dtype_cols = [c for c in df.columns if c not in native_numeric_cols]
    
    # Step 3: Detect datetime columns FIRST from non-numeric columns only
    datetime_cols = detect_datetime_columns(df, exclude_cols=native_numeric_cols)
    
    # Step 4: Columns remaining after datetime detection (still non-numeric dtype)
    remaining_after_datetime = [c for c in non_numeric_dtype_cols if c not in datetime_cols]
    
    # Step 5: Attempt numeric coercion on remaining non-numeric columns
    # Pass ONLY non-numeric dtype columns that are NOT datetime
    coerced_numeric_cols = []
    for col in remaining_after_datetime:
        converted = pd.to_numeric(df[col], errors='coerce')
        non_null_count = converted.notna().sum()
        if non_null_count > 0 and non_null_count / len(df) > numeric_threshold:
            coerced_numeric_cols.append(col)
    
    # Step 6: All numeric columns = native + coerced
    all_numeric_cols = list(set(native_numeric_cols + coerced_numeric_cols))
    
    # Step 7: Remaining columns for categorical detection
    remaining_for_categorical = [
        c for c in remaining_after_datetime 
        if c not in coerced_numeric_cols
    ]
    
    # Step 8: Detect categorical columns from remaining
    categorical_cols = detect_categorical_columns(df, include_cols=remaining_for_categorical)
    
    # Step 9: Also check numeric columns for discrete/categorical behavior
    discrete_numeric = []
    continuous_numeric = []
    
    for col in all_numeric_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continuous_numeric.append(col)
            continue
        
        unique_count = series.nunique()
        # FIX Bug 4: Compute unique ratio against NON-NULL rows, not total rows
        unique_ratio = unique_count / len(series)
        
        if unique_ratio <= discrete_ratio and unique_count <= discrete_max_unique:
            discrete_numeric.append(col)
        else:
            continuous_numeric.append(col)
    
    # Step 10: Detect ID-like columns
    id_cols = detect_id_columns(df)
    
    # Step 11: FIX Bug 5 - Remove ID columns from ALL other type lists
    continuous_numeric = [c for c in continuous_numeric if c not in id_cols]
    discrete_numeric = [c for c in discrete_numeric if c not in id_cols]
    categorical_cols = [c for c in categorical_cols if c not in id_cols]
    datetime_cols = [c for c in datetime_cols if c not in id_cols]
    all_numeric_cols = [c for c in all_numeric_cols if c not in id_cols]
    
    return {
        "continuous_numeric": continuous_numeric,
        "discrete_numeric": discrete_numeric,
        "categorical": categorical_cols,
        "datetime": datetime_cols,
        "id_like": id_cols,
        "all_numeric": all_numeric_cols
    }


def classify_numeric_columns(
    df: pd.DataFrame,
    excluded_columns: List[str],
    numeric_threshold: float = 0.9,
    discrete_ratio: float = 0.05,
    discrete_max_unique: int = 20
) -> Tuple[List[str], List[str], List[str]]:
    """
    Classify numeric columns into discrete and continuous.
    
    Args:
        df: Input DataFrame
        excluded_columns: Columns to exclude (datetime, already classified, etc.)
        numeric_threshold: Threshold for numeric detection in object columns
        discrete_ratio: Unique ratio threshold for discrete classification
        discrete_max_unique: Maximum unique values for discrete classification
        
    Returns:
        Tuple of (all_numeric, discrete_numeric, continuous_numeric)
    """
    # Start with native numeric dtype columns
    numerical_columns = df.select_dtypes(include=["number"]).columns.tolist()
    discrete_numeric = []
    continuous_numeric = []
    
    # Get non-numeric dtype columns that are NOT excluded
    non_numeric_dtype_cols = [
        c for c in df.columns 
        if c not in numerical_columns and c not in excluded_columns
    ]
    
    # FIX Bug 2: Only attempt coercion on non-excluded, non-numeric dtype columns
    for col in non_numeric_dtype_cols:
        converted = pd.to_numeric(df[col], errors='coerce')
        non_null_count = converted.notna().sum()
        # FIX Bug 4: Use non-null count for ratio
        if non_null_count > 0 and non_null_count / len(df) > numeric_threshold:
            numerical_columns.append(col)
    
    # Remove any excluded columns that might have snuck in
    numerical_columns = [c for c in numerical_columns if c not in excluded_columns]
    numerical_columns = list(set(numerical_columns))
    
    # Classify into discrete vs continuous
    for col in numerical_columns:
        series = df[col].dropna()
        if len(series) == 0:
            continuous_numeric.append(col)
            continue
        
        unique_count = series.nunique()
        # FIX Bug 4: Compute unique ratio against NON-NULL rows
        unique_ratio = unique_count / len(series)
        
        if unique_ratio <= discrete_ratio and unique_count <= discrete_max_unique:
            discrete_numeric.append(col)
        else:
            continuous_numeric.append(col)
    
    return numerical_columns, discrete_numeric, continuous_numeric


def detect_datetime_column(
    df: pd.DataFrame,
    col: str,
    base_parse_threshold: float = 0.85,
    min_year: int = 1900,
    max_year_buffer: int = 1,
    min_unique_ratio: float = 0.05,
    numeric_id_ratio: float = 0.8
) -> bool:
    """
    Detect if a column contains datetime values.
    
    IMPORTANT: This should only be called on non-numeric columns.
    Numeric columns (int64, float64) should be excluded before calling this.
    
    Args:
        df: Input DataFrame
        col: Column name to check
        base_parse_threshold: Minimum parse success ratio
        min_year: Minimum valid year
        max_year_buffer: Years beyond current year to allow
        min_unique_ratio: Minimum unique value ratio
        numeric_id_ratio: Maximum ratio of pure numeric strings
        
    Returns:
        True if column is datetime, False otherwise
    """
    if pd.api.types.is_numeric_dtype(df[col]):
        return False
    
    if df[col].dtype in ['int64', 'float64', 'int32', 'float32', 'int', 'float']:
        return False
    
    col_l = col.lower()
    
    strong_kw = ["date", "datetime", "timestamp", "created", "updated", "modified"]
    weak_kw = ["time", "dt", "ts", "log", "event"]
    
    has_strong_keyword = any(k in col_l for k in strong_kw)
    has_weak_keyword = any(k in col_l for k in weak_kw)
    
    if not has_strong_keyword and not has_weak_keyword:
        sample = df[col].dropna().head(10).astype(str)
        has_date_separator = sample.str.contains(r'[-/]').any()
        if not has_date_separator:
            return False
    
    parse_threshold = base_parse_threshold
    if has_strong_keyword:
        parse_threshold -= 0.15
    elif has_weak_keyword:
        parse_threshold -= 0.05
    
    parse_threshold = max(parse_threshold, 0.6)
    
    s = df[col].astype(str).str.strip()
    s = s.where(s.str.contains(r"\d", na=False), pd.NA)
    
    parsed = None
    for fmt in COMMON_DT_FORMATS:
        try:
            temp = pd.to_datetime(s, format=fmt, errors="coerce")
            if temp.notna().sum() / len(df) >= parse_threshold:
                parsed = temp
                break
        except Exception:
            continue
    
    if parsed is None:
        return False
    
    years = parsed.dropna().dt.year
    if len(years) == 0:
        return False
    if years.min() < min_year or years.max() > datetime.now().year + max_year_buffer:
        return False
    
    unique_ratio = parsed.nunique() / parsed.notna().sum() if parsed.notna().sum() > 0 else 0
    if unique_ratio < min_unique_ratio:
        return False
    
    numeric_like_ratio = s.str.fullmatch(r"\d{8,}").mean()
    if numeric_like_ratio > numeric_id_ratio:
        return False
    
    return True


def detect_datetime_columns(df: pd.DataFrame, exclude_cols: List[str] = None) -> List[str]:
    """
    Detect all datetime columns in a DataFrame.
    
    Args:
        df: Input DataFrame
        exclude_cols: Columns to exclude from detection (e.g., numeric columns)
        
    Returns:
        List of datetime column names
    """
    if exclude_cols is None:
        exclude_cols = []
    
    datetime_columns = []
    
    for col in df.columns:
        if col in exclude_cols:
            continue
        try:
            if detect_datetime_column(df, col):
                datetime_columns.append(col)
        except Exception:
            continue
    
    return datetime_columns


def detect_categorical_column(
    df: pd.DataFrame,
    col: str,
    max_unique_ratio: float = 0.05,
    max_unique_count: int = 30,
    min_repetition_ratio: float = 0.9
) -> bool:
    """
    Detect if a column is categorical.
    
    Handles both string/object columns AND numeric columns that behave like
    categories (e.g., encoded values 1,2,3,4,5 with high repetition).
    
    Args:
        df: Input DataFrame
        col: Column name to check
        max_unique_ratio: Maximum unique value ratio
        max_unique_count: Maximum unique value count
        min_repetition_ratio: Minimum repetition ratio
        
    Returns:
        True if column is categorical, False otherwise
    """
    s = df[col]
    non_null = s.dropna()
    
    if len(non_null) == 0:
        return False
    
    unique_count = non_null.nunique()
    # FIX Bug 4: Compute unique ratio against NON-NULL rows
    unique_ratio = unique_count / len(non_null)
    
    is_numeric = pd.api.types.is_numeric_dtype(s)
    
    # FIX Bug 3: Check numeric categorical FIRST (before returning False for numerics)
    if is_numeric:
        # Numeric columns can be categorical if:
        # 1. Low cardinality
        # 2. Integer-only values (no floats like 3.14)
        # 3. High repetition ratio
        is_integer_like = (non_null % 1 == 0).mean() > 0.95
        
        # Count how many rows use one of the top values (high repetition)
        value_counts = non_null.value_counts()
        top_values_coverage = value_counts.head(max_unique_count).sum() / len(non_null)
        
        if (
            unique_count <= max_unique_count and
            unique_ratio <= max_unique_ratio * 2 and
            is_integer_like and
            top_values_coverage >= min_repetition_ratio
        ):
            return True
        
        # Numeric column doesn't qualify as categorical
        return False
    
    # For non-numeric columns (object/string/category dtype)
    if unique_ratio <= max_unique_ratio and unique_count <= max_unique_count:
        return True
    
    # Check object dtype with short string lengths
    if pd.api.types.is_object_dtype(s):
        avg_len = non_null.astype(str).str.len().mean()
        if unique_count <= max_unique_count and avg_len < 20:
            return True
    
    return False


def detect_categorical_columns(df: pd.DataFrame, include_cols: List[str] = None) -> List[str]:
    """
    Detect all categorical columns in a DataFrame.
    
    Args:
        df: Input DataFrame
        include_cols: Only check these columns (if provided)
        
    Returns:
        List of categorical column names
    """
    categorical_columns = []
    
    cols_to_check = include_cols if include_cols is not None else df.columns.tolist()
    
    for col in cols_to_check:
        if col not in df.columns:
            continue
        try:
            if detect_categorical_column(df, col):
                categorical_columns.append(col)
        except Exception:
            continue
    
    return categorical_columns


def is_id_like_numeric(
    series: pd.Series,
    unique_ratio_threshold: float = 0.7
) -> bool:
    """
    Check if a numeric series appears to be an ID column.
    
    Args:
        series: Pandas Series to check
        unique_ratio_threshold: Minimum unique ratio for ID detection
        
    Returns:
        True if series appears to be an ID, False otherwise
    """
    non_null = series.dropna()
    if not pd.api.types.is_numeric_dtype(series):
        return False
    if len(non_null) == 0:
        return False
    unique_ratio = non_null.nunique() / len(non_null)
    return unique_ratio > unique_ratio_threshold


def detect_id_columns(df: pd.DataFrame) -> List[str]:
    """
    Detect ID-like columns in a DataFrame.
    
    Args:
        df: Input DataFrame
        
    Returns:
        List of ID-like column names
    """
    id_cols = []
    
    for col in df.columns:
        col_lower = col.lower()
        
        if 'id' in col_lower or col_lower in ['index', 'key', 'uuid']:
            if df[col].nunique() == len(df):
                id_cols.append(col)
        elif df[col].nunique() == len(df):
            if is_id_like_numeric(df[col]):
                id_cols.append(col)
    
    return id_cols


def get_column_classification_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Get a comprehensive summary of column classifications.
    
    Args:
        df: Input DataFrame
        
    Returns:
        Dictionary with classification summary and details
    """
    classification = classify_all_columns(df)
    
    column_details = []
    for col in df.columns:
        if col in classification["continuous_numeric"]:
            col_type = "Continuous Numeric"
        elif col in classification["discrete_numeric"]:
            col_type = "Discrete Numeric"
        elif col in classification["categorical"]:
            col_type = "Categorical"
        elif col in classification["datetime"]:
            col_type = "Datetime"
        elif col in classification["id_like"]:
            col_type = "ID"
        else:
            col_type = "Unknown"
        
        column_details.append({
            "Column": col,
            "Type": col_type,
            "Unique Values": int(df[col].nunique()),
            "Missing %": round(float(df[col].isna().mean() * 100), 2),
            "Sample Values": df[col].dropna().head(3).tolist()
        })
    
    return {
        "classification": classification,
        "column_details": column_details,
        "summary": {
            "total_columns": len(df.columns),
            "continuous_numeric": len(classification["continuous_numeric"]),
            "discrete_numeric": len(classification["discrete_numeric"]),
            "categorical": len(classification["categorical"]),
            "datetime": len(classification["datetime"]),
            "id_like": len(classification["id_like"])
        }
    }
