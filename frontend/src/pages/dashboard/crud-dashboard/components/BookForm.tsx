// import * as React from 'react';
// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import CircularProgress from '@mui/material/CircularProgress';
// import FormGroup from '@mui/material/FormGroup';
// import Grid from '@mui/material/Grid';
// import IconButton from '@mui/material/IconButton';
// import InputAdornment from '@mui/material/InputAdornment';
// import Stack from '@mui/material/Stack';
// import TextField from '@mui/material/TextField';
// import Tooltip from '@mui/material/Tooltip';
// import MenuItem from '@mui/material/MenuItem';
// import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import SearchIcon from '@mui/icons-material/Search';
// import { useNavigate } from 'react-router-dom';
// import type { Book } from '../data/books';
// import { MONTH_NAMES } from '../../../../constants/months';

// export interface BookFormState {
//   values: Partial<Omit<Book, 'id' | 'totalSalesToDate'>>;
//   errors: Partial<Record<keyof BookFormState['values'], string>>;
// }

// export type FormFieldValue = string | string[] | number | boolean | File | null;

// export interface BookFormProps {
//   formState: BookFormState;
//   onFieldChange: (name: keyof BookFormState['values'], value: FormFieldValue) => void;
//   onSubmit: (formValues: Partial<BookFormState['values']>) => Promise<void>;
//   onReset?: (formValues: Partial<BookFormState['values']>) => void;
//   submitButtonLabel: string;
//   backButtonPath?: string;
//   onIsbnLookup?: (isbn: string) => Promise<void>;
//   isbnLookupLoading?: boolean;
// }

// export default function BookForm(props: BookFormProps) {
//   const {
//     formState,
//     onFieldChange,
//     onSubmit,
//     onReset,
//     submitButtonLabel,
//     backButtonPath,
//     onIsbnLookup,
//     isbnLookupLoading,
//   } = props;

//   const formValues = formState.values;
//   const formErrors = formState.errors;

//   const navigate = useNavigate();

//   const [isSubmitting, setIsSubmitting] = React.useState(false);

//   const handleSubmit = React.useCallback(
//     async (event: React.FormEvent<HTMLFormElement>) => {
//       event.preventDefault();

//       setIsSubmitting(true);
//       try {
//         await onSubmit(formValues);
//       } finally {
//         setIsSubmitting(false);
//       }
//     },
//     [formValues, onSubmit],
//   );

//   const handleTextFieldChange = React.useCallback(
//     (event: React.ChangeEvent<HTMLInputElement>) => {
//       onFieldChange(event.target.name as keyof BookFormState['values'], event.target.value);
//     },
//     [onFieldChange],
//   );

//   const handleNumberFieldChange = React.useCallback(
//     (event: React.ChangeEvent<HTMLInputElement>) => {
//       const value = event.target.value;
//       onFieldChange(
//         event.target.name as keyof BookFormState['values'],
//         value === '' ? null : Number(value),
//       );
//     },
//     [onFieldChange],
//   );

//   const handleSelectChange = React.useCallback(
//     (event: React.ChangeEvent<HTMLInputElement>) => {
//       const value = event.target.value;
//       onFieldChange(
//         event.target.name as keyof BookFormState['values'],
//         value === '' ? null : Number(value),
//       );
//     },
//     [onFieldChange],
//   );

//   const handleReset = React.useCallback(() => {
//     if (onReset) {
//       onReset(formValues);
//     }
//   }, [formValues, onReset]);

//   const handleBack = React.useCallback(() => {
//     navigate(backButtonPath ?? '/books');
//   }, [navigate, backButtonPath]);

//   return (
//     <Box
//       component="form"
//       onSubmit={handleSubmit}
//       noValidate
//       autoComplete="off"
//       onReset={handleReset}
//       sx={{ width: '100%' }}
//     >
//       <FormGroup>
//         <Grid container spacing={2} sx={{ mb: 2, width: '100%' }}>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               value={formValues.title ?? ''}
//               onChange={handleTextFieldChange}
//               name="title"
//               label="Title"
//               error={!!formErrors.title}
//               helperText={formErrors.title ?? ' '}
//               fullWidth
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               value={formValues.author ?? ''}
//               onChange={handleTextFieldChange}
//               name="author"
//               label="Author"
//               error={!!formErrors.author}
//               helperText={formErrors.author ?? ' '}
//               fullWidth
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               value={formValues.isbn13 ?? ''}
//               onChange={handleTextFieldChange}
//               onKeyDown={
//                 onIsbnLookup
//                   ? (e) => {
//                       if (e.key === 'Enter' && (formValues.isbn13 ?? '').trim()) {
//                         e.preventDefault();
//                         onIsbnLookup((formValues.isbn13 ?? '').trim());
//                       }
//                     }
//                   : undefined
//               }
//               name="isbn13"
//               label="ISBN-13"
//               error={!!formErrors.isbn13}
//               helperText={formErrors.isbn13 ?? ' '}
//               fullWidth
//               InputProps={
//                 onIsbnLookup
//                   ? {
//                       endAdornment: (
//                         <InputAdornment position="end">
//                           <Tooltip title="Look up book details by ISBN">
//                             <span>
//                               <IconButton
//                                 size="small"
//                                 onClick={() => onIsbnLookup((formValues.isbn13 ?? '').trim())}
//                                 disabled={!(formValues.isbn13 ?? '').trim() || isbnLookupLoading}
//                                 edge="end"
//                               >
//                                 {isbnLookupLoading ? (
//                                   <CircularProgress size={20} />
//                                 ) : (
//                                   <SearchIcon />
//                                 )}
//                               </IconButton>
//                             </span>
//                           </Tooltip>
//                         </InputAdornment>
//                       ),
//                     }
//                   : undefined
//               }
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               value={formValues.isbn10 ?? ''}
//               onChange={handleTextFieldChange}
//               name="isbn10"
//               label="ISBN-10"
//               error={!!formErrors.isbn10}
//               helperText={formErrors.isbn10 ?? ' '}
//               fullWidth
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               type="number"
//               value={formValues.publicationYear ?? ''}
//               onChange={handleNumberFieldChange}
//               name="publicationYear"
//               label="Publication Year"
//               error={!!formErrors.publicationYear}
//               helperText={formErrors.publicationYear ?? ' '}
//               fullWidth
//               inputProps={{ min: 1900, max: 2100 }}
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               select
//               value={formValues.publicationMonth ?? ''}
//               onChange={handleSelectChange}
//               name="publicationMonth"
//               label="Publication Month"
//               error={!!formErrors.publicationMonth}
//               helperText={formErrors.publicationMonth ?? ' '}
//               fullWidth
//             >
//               {MONTH_NAMES.map((month, index) => (
//                 <MenuItem key={index + 1} value={index + 1}>
//                   {month}
//                 </MenuItem>
//               ))}
//             </TextField>
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               type="number"
//               value={formValues.distributorAuthorRoyaltyRate ?? ''}
//               onChange={handleNumberFieldChange}
//               name="distributorAuthorRoyaltyRate"
//               label="Distributor Royalty Rate"
//               error={!!formErrors.distributorAuthorRoyaltyRate}
//               helperText={formErrors.distributorAuthorRoyaltyRate ?? ' '}
//               fullWidth
//               inputProps={{ step: '0.01', min: 0, max: 1 }}
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               type="number"
//               value={formValues.handsoldAuthorRoyaltyRate ?? ''}
//               onChange={handleNumberFieldChange}
//               name="handsoldAuthorRoyaltyRate"
//               label="Handsold Royalty Rate"
//               error={!!formErrors.handsoldAuthorRoyaltyRate}
//               helperText={formErrors.handsoldAuthorRoyaltyRate ?? ' '}
//               fullWidth
//               inputProps={{ step: '0.01', min: 0, max: 1 }}
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               value={formValues.seriesName ?? ''}
//               onChange={handleTextFieldChange}
//               name="seriesName"
//               label="Series Name"
//               error={!!formErrors.seriesName}
//               helperText={formErrors.seriesName ?? ' '}
//               fullWidth
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               type="number"
//               value={formValues.seriesPosition ?? ''}
//               onChange={handleNumberFieldChange}
//               name="seriesPosition"
//               label="Series Position"
//               error={!!formErrors.seriesPosition}
//               helperText={formErrors.seriesPosition ?? ' '}
//               fullWidth
//               inputProps={{ min: 1, step: 1 }}
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               type="number"
//               value={formValues.coverPrice ?? ''}
//               onChange={handleNumberFieldChange}
//               name="coverPrice"
//               label="Cover Price"
//               error={!!formErrors.coverPrice}
//               helperText={formErrors.coverPrice ?? ' '}
//               fullWidth
//               inputProps={{ step: '0.01', min: 0 }}
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               type="number"
//               value={formValues.printCost ?? ''}
//               onChange={handleNumberFieldChange}
//               name="printCost"
//               label="Print Cost"
//               error={!!formErrors.printCost}
//               helperText={formErrors.printCost ?? ' '}
//               fullWidth
//               inputProps={{ step: '0.01', min: 0 }}
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
//             <TextField
//               value={formValues.coverImage ?? ''}
//               onChange={handleTextFieldChange}
//               name="coverImage"
//               label="Cover Image URL"
//               error={!!formErrors.coverImage}
//               helperText={formErrors.coverImage ?? ' '}
//               fullWidth
//             />
//           </Grid>
//         </Grid>
//       </FormGroup>
//       <Stack direction="row" spacing={2} justifyContent="space-between">
//         <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
//           Back
//         </Button>
//         <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
//           {submitButtonLabel}
//         </Button>
//       </Stack>
//     </Box>
//   );
// }
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
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
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { MONTH_NAMES } from '../../../../constants/months';
import type { Book } from '../data/books';

type BookFormValues = Partial<Omit<Book, 'id' | 'totalSalesToDate'>> & {
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

  const handleChooseFile = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              value={formValues.seriesName ?? ''}
              onChange={handleTextFieldChange}
              name="seriesName"
              label="Series Name"
              error={!!formErrors.seriesName}
              helperText={formErrors.seriesName ?? ' '}
              fullWidth
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
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Cover preview"
                    sx={{
                      width: 80,
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      flexShrink: 0,
                    }}
                  />
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
    </Box>
  );
}