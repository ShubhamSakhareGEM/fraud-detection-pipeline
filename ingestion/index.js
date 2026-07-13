const express=require('express');
const {Kafka}=require('kafkajs');

const app= express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

const kafka=new Kafka({
  clientId: 'ingestion-api',
  brokers: [process.env.KAFKA_BROKER],
  ssl: true, 
  sasl: { 
    mechanism:'plain', 
    username: process.env.KAFKA_USER, 
    password:process.env.KAFKA_PASSWORD 
  }
});

const producer= kafka.producer();


//connecting with Kafka on boot up 
const startServer=async () => {
  try {
    await producer.connect();
    console.log('Successfully connected to Aiven Kafka!');
    
    // opening http port once kafka is ready
    app.listen(3000, () => console.log('Ingestion API running on port 3000'));
  } catch (error) {

    console.error('Fatal: Failed to connect to Kafka:', error);
    process.exit(1);
  }
};

//api Route
app.post('/api/transactions', async (req, res) => {
  try {
    const tx = { ...req.body, timestamp: Date.now() };
    
    await producer.send({
      topic: 'raw-transactions',
      messages: [{ value: JSON.stringify(tx) }],
    });
    

    res.status(202).json({ status: 'accepted', transactionId: tx.id });
  } catch (error) {
    console.error('Error sending transaction:', error);
    res.status(500).json({ error: 'Message broker timeout' });
  }
});

startServer();