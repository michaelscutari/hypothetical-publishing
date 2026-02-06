import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ApiError, BooksService } from '../../../../api/generated';
import type { BookLookupResponse } from '../../../../api/generated';
import useNotifications from '../hooks/useNotifications/useNotifications';

interface IsbnLookupProps {
  onLookupSuccess: (data: BookLookupResponse) => void;
}

export default function IsbnLookup({ onLookupSuccess }: IsbnLookupProps) {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [expanded, setExpanded] = React.useState(false);
  const [isbn, setIsbn] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleToggle = React.useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleIsbnChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIsbn(event.target.value);
    setError('');
  }, []);

  const handleLookup = React.useCallback(async () => {
    if (!isbn.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await BooksService.lookupBookByIsbn(isbn.trim());
      onLookupSuccess(data);
      setExpanded(false);
      setIsbn('');
      notifications.show('Book details prefilled from ISBN lookup.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.status) {
          case 400:
            setError(err.body?.message ?? 'Invalid ISBN format');
            break;
          case 404:
            notifications.show('No book found for this ISBN.', {
              severity: 'info',
              autoHideDuration: 4000,
            });
            break;
          case 409: {
            const existingId = err.body?.id;
            notifications.show('A book with this ISBN already exists.', {
              severity: 'warning',
              autoHideDuration: 6000,
              actionText: 'View Book',
              onAction: () => {
                if (existingId) {
                  navigate(`/dashboard/books/${existingId}`);
                }
              },
            });
            break;
          }
          case 502:
            notifications.show(
              'ISBN lookup service is unavailable. You can fill out the form manually.',
              { severity: 'error', autoHideDuration: 5000 },
            );
            break;
          default:
            notifications.show('An unexpected error occurred during ISBN lookup.', {
              severity: 'error',
              autoHideDuration: 4000,
            });
        }
      } else {
        notifications.show('An unexpected error occurred during ISBN lookup.', {
          severity: 'error',
          autoHideDuration: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isbn, onLookupSuccess, navigate, notifications]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && isbn.trim()) {
        event.preventDefault();
        handleLookup();
      }
    },
    [isbn, handleLookup],
  );

  return (
    <div>
      <Button
        variant="text"
        size="small"
        onClick={handleToggle}
        startIcon={expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
        sx={{ mb: 1, textTransform: 'none' }}
      >
        Lookup by ISBN
      </Button>
      <Collapse in={expanded}>
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
          <TextField
            value={isbn}
            onChange={handleIsbnChange}
            onKeyDown={handleKeyDown}
            label="Enter ISBN"
            size="small"
            error={!!error}
            helperText={error || ' '}
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleLookup}
            disabled={!isbn.trim()}
            loading={loading}
            sx={{ mt: '4px' }}
          >
            Lookup
          </Button>
        </Stack>
      </Collapse>
    </div>
  );
}
