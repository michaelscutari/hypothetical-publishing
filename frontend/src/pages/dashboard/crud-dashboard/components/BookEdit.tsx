import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate, useParams } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications/useNotifications';
import {
  getOne as getBook,
  updateOne as updateBook,
  validate as validateBook,
  type Book,
} from '../data/books';
import BookForm, { type FormFieldValue, type BookFormState } from './BookForm';
import PageContainer from './PageContainer';

function BookEditForm({
  initialValues,
  onSubmit,
}: {
  initialValues: Partial<BookFormState['values']>;
  onSubmit: (formValues: Partial<BookFormState['values']>) => Promise<void>;
}) {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const notifications = useNotifications();

  const [formState, setFormState] = React.useState<BookFormState>(() => ({
    values: initialValues,
    errors: {},
  }));
  const formValues = formState.values;
  const formErrors = formState.errors;

  const setFormValues = React.useCallback((newFormValues: Partial<BookFormState['values']>) => {
    setFormState((previousState) => ({
      ...previousState,
      values: newFormValues,
    }));
  }, []);

  const setFormErrors = React.useCallback((newFormErrors: Partial<BookFormState['errors']>) => {
    setFormState((previousState) => ({
      ...previousState,
      errors: newFormErrors,
    }));
  }, []);

  const handleFormFieldChange = React.useCallback(
    (name: keyof BookFormState['values'], value: FormFieldValue) => {
      const validateField = async (values: Partial<BookFormState['values']>) => {
        const { issues } = validateBook(values);
        setFormErrors({
          ...formErrors,
          [name]: issues?.find((issue) => issue.path?.[0] === name)?.message,
        });
      };

      const newFormValues = { ...formValues, [name]: value };

      setFormValues(newFormValues);
      validateField(newFormValues);
    },
    [formValues, formErrors, setFormErrors, setFormValues],
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
      notifications.show('Book edited successfully.', {
        severity: 'success',
        autoHideDuration: 3000,
      });

      navigate('/dashboard/books');
    } catch (editError) {
      notifications.show(`Failed to edit book. Reason: ${(editError as Error).message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      throw editError;
    }
  }, [formValues, navigate, notifications, onSubmit, setFormErrors]);

  return (
    <BookForm
      formState={formState}
      onFieldChange={handleFormFieldChange}
      onSubmit={handleFormSubmit}
      onReset={handleFormReset}
      submitButtonLabel="Save"
      backButtonPath={`/dashboard/books/${bookId}`}
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
    }
    setIsLoading(false);
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

    return book ? <BookEditForm initialValues={book} onSubmit={handleSubmit} /> : null;
  }, [isLoading, error, book, handleSubmit]);

  return (
    <PageContainer
      title={`Edit Book ${bookId}`}
      breadcrumbs={[
        { title: 'Books', path: '/dashboard/books' },
        { title: `Book ${bookId}`, path: `/dashboard/books/${bookId}` },
        { title: 'Edit' },
      ]}
    >
      <Box sx={{ display: 'flex', flex: 1 }}>{renderEdit}</Box>
    </PageContainer>
  );
}
