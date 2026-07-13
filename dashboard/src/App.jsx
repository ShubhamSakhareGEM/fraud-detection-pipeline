import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const socketUrl = 'https://fraud-detection-pipeline-1-0b9g.onrender.com';
const socket = io(socketUrl);

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const color = payload.isFraud ? '#ef4444' : '#10b981'; 
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="none" />;
};

const ProjectSummary = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
    <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff', marginTop: 0 }}>Distributed Pipeline</h2>
      <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.6', margin: '0.5rem 0 0 0' }}>
        A real-time, event-driven microservice architecture deployed on <strong>Kubernetes</strong>. 
        Transactions are ingested via a <strong>Node.js API</strong>, streamed asynchronously through <strong>Kafka</strong>, 
        enriched with stateful velocity metrics using <strong>Redis</strong>, and streamed to this dashboard via <strong>WebSockets</strong>.
      </p>
    </div>
    <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #a855f7', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff', marginTop: 0 }}>Unsupervised ML Engine</h2>
      <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.6', margin: '0.5rem 0 0 0' }}>
        Uses an <strong>Isolation Forest</strong> algorithm to detect behavioral anomalies without relying on labeled historical data. 
        By scoring <em>Transaction Amount</em> against <em>User Velocity</em>, the model mathematically isolates the signature of automated card-testing botnets in milliseconds.
      </p>
    </div>
  </div>
);

const AlertCard = ({ alert }) => {
  const [isHovered, setIsHovered] = useState(false);
  const accentColor = alert.isFraud ? '#ef4444' : '#10b981';

  let explanation = "Normal transaction pattern.";
  if (alert.isFraud) {
    if (alert.recentTxCount > 5 && alert.amount < 10) {
      explanation = `Card testing signature: ${alert.recentTxCount} rapid micro-transactions ($${alert.amount}).`;
    } else if (alert.recentTxCount > 5) {
      explanation = `High velocity: ${alert.recentTxCount} transactions detected in a short window.`;
    } else {
      explanation = `Anomalous behavior detected for amount $${alert.amount}.`;
    }
  }

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        backgroundColor: '#1f2937', padding: '1rem', 
        borderLeft: `4px solid ${accentColor}`, borderRadius: '4px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)', position: 'relative',
        cursor: 'default', overflow: 'hidden'
      }}
    >
      <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
        TxID: {alert.transactionId}
      </p>
      <p style={{ fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#ffffff' }}>
        Score: {alert.fraudProbability}% 
        <span style={{ fontSize: '0.8rem', color: accentColor, marginLeft: '8px' }}>
          {alert.isFraud ? 'BLOCK' : 'PASS'}
        </span>
      </p>

      {isHovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          backdropFilter: 'blur(2px)'
        }}>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Reasoning</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#fff', lineHeight: '1.4' }}>{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [alerts, setAlerts] = useState([]);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simNormal, setSimNormal] = useState(40);
  const [simFraud, setSimFraud] = useState(15);

  useEffect(() => {
    socket.on('fraudAlert', (data) => {
      setAlerts((prev) => [...prev, data].slice(-100)); 
    });
    return () => socket.off('fraudAlert');
  }, []);

  const runSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    
    let normalLeft = parseInt(simNormal);
    let hackerLeft = parseInt(simFraud);
    let total = normalLeft + hackerLeft;

    for (let i = 1; i <= total; i++) {
      let totalLeft = normalLeft + hackerLeft;
      let rand = Math.floor(Math.random() * totalLeft);
      
      let userId, amount;
      if (rand < normalLeft) {
        userId = `user-${Math.floor(Math.random() * 1000) + 1}`;
        amount = Math.floor(Math.random() * 90) + 10;
        normalLeft--;
      } else {
        userId = "user-hacker-999";
        amount = Math.floor(Math.random() * 5) + 1;
        hackerLeft--;
      }

      try {
        await fetch('https://fraud-detection-pipeline-llor.onrender.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `tx-ui-${Date.now().toString().slice(-4)}-${i}`,
            user_id: userId,
            amount: amount
          })
        });
      } catch (error) {
        console.error("Traffic Generator Error:", error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsSimulating(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#111827', color: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#ffffff' }}>
        Real-Time Fraud Defense
      </h1>
      
      <ProjectSummary />

      <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Normal Traffic:</label>
          <input 
            type="number" 
            value={simNormal} 
            onChange={(e) => setSimNormal(e.target.value)}
            disabled={isSimulating}
            style={{ width: '70px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Hacker Attacks:</label>
          <input 
            type="number" 
            value={simFraud} 
            onChange={(e) => setSimFraud(e.target.value)}
            disabled={isSimulating}
            style={{ width: '70px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }}
          />
        </div>
        <button 
          onClick={runSimulation} 
          disabled={isSimulating}
          style={{ 
            backgroundColor: isSimulating ? '#4b5563' : '#3b82f6', 
            color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '4px', 
            border: 'none', fontWeight: 'bold', cursor: isSimulating ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isSimulating ? 'Running Simulation...' : '▶ Launch Traffic Simulation'}
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '8px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)', height: '400px', marginBottom: '2rem',
        overflowX: 'auto', overflowY: 'hidden' 
      }}>
        {/* Dynamic Width ensures dots stay 50px apart */}
        <div style={{ height: '100%', minWidth: '100%', width: `${Math.max(alerts.length * 50, 800)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={alerts}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
              <XAxis dataKey="transactionId" stroke="#9ca3af" />
              <YAxis domain={[0, 100]} stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '4px', color: '#fff' }} />
              <Line type="step" dataKey="fraudProbability" stroke="#4b5563" strokeWidth={2} isAnimationActive={false} dot={<CustomDot />} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {alerts.slice().reverse().map((alert, idx) => (
          <AlertCard key={idx} alert={alert} />
        ))}
      </div>
    </div>
  );
}