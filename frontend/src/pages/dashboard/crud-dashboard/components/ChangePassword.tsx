import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';

export default function ChangePassword() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const passwordsDoNotMatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const formIsValid =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    !passwordsDoNotMatch;

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (!formIsValid) return;

      setIsSubmitting(true);
      try {
        await changePassword(currentPassword, newPassword, confirmPassword);

        notifications.show('Password changed successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });

        // Clear form and navigate back
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        navigate('/');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to change password.';
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formIsValid,
      currentPassword,
      newPassword,
      confirmPassword,
      changePassword,
      notifications,
      navigate,
    ],
  );

  const handleBack = React.useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <PageContainer title="Change Password" breadcrumbs={[{ title: 'Change Password' }]}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ width: '100%', maxWidth: 600 }}
      >
        <Alert severity="warning" sx={{ mb: 2 }}>
          Changing your password will log you out of all other devices for security reasons.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={2} sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <FormLabel htmlFor="current-password">Current Password</FormLabel>
            <TextField
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              required
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="new-password">New Password</FormLabel>
            <TextField
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              required
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="confirm-password">Confirm New Password</FormLabel>
            <TextField
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={passwordsDoNotMatch}
              helperText={passwordsDoNotMatch ? 'Passwords do not match.' : undefined}
              fullWidth
              required
            />
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!formIsValid || isSubmitting}
            loading={isSubmitting}
          >
            Change Password
          </Button>
        </Stack>
      </Box>
    </PageContainer>
  );
}
