import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import * as React from 'react';

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/gif,image/png,image/webp';

interface CoverImageFieldProps {
  bookId?: number;
  onFileChange: (file: File | null) => void;
  error?: string;
}

export default function CoverImageField({ bookId, onFileChange, error }: CoverImageFieldProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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

      if (pickedFilePreview.current) {
        URL.revokeObjectURL(pickedFilePreview.current);
        pickedFilePreview.current = null;
      }

      if (file) {
        const blobUrl = URL.createObjectURL(file);
        pickedFilePreview.current = blobUrl;
        setPreviewUrl(blobUrl);
        onFileChange(file);
      } else {
        onFileChange(null);
      }

      event.target.value = '';
    },
    [onFileChange],
  );

  const handleClearImage = React.useCallback(() => {
    if (pickedFilePreview.current) {
      URL.revokeObjectURL(pickedFilePreview.current);
      pickedFilePreview.current = null;
    }
    setPreviewUrl(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileChange]);

  const handleChooseFile = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
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
          {error && (
            <Typography variant="caption" color="error">
              {error}
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
  );
}
