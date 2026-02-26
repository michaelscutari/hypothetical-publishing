import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, BooksService, type BookLookupResponse } from '../../../../api/generated';
import { createOne as createBook, validate as validateBook, type Book } from '../data/books';
import useNotifications from '../hooks/useNotifications/useNotifications';
import BookForm, { type BookFormState, type FormFieldValue } from './BookForm';
import PageContainer from './PageContainer';

const INITIAL_FORM_VALUES: Partial<BookFormState['values']> = {
  distributorAuthorRoyaltyRate: 0.5,
  handsoldAuthorRoyaltyRate: 0.2,
  publicationYear: new Date().getFullYear(),
  publicationMonth: 1,
  coverPrice: 0,
  printCost: 0,
};

export default function BookCreate() {
  const navigate = useNavigate();

  const notifications = useNotifications();

  const [formState, setFormState] = React.useState<BookFormState>(() => ({
    values: INITIAL_FORM_VALUES,
    errors: {},
  }));
  const formValues = formState.values;
  const formErrors = formState.errors;
  const [lookupAuthorName, setLookupAuthorName] = React.useState<string | null>(null);

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
      setFormState((prev) => {
        const newValues = { ...prev.values, [name]: value };
        const { issues } = validateBook(newValues);
        const fieldError = issues?.find((issue) => issue.path?.[0] === name)?.message;
        return {
          ...prev,
          values: newValues,
          errors: { ...prev.errors, [name]: fieldError },
        };
      });
    },
    [],
  );

  const [isbnLookupLoading, setIsbnLookupLoading] = React.useState(false);

  const applyLookupData = React.useCallback(
    (data: BookLookupResponse) => {
      const newValues: Partial<BookFormState['values']> = {
        ...formValues,
        title: data.title ?? formValues.title,
        isbn13: data.isbn13 ?? formValues.isbn13,
        isbn10: data.isbn10 ?? formValues.isbn10,
        publicationYear: data.publicationYear ?? formValues.publicationYear,
        publicationMonth: data.publicationMonth ?? formValues.publicationMonth,
      };
      setFormValues(newValues);
      if (data.author) {
        setLookupAuthorName(data.author);
      }
      const { issues } = validateBook(newValues);
      if (issues && issues.length > 0) {
        setFormErrors(Object.fromEntries(issues.map((issue) => [issue.path?.[0], issue.message])));
      } else {
        setFormErrors({});
      }
    },
    [formValues, setFormValues, setFormErrors],
  );

  const handleIsbnLookup = React.useCallback(
    async (isbn: string) => {
      if (!isbn) return;
      setIsbnLookupLoading(true);
      try {
        const data = await BooksService.lookupBookByIsbn(isbn);
        applyLookupData(data);
        notifications.show('Book details prefilled from ISBN lookup.', {
          severity: 'success',
          autoHideDuration: 3000,
        });
      } catch (err) {
        if (err instanceof ApiError) {
          switch (err.status) {
            case 400:
              setFormErrors({ ...formErrors, isbn13: err.body?.message ?? 'Invalid ISBN format' });
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
                  if (existingId) navigate(`/books/${existingId}`);
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
        setIsbnLookupLoading(false);
      }
    },
    [applyLookupData, formErrors, setFormErrors, navigate, notifications],
  );

  const handleFormReset = React.useCallback(() => {
    setFormValues(INITIAL_FORM_VALUES);
  }, [setFormValues]);

  const handleFormSubmit = React.useCallback(async () => {
    const { issues } = validateBook(formValues);
    if (issues && issues.length > 0) {
      setFormErrors(Object.fromEntries(issues.map((issue) => [issue.path?.[0], issue.message])));
      return;
    }
    setFormErrors({});

    try {
      await createBook(formValues as Omit<Book, 'id' | 'totalSalesToDate'>);
      notifications.show('Book created successfully.', {
        severity: 'success',
        autoHideDuration: 3000,
      });

      navigate('/books');
    } catch (createError) {
      notifications.show(`Failed to create book. Reason: ${(createError as Error).message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      throw createError;
    }
  }, [formValues, navigate, notifications, setFormErrors]);

  return (
    <PageContainer
      title="New Book"
      breadcrumbs={[{ title: 'Books', path: '/books' }, { title: 'New' }]}
    >
      <BookForm
        formState={formState}
        onFieldChange={handleFormFieldChange}
        onSubmit={handleFormSubmit}
        onReset={handleFormReset}
        submitButtonLabel="Create"
        onIsbnLookup={handleIsbnLookup}
        isbnLookupLoading={isbnLookupLoading}
        lookupAuthorName={lookupAuthorName}
      />
    </PageContainer>
  );
}
