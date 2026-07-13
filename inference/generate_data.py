import pandas as pd
import random

data = []
for _ in range(10000):
    amount=round(random.uniform(5.0, 150.0), 2)
    recent_tx_count= random.randint(1, 3)
    
    #genrating 5% anamolies
    if random.random()<0.05:
        if random.random()<0.5:
            recent_tx_count= random.randint(8, 20)
        else:
            amount=round(random.uniform(800.0, 5000.0), 2)
            
    data.append([amount, recent_tx_count])
df = pd.DataFrame(data, columns=['amount', 'recent_tx_count'])
df.to_csv('fraud_data.csv', index=False)