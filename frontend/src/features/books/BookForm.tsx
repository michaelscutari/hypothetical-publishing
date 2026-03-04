import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthorsService, BooksService, type AuthorResponse, type BookResponse } from '@/api';
import { MONTH_NAMES } from '@/constants/months';

type BookFormValues = Partial<Omit<BookResponse, 'id' | 'totalSalesToDate'>> & {
  coverImageFile?: File | null;
};

const CREATE_NEW_SENTINEL: AuthorResponse = {
  id: -1,
  name: '+ Create new author',
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

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/gif,image/png,image/webp';

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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // previewUrl is always a blob URL — either created from a picked file,
  // or fetched from the server with credentials on edit load.
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const pickedFilePreview = React.useRef<string | null>(null);

  // On mount in edit mode, fetch the existing thumbnail with credentials.
  React.useEffect(() => {
    if (bookId == null) return;
    let blobUrl: string | null = null;

    fetch(`/api/books/${bookId}/cover/thumbnail`, { credentials: 'include' })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob) {
          blobUrl = URL.createObjectURL(blob);
          setPreviewUrl(blobUrl);
        }
      })
      .catch(() => {
        // No cover yet — leave preview empty.
      });

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [bookId]);

  // Revoke the picked-file blob URL on unmount.
  React.useEffect(() => {
    return () => {
      if (pickedFilePreview.current) {
        URL.revokeObjectURL(pickedFilePreview.current);
      }
    };
  }, []);

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;

      // Revoke any previous picked-file blob URL.
      if (pickedFilePreview.current) {
        URL.revokeObjectURL(pickedFilePreview.current);
        pickedFilePreview.current = null;
      }

      if (file) {
        const blobUrl = URL.createObjectURL(file);
        pickedFilePreview.current = blobUrl;
        setPreviewUrl(blobUrl);
        onFieldChange('coverImageFile', file);
      } else {
        onFieldChange('coverImageFile', null);
      }

      // Reset the input so the same file can be re-selected if needed.
      event.target.value = '';
    },
    [onFieldChange],
  );
  const handleClearImage = React.useCallback(() => {
    if (pickedFilePreview.current) {
      URL.revokeObjectURL(pickedFilePreview.current);
      pickedFilePreview.current = null;
    }
    setPreviewUrl(null);
    onFieldChange('coverImageFile', null);
    // Reset the file input so the same file can be re-selected if needed.
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFieldChange]);
  const handleChooseFile = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const [authorOptions, setAuthorOptions] = React.useState<AuthorResponse[]>([]);
  const [selectedAuthor, setSelectedAuthor] = React.useState<AuthorResponse | null>(
    initialAuthor ?? null,
  );
  const [authorSearchInput, setAuthorSearchInput] = React.useState('');
  const processedLookupRef = React.useRef<string | null>(null);

  const [createAuthorOpen, setCreateAuthorOpen] = React.useState(false);
  const [newAuthorName, setNewAuthorName] = React.useState('');
  const [newAuthorEmail, setNewAuthorEmail] = React.useState('');
  const [newAuthorErrors, setNewAuthorErrors] = React.useState<{
    name?: string;
    email?: string;
  }>({});
  const [isCreatingAuthor, setIsCreatingAuthor] = React.useState(false);

  React.useEffect(() => {
    if (initialAuthor) {
      setSelectedAuthor(initialAuthor);
    }
  }, [initialAuthor]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await BooksService.searchAuthors(undefined, 0, 25, true);
        if (!cancelled) {
          const items = response.content ?? [];
          const seen = new Set<number>();
          setAuthorOptions(
            items.filter((a) => {
              if (a.id == null || seen.has(a.id)) return false;
              seen.add(a.id);
              return true;
            }),
          );
        }
      } catch {
        if (!cancelled) setAuthorOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!lookupAuthorName || lookupAuthorName === processedLookupRef.current) return;
    if (authorOptions.length === 0) return;
    processedLookupRef.current = lookupAuthorName;
    const term = lookupAuthorName.toLowerCase();
    const match = authorOptions.find((a) => (a.name ?? '').toLowerCase() === term);
    if (match) {
      setSelectedAuthor(match);
      onFieldChange('authorId', match.id ?? null);
      onFieldChange('author', match.name ?? null);
    } else {
      setAuthorSearchInput(lookupAuthorName);
    }
  }, [lookupAuthorName, authorOptions, onFieldChange]);

  const handleAuthorChange = React.useCallback(
    (_event: React.SyntheticEvent, value: AuthorResponse | null) => {
      if (value?.id === CREATE_NEW_SENTINEL.id) {
        setNewAuthorName(authorSearchInput.trim());
        setNewAuthorEmail('');
        setNewAuthorErrors({});
        setCreateAuthorOpen(true);
        return;
      }
      setSelectedAuthor(value);
      onFieldChange('authorId', value?.id ?? null);
      onFieldChange('author', value?.name ?? null);
    },
    [onFieldChange, authorSearchInput],
  );

  const handleCreateAuthorSubmit = React.useCallback(async () => {
    const errors: { name?: string; email?: string } = {};
    if (!newAuthorName.trim()) errors.name = 'Name is required';
    if (!newAuthorEmail.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAuthorEmail))
      errors.email = 'Must be a valid email address';

    if (Object.keys(errors).length > 0) {
      setNewAuthorErrors(errors);
      return;
    }

    setIsCreatingAuthor(true);
    try {
      const created = await AuthorsService.createAuthor({
        name: newAuthorName.trim(),
        email: newAuthorEmail.trim(),
      });
      setAuthorOptions((prev) => [...prev, created]);
      setSelectedAuthor(created);
      onFieldChange('authorId', created.id ?? null);
      onFieldChange('author', created.name ?? null);
      setCreateAuthorOpen(false);
    } catch (err) {
      setNewAuthorErrors({ name: (err as Error).message });
    } finally {
      setIsCreatingAuthor(false);
    }
  }, [newAuthorName, newAuthorEmail, onFieldChange]);

  const displayedOptions = React.useMemo(
    () => [CREATE_NEW_SENTINEL, ...authorOptions],
    [authorOptions],
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
  const seriesDebounceRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setSeriesInputValue(formValues.seriesName ?? '');
  }, [formValues.seriesName]);

  React.useEffect(() => {
    if (seriesDebounceRef.current) window.clearTimeout(seriesDebounceRef.current);
    seriesDebounceRef.current = window.setTimeout(async () => {
      try {
        const results = await BooksService.searchSeries(seriesInputValue || undefined);
        setSeriesOptions(results);
      } catch {
        setSeriesOptions([]);
      }
    }, 300);
    return () => {
      if (seriesDebounceRef.current) window.clearTimeout(seriesDebounceRef.current);
    };
  }, [seriesInputValue]);

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
            <Autocomplete
              fullWidth
              options={displayedOptions}
              value={selectedAuthor}
              onChange={handleAuthorChange}
              inputValue={authorSearchInput}
              onInputChange={(_e, v) => setAuthorSearchInput(v)}
              getOptionLabel={(option) =>
                option.id === CREATE_NEW_SENTINEL.id ? '' : (option.name ?? '')
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={(options, { inputValue }) => {
                const term = inputValue.toLowerCase();
                return options.filter(
                  (o) =>
                    o.id === CREATE_NEW_SENTINEL.id ||
                    (o.name ?? '').toLowerCase().includes(term) ||
                    (o.email ?? '').toLowerCase().includes(term),
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Author"
                  error={!!formErrors.authorId}
                  helperText={formErrors.authorId ?? ' '}
                  placeholder="Search authors..."
                />
              )}
              renderOption={(props, option) =>
                option.id === CREATE_NEW_SENTINEL.id ? (
                  <li {...props}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ color: 'primary.main' }}
                    >
                      <AddIcon fontSize="small" />
                      <Typography variant="body2" fontWeight={600}>
                        Create new author
                        {authorSearchInput.trim() ? ` "${authorSearchInput.trim()}"` : ''}
                      </Typography>
                    </Stack>
                  </li>
                ) : (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      {option.email && (
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )
              }
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
                // Commit typed text as the value on blur
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

          {/* Cover Art */}
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                Cover Art
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {previewUrl && (
                  <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Box
                      component="img"
                      src={previewUrl}
                      alt="Cover preview"
                      sx={{
                        width: 80,
                        height: 120,
                        objectFit: 'contain',
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'block',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleClearImage}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        padding: '2px',
                        '&:hover': {
                          bgcolor: 'error.light',
                          borderColor: 'error.light',
                          color: 'white',
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button variant="outlined" size="small" onClick={handleChooseFile}>
                    {previewUrl ? 'Replace Image' : 'Choose Image'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    JPEG, PNG, GIF, or WEBP
                  </Typography>
                  {formErrors.coverImageFile && (
                    <Typography variant="caption" color="error">
                      {formErrors.coverImageFile}
                    </Typography>
                  )}
                </Box>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </Box>
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

      <Dialog
        open={createAuthorOpen}
        onClose={() => !isCreatingAuthor && setCreateAuthorOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Author</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={newAuthorName}
              onChange={(e) => {
                setNewAuthorName(e.target.value);
                setNewAuthorErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={!!newAuthorErrors.name}
              helperText={newAuthorErrors.name ?? ' '}
              fullWidth
              autoFocus
            />
            <TextField
              label="Email"
              value={newAuthorEmail}
              onChange={(e) => {
                setNewAuthorEmail(e.target.value);
                setNewAuthorErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={!!newAuthorErrors.email}
              helperText={newAuthorErrors.email ?? ' '}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAuthorOpen(false)} disabled={isCreatingAuthor}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateAuthorSubmit} loading={isCreatingAuthor}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
