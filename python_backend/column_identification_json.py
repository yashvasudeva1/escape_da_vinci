import pandas as pd
import numpy as np 
from datetime import datetime
import json


def classify_numeric_columns(df, non_numerical_columns, numeric_threshold=0.9, discrete_ratio=0.05, discrete_max_unique=20):
    numerical_columns = [i for i in df.select_dtypes(include=["number"]).columns.tolist()]
    discrete_numeric = []
    continous_numeric = []

    for j in non_numerical_columns:
        converted = pd.to_numeric(df[j], errors='coerce')
        if converted.notna().sum() / len(df) > numeric_threshold:
            numerical_columns.append(j)

    for j in numerical_columns:
        unique_count = df[j].nunique()
        unique_ratio = unique_count / len(df)

        if unique_ratio <= discrete_ratio and unique_count <= discrete_max_unique:
            discrete_numeric.append(j)
        else:
            continous_numeric.append(j)

    return json.dumps({
        "numerical_columns": numerical_columns,
        "discrete_numeric": discrete_numeric,
        "continuous_numeric": continous_numeric
    })


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

def detect_datetime_column(
    df,
    col,
    base_parse_threshold=0.85,
    min_year=1900,
    max_year_buffer=1,
    min_unique_ratio=0.05,
    numeric_id_ratio=0.8
):
    col_l = col.lower()

    strong_kw = ["date", "datetime", "timestamp", "created", "updated", "modified"]
    weak_kw = ["time", "dt", "ts", "log", "event"]

    parse_threshold = base_parse_threshold
    if any(k in col_l for k in strong_kw):
        parse_threshold -= 0.15
    elif any(k in col_l for k in weak_kw):
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
    if years.min() < min_year or years.max() > datetime.now().year + max_year_buffer:
        return False

    unique_ratio = parsed.nunique() / parsed.notna().sum()
    if unique_ratio < min_unique_ratio:
        return False

    numeric_like_ratio = s.str.fullmatch(r"\d{8,}").mean()
    if numeric_like_ratio > numeric_id_ratio:
        return False

    return True

def detect_datetime_columns(df):
    datetime_columns = []

    for col in df.columns:
        try:
            if detect_datetime_column(df, col):
                datetime_columns.append(col)
        except Exception:
            continue

    return json.dumps({"datetime_columns": datetime_columns})


def detect_categorical_column(
    df,
    col,
    max_unique_ratio=0.05,
    max_unique_count=30,
    min_repetition_ratio=0.9
):
    s = df[col]

    non_null = s.dropna()
    if len(non_null) == 0:
        return False

    unique_count = non_null.nunique()
    unique_ratio = unique_count / len(non_null)

    value_counts = non_null.value_counts(normalize=True)
    repetition_ratio = value_counts.sum()

    if unique_ratio <= max_unique_ratio and unique_count <= max_unique_count:
        return True

    if pd.api.types.is_numeric_dtype(s):
        if (
            unique_count <= max_unique_count and
            unique_ratio <= max_unique_ratio * 2 and
            (non_null % 1 == 0).mean() > 0.95
        ):
            return True

    if pd.api.types.is_object_dtype(s):
        avg_len = non_null.astype(str).str.len().mean()
        if unique_count <= max_unique_count and avg_len < 20:
            return True

    return False

def detect_categorical_columns(df):
    categorical_columns = []

    for col in df.columns:
        try:
            if detect_categorical_column(df, col):
                categorical_columns.append(col)
        except Exception:
            continue

    return json.dumps({"categorical_columns": categorical_columns})

def is_id_like_numeric(series, unique_ratio_threshold=0.7):
    non_null = series.dropna()
    if not pd.api.types.is_numeric_dtype(series):
        return False
    if len(non_null) == 0:
        return False
    unique_ratio = non_null.nunique() / len(non_null)
    return unique_ratio > unique_ratio_threshold
