"""
AutoML Backend — Typed Schemas

Provides typed data structures for analytics outputs.
All schemas are JSON-serializable and can be used with Pydantic.
"""

from typing import List, Dict, Any, Optional, Union, Literal
from dataclasses import dataclass, asdict
from enum import Enum


class ColumnType(str, Enum):
    """Column type classification."""
    CONTINUOUS = "continuous"
    DISCRETE = "discrete"
    CATEGORICAL = "categorical"
    DATETIME = "datetime"
    UNKNOWN = "unknown"


class CorrelationStrength(str, Enum):
    """Correlation strength levels."""
    VERY_STRONG = "Very Strong"
    STRONG = "Strong"
    MODERATE = "Moderate"
    WEAK = "Weak"


class Severity(str, Enum):
    """Severity levels for diagnostics."""
    HIGH = "High"
    MODERATE = "Moderate"
    LOW = "Low"


class TargetType(str, Enum):
    """ML target type classification."""
    BINARY_CLASSIFICATION = "Binary Classification"
    MULTICLASS_CLASSIFICATION = "Multiclass Classification"
    REGRESSION = "Regression"
    UNKNOWN = "Unknown"


@dataclass
class NumericStats:
    """Descriptive statistics for numeric columns."""
    column: str
    mean: float
    median: float
    std: float
    min: float
    max: float
    skewness: float
    kurtosis: float
    cv: Optional[float] = None
    q25: Optional[float] = None
    q75: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class CategoricalStats:
    """Descriptive statistics for categorical columns."""
    column: str
    unique_count: int
    most_common: str
    frequency: int
    entropy: float
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class CorrelationPair:
    """Correlation between two features."""
    feature_1: str
    feature_2: str
    correlation: float
    strength: str
    relationship_type: str
    method: str = "pearson"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "Feature 1": self.feature_1,
            "Feature 2": self.feature_2,
            f"{self.method.title()} Correlation": self.correlation,
            "Strength": self.strength,
            "Relationship Type": self.relationship_type
        }


@dataclass
class MulticollinearityDiagnostic:
    """Multicollinearity diagnostic for feature pair."""
    feature_1: str
    feature_2: str
    pearson_correlation: float
    severity: str
    suggested_action: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "Feature 1": self.feature_1,
            "Feature 2": self.feature_2,
            "Pearson Correlation": self.pearson_correlation,
            "Severity": self.severity,
            "Suggested Action": self.suggested_action
        }


@dataclass
class FeatureRecommendation:
    """Model-ready feature recommendation."""
    feature: str
    feature_type: str
    recommended_preprocessing: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "Feature": self.feature,
            "Type": self.feature_type,
            "Recommended Preprocessing": self.recommended_preprocessing
        }


@dataclass
class ModelRecommendation:
    """Recommended model for target type."""
    model: str
    reason: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "Recommended Model": self.model,
            "Why Use It": self.reason
        }


@dataclass
class NumericPrescription:
    """Prescriptive action for numeric column."""
    column: str
    column_type: str
    skewness: float
    outlier_pct: float
    recommended_action: str
    rationale: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "Column": self.column,
            "Type": self.column_type,
            "Skewness": self.skewness,
            "Outlier %": self.outlier_pct,
            "Recommended Action": self.recommended_action,
            "Rationale": self.rationale
        }


@dataclass
class CategoricalPrescription:
    """Prescriptive action for categorical column."""
    column: str
    unique_count: int
    dominant_pct: float
    rare_category_pct: float
    recommended_encoding: str
    rationale: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "Column": self.column,
            "Unique Values": self.unique_count,
            "Dominant %": self.dominant_pct,
            "Rare Category %": self.rare_category_pct,
            "Recommended Encoding": self.recommended_encoding,
            "Rationale": self.rationale
        }


@dataclass
class CorrelationAction:
    """Prescriptive action for correlated features."""
    feature_to_drop: str
    reason: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "Feature to Drop": self.feature_to_drop,
            "Reason": self.reason
        }


@dataclass
class DatasetAction:
    """Dataset-level prescriptive action."""
    action: str
    reason: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "Action": self.action,
            "Reason": self.reason
        }


# Type aliases for complex return types
DescriptiveResult = Dict[str, Any]
DiagnosticResult = Dict[str, Any]
PredictiveResult = Dict[str, Any]
PrescriptiveResult = Dict[str, Any]
