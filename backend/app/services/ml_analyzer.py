import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

def run_ml_analysis(df: pd.DataFrame, numeric_cols: list) -> dict:
    if len(numeric_cols) < 2:
        return {}

    clean = df[numeric_cols].dropna()
    X = StandardScaler().fit_transform(clean)

    # Optimal K via elbow
    max_k = min(8, len(clean) - 1)
    inertias = []
    for k in range(2, max_k + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        inertias.append(km.fit(X).inertia_)

    diffs = np.diff(inertias)
    best_k = int(np.argmin(diffs)) + 2

    kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    segments = kmeans.fit_predict(X)

    # PCA for 2D visualization
    pca = PCA(n_components=2)
    coords = pca.fit_transform(X)

    # Segment profiles
    clean["_segment"] = segments
    segment_profiles = clean.groupby("_segment")[numeric_cols].mean().round(2).to_dict()

    return {
        "segment_count": best_k,
        "segments": segments.tolist(),
        "pca_coords": coords.tolist(),
        "pca_variance_explained": pca.explained_variance_ratio_.round(3).tolist(),
        "segment_profiles": segment_profiles,
    }
