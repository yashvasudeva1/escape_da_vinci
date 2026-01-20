import pandas as pd
import numpy as np
import json

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, mean_absolute_error, r2_score,
    confusion_matrix, classification_report
)
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier

import matplotlib.pyplot as plt
import seaborn as sns
import joblib


def train_baseline_model(
    df,
    target_col,
    feature_df,
    target_type,
    test_size=0.2,
    random_state=42,
    export_path="baseline_pipeline.joblib"
):
    if isinstance(feature_df, str):
        feature_df = pd.DataFrame(json.loads(feature_df))
    
    X = df[feature_df["Feature"]]
    y = df[target_col]

    numeric_features = feature_df[
        feature_df["Type"].isin(["Continuous Numeric", "Discrete Numeric"])
    ]["Feature"].tolist()

    categorical_features = feature_df[
        feature_df["Type"] == "Categorical"
    ]["Feature"].tolist()

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
        ]
    )

    if target_type == "Regression":
        model = LinearRegression()
        task = "regression"

    elif target_type == "Binary Classification":
        model = LogisticRegression(max_iter=1000)
        task = "classification"

    else:
        model = RandomForestClassifier(
            n_estimators=100,
            random_state=random_state
        )
        task = "classification"

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model)
    ])

    stratify = y if task == "classification" else None

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=stratify
    )

    pipeline.fit(X_train, y_train)

    y_train_pred = pipeline.predict(X_train)
    y_test_pred = pipeline.predict(X_test)

    metrics = {}

    if task == "classification":
        metrics["Train Accuracy"] = float(accuracy_score(y_train, y_train_pred))
        metrics["Test Accuracy"] = float(accuracy_score(y_test, y_test_pred))
        metrics["Precision"] = float(precision_score(y_test, y_test_pred, average="weighted"))
        metrics["Recall"] = float(recall_score(y_test, y_test_pred, average="weighted"))
        metrics["F1 Score"] = float(f1_score(y_test, y_test_pred, average="weighted"))

    else:
        train_rmse = float(np.sqrt(mean_squared_error(y_train, y_train_pred)))
        test_rmse = float(np.sqrt(mean_squared_error(y_test, y_test_pred)))

        metrics["Train RMSE"] = train_rmse
        metrics["Test RMSE"] = test_rmse
        metrics["MAE"] = float(mean_absolute_error(y_test, y_test_pred))
        metrics["R2 Score"] = float(r2_score(y_test, y_test_pred))

    result = {
        "task": task,
        "metrics": metrics,
        "export_path": export_path
    }

    if task == "classification":
        cm = confusion_matrix(y_test, y_test_pred)
        report_dict = classification_report(y_test, y_test_pred, output_dict=True)
        
        result["confusion_matrix"] = cm.tolist()
        result["classification_report"] = report_dict

    joblib.dump(pipeline, export_path)

    return json.dumps(result, indent=2)
