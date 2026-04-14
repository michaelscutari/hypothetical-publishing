import { AuthorsService, type AuthorResponse } from '@/api';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import { getErrorMessage } from '@/utils/error';
import { truncate } from '@/utils/formatting';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validateAuthor, type AuthorFormState } from './authorValidation';

export default function AuthorEdit() {
  const { authorId } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [author, setAuthor] = React.useState<AuthorResponse | null>(null);
  const [form, setForm] = React.useState<AuthorFormState>({ name: '', email: '', errors: {} });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const authorData = await AuthorsService.getAuthorById(Number(authorId));
      setAuthor(authorData);
      setForm({
  name: authorData.name,
  email: authorData.email ?? '',
  paypalAccount: authorData.paypalAccount ?? '',
  venmoAccount: authorData.venmoAccount ?? '',
  errors: {},
});
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [authorId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      const errors = validateAuthor(next);
      return { ...next, errors: { ...prev.errors, [name]: errors[name as keyof typeof errors] } };
    });
  }, []);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errors = validateAuthor(form);
      if (Object.keys(errors).length > 0) {
        setForm((prev) => ({ ...prev, errors }));
        return;
      }

      setIsSubmitting(true);
      try {
        await AuthorsService.updateAuthor(Number(authorId), {
  name: form.name.trim(),
  email: form.email.trim(),
  paypalAccount: form.paypalAccount?.trim() || undefined,
  venmoAccount: form.venmoAccount?.trim() || undefined,
});
        notifications.show('Author updated successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });
        navigate(`/authors/${authorId}`);
      } catch (err) {
        notifications.show(`Failed to update author. Reason: ${getErrorMessage(err)}`, {
          severity: 'error',
          autoHideDuration: 3000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, authorId, navigate, notifications],
  );

  if (isLoading) return <FullPageLoader />;

  return (
    <PageContainer
      title={author?.name ?? 'Edit Author'}
      breadcrumbs={[
        { title: 'Authors', path: '/authors' },
        { title: author ? truncate(author.name) : 'Author', path: `/authors/${authorId}` },
        { title: 'Edit' },
      ]}
    >
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="name"
                label="Name"
                value={form.name}
                onChange={handleChange}
                error={!!form.errors.name}
                helperText={form.errors.name ?? ' '}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="email"
                label="Email"
                value={form.email}
                onChange={handleChange}
                error={!!form.errors.email}
                helperText={form.errors.email ?? ' '}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
  <TextField
    name="paypalAccount"
    label="PayPal Account (paypal.me username)"
    value={form.paypalAccount ?? ''}
    onChange={handleChange}
    helperText=" "
    fullWidth
  />
</Grid>
<Grid size={{ xs: 12, sm: 6 }}>
  <TextField
    name="venmoAccount"
    label="Venmo Account"
    value={form.venmoAccount ?? ''}
    onChange={handleChange}
    helperText=" "
    fullWidth
  />
</Grid>
          </Grid>

          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/authors/${authorId}`)}
            >
              Back
            </Button>
            <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
              Save
            </Button>
          </Stack>
        </Box>
      )}
    </PageContainer>
  );
}
