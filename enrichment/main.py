import json, os, redis, ssl
from kafka import KafkaConsumer, KafkaProducer

r= redis.Redis.from_url(os.getenv('REDIS_URL'), decode_responses=True, ssl_cert_reqs="none")

# creating SSL Context
unverified_context=ssl.create_default_context()
unverified_context.check_hostname= False
unverified_context.verify_mode= ssl.CERT_NONE

#consumer
consumer = KafkaConsumer(
    'raw-transactions', 
    bootstrap_servers=[os.getenv('KAFKA_BROKER')], 
    security_protocol='SASL_SSL', 
    sasl_mechanism='PLAIN', 
    sasl_plain_username=os.getenv('KAFKA_USER'), 
    sasl_plain_password=os.getenv('KAFKA_PASSWORD'), 
    api_version=(2, 8, 0), 
    ssl_context=unverified_context, 
    group_id='enrichment-group',       
    auto_offset_reset='earliest',     
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

#producer
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

print("enrichment worker running...")

for message in consumer:
    tx= message.value
    print(f"Enriching transaction: {tx.get('id')}")

    user_id =tx.get('user_id')
    

    count_key=f"tx_count:{user_id}"
    tx_count= r.incr(count_key)
    if tx_count==1:
        r.expire(count_key, 600) # 10 minute rolling window
    
    tx['recent_tx_count'] = tx_count
    producer.send('enriched-transactions', tx)
    producer.flush()