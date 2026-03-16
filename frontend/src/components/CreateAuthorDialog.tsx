import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import { AuthorsService, type AuthorResponse } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { validateAuthor } from '@/features/authors/authorValidation';

interface CreateAuthorDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (author: AuthorResponse) => void;
  initialName?: string;
}

export default function CreateAuthorDialog({
  open,
  onClose,
  onCreated,
  initialName = '',
}: CreateAuthorDialogProps) {
  const [name, setName] = React.useState(initialName);
  const [email, setEmail] = React.useState('');
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>({});
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(initialName);
      setEmail('');
      setErrors({});
    }
  }, [open, initialName]);

  const handleSubmit = React.useCallback(async () => {
    const validationErrors = validateAuthor({ name, email });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsCreating(true);
    try {
      const created = await AuthorsService.createAuthor({
        name: name.trim(),
        email: email.trim(),
      });
      onCreated(created);
    } catch (err) {
      setErrors({ name: getErrorMessage(err) });
    } finally {
      setIsCreating(false);
    }
  }, [name, email, onCreated]);

  return (
    <Dialog open={open} onClose={() => !isCreating && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Author</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={!!errors.name}
            helperText={errors.name ?? ' '}
            fullWidth
            autoFocus
          />
          <TextField
            label="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={!!errors.email}
            helperText={errors.email ?? ' '}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} loading={isCreating}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
