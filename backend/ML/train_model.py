import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from collections import Counter
import joblib

# =========================
# LOAD DATA
# =========================
data = pd.read_csv("big_data.csv")

# =========================
# FEATURES
# =========================
X = data[[
    "dist_river",
    "dist_lake",
    "dist_ocean",
    "dist_forest",
    "elevation",
    "terrain"
]]

y = data["risk"]

# =========================
# CHECK BALANCE
# =========================
print("Class Distribution:", Counter(y))

# =========================
# SPLIT
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# =========================
# MODEL (STRONG)
# =========================
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1
)

# =========================
# TRAIN
# =========================
model.fit(X_train, y_train)

# =========================
# TEST
# =========================
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"✅ Model Accuracy: {accuracy:.4f}")

# =========================
# SAVE
# =========================
joblib.dump(model, "model.pkl")

print("✅ Model saved successfully!")