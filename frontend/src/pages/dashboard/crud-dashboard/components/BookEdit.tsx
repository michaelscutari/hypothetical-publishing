import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FullPageLoader from '../../../../components/FullPageLoader';
import { BookCoversService } from '../../../../api/generated';
import {
  getOne as getBook,
  updateOne as updateBook,
  validate as validateBook,
  type Book,
} from '../data/books';
import useNotifications from '../hooks/useNotifications/useNotifications';
import BookForm, { type BookFormState, type FormFieldValue } from './BookForm';
import PageContainer from './PageContainer';

function BookEditForm({
  initialValues,
  bookId,
  onSubmit,
}: {
  initialValues: Partial<BookFormState['values']>;
  bookId: number;
  onSubmit: (formValues: Partial<BookFormState['values']>) => Promise<void>;
}) {
  const navigate = useNavigate();

  const notifications = useNotifications();
  const coverRemovedRef = React.useRef(false);

  const [formState, setFormState] = React.useState<BookFormState>(() => ({
    values: initialValues,
    errors: {},
  }));
  const formValues = formState.values;

  const setFormValues = React.useCallback((newFormValues: Partial<BookFormState['values']>) => {
    setFormState((previousState) => ({
      ...previousState,
      values: { ...previousState.values, ...newFormValues },
    }));
  }, []);

  const setFormErrors = React.useCallback((newFormErrors: Partial<BookFormState['errors']>) => {
    setFormState((previousState) => ({
      ...previousState,
      errors: { ...previousState.errors, ...newFormErrors },
    }));
  }, []);

  const handleFormFieldChange = React.useCallback(
    (name: keyof BookFormState['values'], value: FormFieldValue) => {
      if (name === 'coverImageFile' && value === null) {
        coverRemovedRef.current = true;
      } else if (name === 'coverImageFile') {
        coverRemovedRef.current = false;
      }
      setFormState((prev) => {
        const newValues = { ...prev.values, [name]: value };
        const { issues } = validateBook(newValues);
        const fieldError = issues?.find((issue) => issue.path?.[0] === name)?.message ?? undefined;

        return {
          ...prev,
          values: newValues,
          errors: { ...prev.errors, [name]: fieldError },
        };
      });
    },
    [],
  );

  const handleFormReset = React.useCallback(() => {
    setFormValues(initialValues);
  }, [initialValues, setFormValues]);

  const handleFormSubmit = React.useCallback(async () => {
    const { issues } = validateBook(formValues);
    if (issues && issues.length > 0) {
      setFormErrors(Object.fromEntries(issues.map((issue) => [issue.path?.[0], issue.message])));
      return;
    }
    setFormErrors({});

    try {
      await onSubmit(formValues);
      const coverFile =
        formValues.coverImageFile instanceof File ? formValues.coverImageFile : null;

      if (coverFile) {
        try {
          await BookCoversService.uploadCover(bookId, { file: coverFile });
        } catch {
          notifications.show('Book saved, but cover upload failed. You can retry from this page.', {
            severity: 'warning',
            autoHideDuration: 5000,
          });
          navigate(`/books/${bookId}`);
          return;
        }
      } else if (coverRemovedRef.current) {
        try {
          await BookCoversService.deleteCover(bookId);
        } catch {
          notifications.show('Book saved, but cover removal failed.', {
            severity: 'warning',
            autoHideDuration: 5000,
          });
          navigate(`/books/${bookId}`);
          return;
        }
      }

      notifications.show('Book edited successfully.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      navigate(`/books/${bookId}`);
    } catch (editError) {
      notifications.show(`Failed to edit book. Reason: ${(editError as Error).message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      throw editError;
    }
  }, [formValues, bookId, navigate, notifications, onSubmit, setFormErrors]);

  return (
    <BookForm
      formState={formState}
      onFieldChange={handleFormFieldChange}
      onSubmit={handleFormSubmit}
      onReset={handleFormReset}
      submitButtonLabel="Save"
      backButtonPath={`/books/${bookId}`}
      bookId={bookId}
    />
  );
}

export default function BookEdit() {
  const { bookId } = useParams();

  const [book, setBook] = React.useState<Book | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const showData = await getBook(Number(bookId));
      setBook(showData);
    } catch (showDataError) {
      setError(showDataError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = React.useCallback(
    async (formValues: Partial<BookFormState['values']>) => {
      const updatedData = await updateBook(Number(bookId), formValues);
      setBook(updatedData);
    },
    [bookId],
  );

  const renderEdit = React.useMemo(() => {
    if (isLoading) {
      return (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            m: 1,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ flexGrow: 1 }}>
          <Alert severity="error">{error.message}</Alert>
        </Box>
      );
    }

    return book ? (
      <BookEditForm initialValues={book} bookId={Number(bookId)} onSubmit={handleSubmit} />
    ) : null;
  }, [isLoading, error, book, bookId, handleSubmit]);

  const truncate = (value: string | undefined, maxLength = 30) =>
    value && value.length > maxLength ? `${value.slice(0, maxLength)}…` : (value ?? '');

  if (isLoading) {
    return <FullPageLoader />;
  }
  return (
    <PageContainer
      title={book?.title ?? 'Edit Book'}
      breadcrumbs={[
        { title: 'Books', path: '/books' },
        { title: truncate(book?.title) || 'Book', path: `/books/${bookId}` },
        { title: 'Edit' },
      ]}
    >
      <Box sx={{ display: 'flex', flex: 1 }}>{renderEdit}</Box>
    </PageContainer>
  );
}
