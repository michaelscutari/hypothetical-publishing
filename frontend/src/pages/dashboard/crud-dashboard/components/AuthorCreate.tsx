import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthorsService } from '../../../../api';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';
interface FormState {
  name: string;
  email: string;
  errors: { name?: string; email?: string };
}
export default function AuthorCreate() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [form, setForm] = React.useState<FormState>({ name: '', email: '', errors: {} });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const validate = (values: Pick<FormState, 'name' | 'email'>) => {
    const errors: FormState['errors'] = {};
    if (!values.name.trim()) errors.name = 'Name is required';
    if (!values.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      errors.email = 'Must be a valid email address';
    return errors;
  };
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      const errors = validate(next);
      return { ...next, errors: { ...prev.errors, [name]: errors[name as keyof typeof errors] } };
    });
  }, []);
  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errors = validate(form);
      if (Object.keys(errors).length > 0) {
        setForm((prev) => ({ ...prev, errors }));
        return;
      }
      setIsSubmitting(true);
      try {
        await AuthorsService.createAuthor({ name: form.name.trim(), email: form.email.trim() });
        notifications.show('Author created successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });
        navigate('/authors');
      } catch (err) {
        notifications.show(`Failed to create author. Reason: ${(err as Error).message}`, {
          severity: 'error',
          autoHideDuration: 3000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, navigate, notifications],
  );
  return (
    <PageContainer
      title="New Author"
      breadcrumbs={[{ title: 'Authors', path: '/authors' }, { title: 'New' }]}
    >
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
        </Grid>
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/authors')}
          >
            Back
          </Button>
          <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
            Create
          </Button>
        </Stack>
      </Box>
    </PageContainer>
  );
}
