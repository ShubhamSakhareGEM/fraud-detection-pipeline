const express= require('express');
const http=require('http');
const { Server }= require('socket.io');
const { Kafka }= require('kafkajs');

const cors=require('cors');
const app= express();
app.use(cors());

const server=http.createServer(app);
const io=new Server(server, {
  cors: { origin: '*' } 
});

//Kafka Connection
const kafka= new Kafka({
  clientId: 'ingestion-api',
  brokers: ['kafka-1256c67c-shubhamsakharegem-7fb2.j.aivencloud.com:21539'], 
  ssl: {
    rejectUnauthorized: false 
  },
  sasl: {
    mechanism: 'scram-sha-256', 
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  }
});

//consumer
const consumer= kafka.consumer({ groupId: 'react-dashboard-group' });

const startBridge= async () => {
  try {
    await consumer.connect();
    console.log('Bridge successfully connected to Aiven Kafka!');
    
    // Listen to the alerts topic
    await consumer.subscribe({ topic: 'fraud-alerts', fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ message }) => {
        const alert = JSON.parse(message.value.toString());
        console.log(`Pushing to UI: ${alert.transactionId} | Prob: ${alert.fraudProbability}%`);
        
        //broqdcasting via WebSockets to React
        io.emit('fraudAlert', alert);
      },
    });

    server.listen(4000, () => console.log('WebSocket Bridge running on port 4000'));
  } catch (error) {
    console.error('Fatal Bridge Error:', error);
    process.exit(1);
  }
};

startBridge();