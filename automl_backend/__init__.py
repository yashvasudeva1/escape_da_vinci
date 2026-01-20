"""
AutoML Backend — Automated Dataset Intelligence System

This package provides production-grade analytics modules for:
- T3: Descriptive Analytics
- T4: Diagnostic Analytics  
- T5: Predictive Analytics
- T6: Prescriptive Analytics

Additional modules:
- Column Classifier: Intelligent column type detection
- Data Cleaning: Data quality metrics and cleaning functions
- Stats Utils: Statistical computation utilities
- Correlation Utils: Correlation analysis functions
- Target Detection: ML target inference
- Feature Engineering: Feature preparation and recommendations

All modules expose pure functions with JSON-serializable outputs.
"""

from .descriptive import run_descriptive_analytics
from .diagnostic import run_diagnostic_analytics
from .predictive import run_predictive_analytics
from .prescriptive import run_prescriptive_analytics

from .column_classifier import (
    classify_all_columns,
    classify_numeric_columns,
    detect_datetime_columns,
    detect_categorical_columns,
    detect_id_columns,
    get_column_classification_summary
)

from .data_cleaning import (
    get_data_quality_metrics_df,
    clean_dataset,
    get_cleaning_recommendations,
    get_distribution_insights
)

from .stats_utils import (
    compute_numeric_stats,
    compute_categorical_stats,
    compute_distribution_metrics,
    detect_outliers_iqr,
    compute_normality_metrics
)

from .correlation_utils import (
    compute_correlation_matrix,
    get_correlation_pairs,
    detect_multicollinearity,
    compute_vif,
    get_top_correlations
)

from .target_detection import (
    infer_target_type,
    auto_detect_target,
    validate_target_column,
    get_class_distribution
)

from .feature_engineering import (
    get_model_ready_features,
    get_model_recommendations,
    suggest_feature_engineering,
    get_training_plan
)

__version__ = "1.0.0"

__all__ = [
    # Main tier functions
    "run_descriptive_analytics",
    "run_diagnostic_analytics",
    "run_predictive_analytics",
    "run_prescriptive_analytics",
    # Column classification
    "classify_all_columns",
    "classify_numeric_columns",
    "detect_datetime_columns",
    "detect_categorical_columns",
    "detect_id_columns",
    "get_column_classification_summary",
    # Data cleaning
    "get_data_quality_metrics_df",
    "clean_dataset",
    "get_cleaning_recommendations",
    "get_distribution_insights",
    # Statistics
    "compute_numeric_stats",
    "compute_categorical_stats",
    "compute_distribution_metrics",
    "detect_outliers_iqr",
    "compute_normality_metrics",
    # Correlation
    "compute_correlation_matrix",
    "get_correlation_pairs",
    "detect_multicollinearity",
    "compute_vif",
    "get_top_correlations",
    # Target detection
    "infer_target_type",
    "auto_detect_target",
    "validate_target_column",
    "get_class_distribution",
    # Feature engineering
    "get_model_ready_features",
    "get_model_recommendations",
    "suggest_feature_engineering",
    "get_training_plan",
]
