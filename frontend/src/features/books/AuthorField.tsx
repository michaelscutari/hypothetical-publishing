import AddIcon from '@mui/icons-material/Add';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { BooksService, type AuthorResponse } from '@/api';
import CreateAuthorDialog from '@/components/CreateAuthorDialog';

const CREATE_NEW_SENTINEL: AuthorResponse = {
  id: -1,
  name: '+ Create new author',
  bookCount: 0,
  totalRoyalty: 0,
  paidRoyalty: 0,
  unpaidRoyalty: 0,
};

interface AuthorFieldProps {
  value: AuthorResponse | null;
  onChange: (author: AuthorResponse | null) => void;
  initialAuthor?: AuthorResponse | null;
  lookupAuthorName?: string | null;
  error?: string;
}

export default function AuthorField({
  value,
  onChange,
  initialAuthor,
  lookupAuthorName,
  error,
}: AuthorFieldProps) {
  const [authorOptions, setAuthorOptions] = React.useState<AuthorResponse[]>([]);
  const [selectedAuthor, setSelectedAuthor] = React.useState<AuthorResponse | null>(
    initialAuthor ?? null,
  );
  const [authorSearchInput, setAuthorSearchInput] = React.useState('');
  const processedLookupRef = React.useRef<string | null>(null);

  const [createAuthorOpen, setCreateAuthorOpen] = React.useState(false);
  const [createAuthorInitialName, setCreateAuthorInitialName] = React.useState('');

  // Sync from parent when value is set externally (e.g. reset)
  React.useEffect(() => {
    if (initialAuthor) {
      setSelectedAuthor(initialAuthor);
    }
  }, [initialAuthor]);

  // Keep internal state in sync with prop
  React.useEffect(() => {
    setSelectedAuthor(value);
  }, [value]);

  // Load initial author options
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

  // Auto-select author from ISBN lookup
  React.useEffect(() => {
    if (!lookupAuthorName || lookupAuthorName === processedLookupRef.current) return;
    if (authorOptions.length === 0) return;
    processedLookupRef.current = lookupAuthorName;
    const term = lookupAuthorName.toLowerCase();
    const match = authorOptions.find((a) => a.name.toLowerCase() === term);
    if (match) {
      setSelectedAuthor(match);
      onChange(match);
    } else {
      setAuthorSearchInput(lookupAuthorName);
    }
  }, [lookupAuthorName, authorOptions, onChange]);

  const handleAuthorChange = React.useCallback(
    (_event: React.SyntheticEvent, newValue: AuthorResponse | null) => {
      if (newValue?.id === CREATE_NEW_SENTINEL.id) {
        setCreateAuthorInitialName(authorSearchInput.trim());
        setCreateAuthorOpen(true);
        return;
      }
      setSelectedAuthor(newValue);
      onChange(newValue);
    },
    [onChange, authorSearchInput],
  );

  const handleAuthorCreated = React.useCallback(
    (created: AuthorResponse) => {
      setAuthorOptions((prev) => [...prev, created]);
      setSelectedAuthor(created);
      onChange(created);
      setCreateAuthorOpen(false);
    },
    [onChange],
  );

  const displayedOptions = React.useMemo(
    () => [CREATE_NEW_SENTINEL, ...authorOptions],
    [authorOptions],
  );

  return (
    <>
      <Autocomplete
        fullWidth
        options={displayedOptions}
        value={selectedAuthor}
        onChange={handleAuthorChange}
        inputValue={authorSearchInput}
        onInputChange={(_e, v) => setAuthorSearchInput(v)}
        getOptionLabel={(option) => (option.id === CREATE_NEW_SENTINEL.id ? '' : option.name)}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        filterOptions={(options, { inputValue }) => {
          const term = inputValue.toLowerCase();
          return options.filter(
            (o) =>
              o.id === CREATE_NEW_SENTINEL.id ||
              o.name.toLowerCase().includes(term) ||
              (o.email ?? '').toLowerCase().includes(term),
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Author"
            error={!!error}
            helperText={error ?? ' '}
            placeholder="Search authors..."
          />
        )}
        renderOption={(props, option) =>
          option.id === CREATE_NEW_SENTINEL.id ? (
            <li {...props}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'primary.main' }}>
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
      <CreateAuthorDialog
        open={createAuthorOpen}
        onClose={() => setCreateAuthorOpen(false)}
        onCreated={handleAuthorCreated}
        initialName={createAuthorInitialName}
      />
    </>
  );
}
