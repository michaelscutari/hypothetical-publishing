// Dev tool: shows backend connection status. Delete this file to remove.
import { useEffect, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { api } from '../api';

type Status = 'checking' | 'connected' | 'error';

export default function BackendStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const check = async () => {
      const { error } = await api.GET('/api/health');
      setStatus(error ? 'error' : 'connected');
    };

    check();
    const interval = setInterval(check, 15000);

    return () => clearInterval(interval);
  }, []);

  const colors = { checking: '#eab308', connected: '#22c55e', error: '#ef4444' };
  const labels = {
    checking: 'Checking backend...',
    connected: 'Backend connected',
    error: 'Backend unavailable',
  };

  return (
    <Tooltip title={labels[status]} placement="left">
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: colors[status],
          zIndex: 9999,
          cursor: 'help',
        }}
      />
    </Tooltip>
  );
}
