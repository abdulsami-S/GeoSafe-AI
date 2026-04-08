import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

# =========================
# LOAD DATA
# =========================
path = os.path.join(os.path.dirname(__file__), "big_data.csv")
data = pd.read_csv(path)

# =========================
# FEATURES & LABEL
# =========================
X = data[[
    "dist_river", "dist_lake",
    "dist_ocean", "dist_forest",
    "elevation", "slope"
]]

y = data["risk"]

# =========================
# TRAIN TEST SPLIT
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# =========================
# MODEL
# =========================
model = RandomForestClassifier()
model.fit(X_train, y_train)

# =========================
# EVALUATION
# =========================
y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
print("Accuracy:", accuracy)

# =========================
# SAVE MODEL
# =========================
joblib.dump(model, "model.pkl")

print("Model saved!")