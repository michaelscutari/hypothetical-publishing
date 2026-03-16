import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthorsService, type AuthorResponse } from '@/api';
import PageContainer from '@/components/PageContainer';

export default function AuthorRoyaltyReport() {
  const [searchParams] = useSearchParams();
  const [authors, setAuthors] = React.useState<AuthorResponse[]>([]);
  const [selectedAuthor, setSelectedAuthor] = React.useState<AuthorResponse | null>(null);
  const [isLoadingAuthors, setLoadingAuthors] = React.useState(false);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const getDefaultStartQuarter = () => {
    let quarter = currentQuarter - 3;
    let year = currentYear;
    while (quarter <= 0) {
      quarter += 4;
      year -= 1;
    }
    return { quarter, year };
  };

  const defaultStart = getDefaultStartQuarter();
  const [startQuarter, setStartQuarter] = React.useState(defaultStart.quarter);
  const [startYear, setStartYear] = React.useState(defaultStart.year);
  const [endQuarter, setEndQuarter] = React.useState(currentQuarter);
  const [endYear, setEndYear] = React.useState(currentYear);

  React.useEffect(() => {
    loadAuthors();
  }, []);

  React.useEffect(() => {
    // If authorId is passed as query parameter, pre-select that author
    const authorId = searchParams.get('authorId');
    if (authorId && authors.length > 0) {
      const author = authors.find((a) => a.id?.toString() === authorId);
      if (author) {
        setSelectedAuthor(author);
      }
    }
  }, [searchParams, authors]);

  const loadAuthors = async () => {
    setLoadingAuthors(true);
    try {
      const response = await AuthorsService.getAllAuthors(0, 1000, true);
      setAuthors(response.content ?? []);
    } catch {
      // silent — empty author list is acceptable
    } finally {
      setLoadingAuthors(false);
    }
  };

  const handleGenerateReport = () => {
    if (!selectedAuthor || !selectedAuthor.id) return;

    const params = new URLSearchParams({
      authorId: selectedAuthor.id.toString(),
      startQuarter: startQuarter.toString(),
      startYear: startYear.toString(),
      endQuarter: endQuarter.toString(),
      endYear: endYear.toString(),
    });

    window.open(`/author-royalty-report?${params.toString()}`, '_blank');
  };

  const years = Array.from({ length: 201 }, (_, i) => 1900 + i);

  return (
    <PageContainer title="Author Royalty Report">
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h6">Generate Author Royalty Report</Typography>

            <Typography variant="body2" color="text.secondary">
              Select an author and timespan to generate a detailed royalty report. The report will
              be generated as a PDF document.
            </Typography>

            <Autocomplete
              options={authors}
              getOptionLabel={(author) => `${author.name} (${author.email})`}
              renderInput={(params) => <TextField {...params} label="Select Author" required />}
              value={selectedAuthor}
              onChange={(_, newValue) => setSelectedAuthor(newValue)}
              loading={isLoadingAuthors}
              disabled={isLoadingAuthors}
            />

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Start Quarter</InputLabel>
                <Select
                  value={startQuarter}
                  label="Start Quarter"
                  onChange={(e) => setStartQuarter(e.target.value as number)}
                >
                  <MenuItem value={1}>Q1 (Jan-Mar)</MenuItem>
                  <MenuItem value={2}>Q2 (Apr-Jun)</MenuItem>
                  <MenuItem value={3}>Q3 (Jul-Sep)</MenuItem>
                  <MenuItem value={4}>Q4 (Oct-Dec)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Start Year</InputLabel>
                <Select
                  value={startYear}
                  label="Start Year"
                  onChange={(e) => setStartYear(e.target.value as number)}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>End Quarter</InputLabel>
                <Select
                  value={endQuarter}
                  label="End Quarter"
                  onChange={(e) => setEndQuarter(e.target.value as number)}
                >
                  <MenuItem value={1}>Q1 (Jan-Mar)</MenuItem>
                  <MenuItem value={2}>Q2 (Apr-Jun)</MenuItem>
                  <MenuItem value={3}>Q3 (Jul-Sep)</MenuItem>
                  <MenuItem value={4}>Q4 (Oct-Dec)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>End Year</InputLabel>
                <Select
                  value={endYear}
                  label="End Year"
                  onChange={(e) => setEndYear(e.target.value as number)}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleGenerateReport}
                disabled={!selectedAuthor || isLoadingAuthors}
              >
                {isLoadingAuthors ? <CircularProgress size={24} /> : 'Generate Report'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
