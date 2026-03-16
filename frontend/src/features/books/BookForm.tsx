import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { BooksService, type AuthorResponse, type BookResponse } from '@/api';
import { MONTH_NAMES } from '@/constants/months';
import { useDebounce } from '@/hooks/useDebounce';
import AuthorField from './AuthorField';
import CoverImageField from './CoverImageField';

type BookFormValues = Partial<Omit<BookResponse, 'id' | 'totalSalesToDate'>> & {
  coverImageFile?: File | null;
};

export interface BookFormState {
  values: BookFormValues;
  errors: Partial<Record<keyof BookFormValues, string>>;
}

export type FormFieldValue = string | string[] | number | boolean | File | null;

export interface BookFormProps {
  formState: BookFormState;
  onFieldChange: (name: keyof BookFormState['values'], value: FormFieldValue) => void;
  onSubmit: (formValues: Partial<BookFormState['values']>) => Promise<void>;
  onReset?: (formValues: Partial<BookFormState['values']>) => void;
  submitButtonLabel: string;
  backButtonPath?: string;
  onIsbnLookup?: (isbn: string) => Promise<void>;
  isbnLookupLoading?: boolean;
  bookId?: number;
  initialAuthor?: AuthorResponse | null;
  lookupAuthorName?: string | null;
}

export default function BookForm(props: BookFormProps) {
  const {
    formState,
    onFieldChange,
    onSubmit,
    onReset,
    submitButtonLabel,
    backButtonPath,
    onIsbnLookup,
    isbnLookupLoading,
    bookId,
    initialAuthor,
    lookupAuthorName,
  } = props;

  const formValues = formState.values;
  const formErrors = formState.errors;

  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [selectedAuthor, setSelectedAuthor] = React.useState<AuthorResponse | null>(
    initialAuthor ?? null,
  );

  const handleAuthorChange = React.useCallback(
    (author: AuthorResponse | null) => {
      setSelectedAuthor(author);
      onFieldChange('authorId', author?.id ?? null);
      onFieldChange('author', author?.name ?? null);
    },
    [onFieldChange],
  );

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setIsSubmitting(true);
      try {
        await onSubmit(formValues);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, onSubmit],
  );

  const handleTextFieldChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFieldChange(event.target.name as keyof BookFormState['values'], event.target.value);
    },
    [onFieldChange],
  );

  const handleNumberFieldChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onFieldChange(
        event.target.name as keyof BookFormState['values'],
        value === '' ? null : Number(value),
      );
    },
    [onFieldChange],
  );

  const handleSelectChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onFieldChange(
        event.target.name as keyof BookFormState['values'],
        value === '' ? null : Number(value),
      );
    },
    [onFieldChange],
  );

  // Series autocomplete state
  const [seriesOptions, setSeriesOptions] = React.useState<string[]>([]);
  const [seriesInputValue, setSeriesInputValue] = React.useState(formValues.seriesName ?? '');
  const [debouncedSeriesInput] = useDebounce(seriesInputValue, 300);

  React.useEffect(() => {
    setSeriesInputValue(formValues.seriesName ?? '');
  }, [formValues.seriesName]);

  React.useEffect(() => {
    const search = async () => {
      try {
        const results = await BooksService.searchSeries(debouncedSeriesInput || undefined);
        setSeriesOptions(results);
      } catch {
        setSeriesOptions([]);
      }
    };
    search();
  }, [debouncedSeriesInput]);

  const handleReset = React.useCallback(() => {
    if (onReset) {
      onReset(formValues);
    }
    setSelectedAuthor(initialAuthor ?? null);
  }, [formValues, onReset, initialAuthor]);

  const handleBack = React.useCallback(() => {
    navigate(backButtonPath ?? '/books');
  }, [navigate, backButtonPath]);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      autoComplete="off"
      onReset={handleReset}
      sx={{ width: '100%' }}
    >
      <FormGroup>
        <Grid container spacing={2} sx={{ mb: 2, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              value={formValues.title ?? ''}
              onChange={handleTextFieldChange}
              name="title"
              label="Title"
              error={!!formErrors.title}
              helperText={formErrors.title ?? ' '}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <AuthorField
              value={selectedAuthor}
              onChange={handleAuthorChange}
              initialAuthor={initialAuthor}
              lookupAuthorName={lookupAuthorName}
              error={formErrors.authorId}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              value={formValues.isbn13 ?? ''}
              onChange={handleTextFieldChange}
              onKeyDown={
                onIsbnLookup
                  ? (e) => {
                      if (e.key === 'Enter' && (formValues.isbn13 ?? '').trim()) {
                        e.preventDefault();
                        onIsbnLookup((formValues.isbn13 ?? '').trim());
                      }
                    }
                  : undefined
              }
              name="isbn13"
              label="ISBN-13"
              error={!!formErrors.isbn13}
              helperText={formErrors.isbn13 ?? ' '}
              fullWidth
              InputProps={
                onIsbnLookup
                  ? {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Look up book details by ISBN">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => onIsbnLookup((formValues.isbn13 ?? '').trim())}
                                disabled={!(formValues.isbn13 ?? '').trim() || isbnLookupLoading}
                                edge="end"
                              >
                                {isbnLookupLoading ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <SearchIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }
                  : undefined
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              value={formValues.isbn10 ?? ''}
              onChange={handleTextFieldChange}
              name="isbn10"
              label="ISBN-10"
              error={!!formErrors.isbn10}
              helperText={formErrors.isbn10 ?? ' '}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              type="number"
              value={formValues.publicationYear ?? ''}
              onChange={handleNumberFieldChange}
              name="publicationYear"
              label="Publication Year"
              error={!!formErrors.publicationYear}
              helperText={formErrors.publicationYear ?? ' '}
              fullWidth
              inputProps={{ min: 1900, max: 2100 }}
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              select
              value={formValues.publicationMonth ?? ''}
              onChange={handleSelectChange}
              name="publicationMonth"
              label="Publication Month"
              error={!!formErrors.publicationMonth}
              helperText={formErrors.publicationMonth ?? ' '}
              fullWidth
            >
              {MONTH_NAMES.map((month, index) => (
                <MenuItem key={index + 1} value={index + 1}>
                  {month}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              type="number"
              value={formValues.distributorAuthorRoyaltyRate ?? ''}
              onChange={handleNumberFieldChange}
              name="distributorAuthorRoyaltyRate"
              label="Distributor Royalty Rate"
              error={!!formErrors.distributorAuthorRoyaltyRate}
              helperText={formErrors.distributorAuthorRoyaltyRate ?? ' '}
              fullWidth
              inputProps={{ step: '0.01', min: 0, max: 1 }}
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              type="number"
              value={formValues.handsoldAuthorRoyaltyRate ?? ''}
              onChange={handleNumberFieldChange}
              name="handsoldAuthorRoyaltyRate"
              label="Handsold Royalty Rate"
              error={!!formErrors.handsoldAuthorRoyaltyRate}
              helperText={formErrors.handsoldAuthorRoyaltyRate ?? ' '}
              fullWidth
              inputProps={{ step: '0.01', min: 0, max: 1 }}
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <Autocomplete
              freeSolo
              options={seriesOptions}
              value={formValues.seriesName ?? null}
              inputValue={seriesInputValue}
              onInputChange={(_event, newInputValue) => {
                setSeriesInputValue(newInputValue);
              }}
              onChange={(_event, newValue) => {
                onFieldChange('seriesName', newValue ?? null);
                if (!newValue) {
                  onFieldChange('seriesPosition', null);
                }
              }}
              onBlur={() => {
                const trimmed = seriesInputValue.trim();
                if (trimmed && trimmed !== (formValues.seriesName ?? '')) {
                  onFieldChange('seriesName', trimmed);
                } else if (!trimmed) {
                  onFieldChange('seriesName', null);
                  onFieldChange('seriesPosition', null);
                }
              }}
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="seriesName"
                  label="Series Name"
                  error={!!formErrors.seriesName}
                  helperText={formErrors.seriesName ?? ' '}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              type="number"
              value={formValues.seriesPosition ?? ''}
              onChange={handleNumberFieldChange}
              name="seriesPosition"
              label="Series Position"
              error={!!formErrors.seriesPosition}
              helperText={formErrors.seriesPosition ?? ' '}
              fullWidth
              inputProps={{ min: 1, step: 1 }}
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              type="number"
              value={formValues.coverPrice ?? ''}
              onChange={handleNumberFieldChange}
              name="coverPrice"
              label="Cover Price"
              error={!!formErrors.coverPrice}
              helperText={formErrors.coverPrice ?? ' '}
              fullWidth
              inputProps={{ step: '0.01', min: 0 }}
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              type="number"
              value={formValues.printCost ?? ''}
              onChange={handleNumberFieldChange}
              name="printCost"
              label="Print Cost"
              error={!!formErrors.printCost}
              helperText={formErrors.printCost ?? ' '}
              fullWidth
              inputProps={{ step: '0.01', min: 0 }}
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <CoverImageField
              bookId={bookId}
              onFileChange={(file) => onFieldChange('coverImageFile', file)}
              error={formErrors.coverImageFile}
            />
          </Grid>
        </Grid>
      </FormGroup>
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
        <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
          {submitButtonLabel}
        </Button>
      </Stack>
    </Box>
  );
}
