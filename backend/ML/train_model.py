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
# FEATURES & LABEL
# =========================
X = data[[
    "dist_river",
    "dist_lake",
    "dist_ocean",
    "dist_forest",
    "elevation",
    "slope"
]]

y = data["risk"]

# =========================
# CHECK DATA BALANCE
# =========================
print("Class Distribution:", Counter(y))

# =========================
# TRAIN / TEST SPLIT
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# =========================
# MODEL (OPTIMIZED)
# =========================
model = RandomForestClassifier(
    n_estimators=100,        # number of trees
    max_depth=10,            # prevents overfitting
    random_state=42,
    n_jobs=-1                # use all CPU cores 
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
print(f"Model Accuracy: {accuracy:.4f}")

# =========================
# SAVE MODEL
# =========================
joblib.dump(model, "model.pkl")

print("Model saved successfully! ")