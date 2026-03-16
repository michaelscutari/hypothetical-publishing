import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { type RoyaltyReportResponse } from '@/api';
import { getQuarterLabel, getGeneratedDate } from './royaltyReportUtils';

interface ReportHeaderProps {
  reportData: RoyaltyReportResponse;
}

export default function ReportHeader({ reportData }: ReportHeaderProps) {
  return (
    <Box className="report-header" sx={{ borderBottom: 3, borderColor: 'primary.main' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
            Hypothetical Publishing
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Author Royalty Report
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Generated: {getGeneratedDate()}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ borderTop: 2, borderColor: 'primary.main', pt: 2 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Author Name:</strong> {reportData.author}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Report Period:</strong> {getQuarterLabel(reportData.startQuarter)}{' '}
          {reportData.startYear} – {getQuarterLabel(reportData.endQuarter)} {reportData.endYear}
        </Typography>
      </Box>
    </Box>
  );
}
