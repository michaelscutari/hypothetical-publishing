import { useEffect, useState } from 'react';

type Status = 'checking' | 'connected' | 'error';

export default function ApiTest() {
  const [status, setStatus] = useState<Status>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        setStatus(res.ok ? 'connected' : 'error');
        setMessage(res.ok ? 'OK' : `Error: ${res.status}`);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, []);

  const colors = { checking: '#eab308', connected: '#22c55e', error: '#ef4444' };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <span
        style={{
          display: 'inline-block',
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: colors[status],
          marginRight: 8,
        }}
      />
      Backend: {status === 'checking' ? 'Checking...' : message}
    </div>
  );
}
