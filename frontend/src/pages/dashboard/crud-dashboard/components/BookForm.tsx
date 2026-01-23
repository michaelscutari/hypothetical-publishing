import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../data/books';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface BookFormState {
  values: Partial<Omit<Book, 'id' | 'totalSalesToDate'>>;
  errors: Partial<Record<keyof BookFormState['values'], string>>;
}

export type FormFieldValue = string | string[] | number | boolean | File | null;

export interface BookFormProps {
  formState: BookFormState;
  onFieldChange: (name: keyof BookFormState['values'], value: FormFieldValue) => void;
  onSubmit: (formValues: Partial<BookFormState['values']>) => Promise<void>;
  onReset?: (formValues: Partial<BookFormState['values']>) => void;
  submitButtonLabel: string;
  backButtonPath?: string;
}

export default function BookForm(props: BookFormProps) {
  const { formState, onFieldChange, onSubmit, onReset, submitButtonLabel, backButtonPath } = props;

  const formValues = formState.values;
  const formErrors = formState.errors;

  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const handleReset = React.useCallback(() => {
    if (onReset) {
      onReset(formValues);
    }
  }, [formValues, onReset]);

  const handleBack = React.useCallback(() => {
    navigate(backButtonPath ?? '/dashboard/books');
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
            <TextField
              value={formValues.author ?? ''}
              onChange={handleTextFieldChange}
              name="author"
              label="Author"
              error={!!formErrors.author}
              helperText={formErrors.author ?? ' '}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              value={formValues.isbn13 ?? ''}
              onChange={handleTextFieldChange}
              name="isbn13"
              label="ISBN-13"
              error={!!formErrors.isbn13}
              helperText={formErrors.isbn13 ?? ' '}
              fullWidth
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
              value={formValues.royaltyRate ?? ''}
              onChange={handleNumberFieldChange}
              name="royaltyRate"
              label="Royalty Rate"
              error={!!formErrors.royaltyRate}
              helperText={formErrors.royaltyRate ?? ' '}
              fullWidth
              inputProps={{ step: '0.01', min: 0, max: 1 }}
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
