import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export default function FullPageLoader() {
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  );
}
