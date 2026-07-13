import json, os,joblib,warnings,ssl
from kafka import KafkaConsumer, KafkaProducer

warnings.filterwarnings("ignore",category=UserWarning)

MODEL_PATH=os.path.join(os.path.dirname(__file__),'fraud_model.pkl')
model=joblib.load(MODEL_PATH)

unverified_context= ssl.create_default_context()
unverified_context.check_hostname= False
unverified_context.verify_mode= ssl.CERT_NONE

consumer = KafkaConsumer(
    'enriched-transactions', 
    bootstrap_servers=[os.getenv('KAFKA_BROKER')], 
    security_protocol='SASL_SSL', 
    sasl_mechanism='PLAIN', 
    sasl_plain_username=os.getenv('KAFKA_USER'), 
    sasl_plain_password=os.getenv('KAFKA_PASSWORD'), 
    api_version=(2, 8, 0), 
    ssl_context=unverified_context,
    group_id='inference-group',       
    auto_offset_reset='earliest',      
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

producer = KafkaProducer(
    bootstrap_servers=[os.getenv('KAFKA_BROKER')], 
    security_protocol='SASL_SSL', 
    sasl_mechanism='PLAIN', 
    sasl_plain_username=os.getenv('KAFKA_USER'), 
    sasl_plain_password=os.getenv('KAFKA_PASSWORD'), 
    api_version=(2, 8, 0),
    ssl_context=unverified_context, 
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

print("ML Engine running...")

for message in consumer:
    tx = message.value
    amount = float(tx.get('amount', 0.0))
    recent_tx_count = int(tx.get('recent_tx_count', 1))
    features = [[amount, recent_tx_count]] 
    prediction = model.predict(features)[0]
    raw_score = model.score_samples(features)[0]
    fraud_prob = min(max(int(abs(raw_score) * 120), 0), 99) 
    
    #decide if fraud
    is_fraud = bool(prediction == -1)
    print(f"Analyzing: {tx.get('id')} | Prob: {fraud_prob}% | Fraud: {is_fraud}")
    

#sending all transactions to Kafka
    alert = {
        "transactionId": tx.get('id', 'unknown'), 
        "fraudProbability": fraud_prob,
        "isFraud": is_fraud,
        "amount": amount,               
        "recentTxCount": recent_tx_count  
    }

    producer.send('fraud-alerts', alert)
    producer.flush()