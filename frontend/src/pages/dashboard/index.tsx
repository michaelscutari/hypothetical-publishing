import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Dashboard() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Typography variant="h3" fontWeight={700}>
        Dashboard
      </Typography>
    </Box>
  );
}
