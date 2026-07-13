import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest

df=pd.read_csv('fraud_data.csv')
X_train= df[['amount', 'recent_tx_count']]

model=IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
model.fit(X_train)

joblib.dump(model, 'fraud_model.pkl')