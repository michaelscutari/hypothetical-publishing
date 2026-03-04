import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import Chip from '@mui/material/Chip';

/** Shared chip for displaying paid/unpaid status. */
export default function PaidStatusChip({ paid }: { paid?: boolean }) {
  return (
    <Chip
      icon={paid ? <CheckCircleIcon /> : <PendingIcon />}
      label={paid ? 'Paid' : 'Unpaid'}
      color={paid ? 'success' : 'warning'}
      size="small"
      variant={paid ? 'filled' : 'outlined'}
    />
  );
}
