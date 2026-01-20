import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications/useNotifications';
import { createOne as createBook, validate as validateBook, type Book } from '../data/books';
import BookForm, { type FormFieldValue, type BookFormState } from './BookForm';
import PageContainer from './PageContainer';

const INITIAL_FORM_VALUES: Partial<BookFormState['values']> = {
  royaltyRate: 0.5,
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
      await createBook(formValues as Omit<Book, 'id'>);
      notifications.show('Book created successfully.', {
        severity: 'success',
        autoHideDuration: 3000,
      });

      navigate('/dashboard/books');
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
      breadcrumbs={[{ title: 'Books', path: '/dashboard/books' }, { title: 'New' }]}
    >
      <BookForm
        formState={formState}
        onFieldChange={handleFormFieldChange}
        onSubmit={handleFormSubmit}
        onReset={handleFormReset}
        submitButtonLabel="Create"
      />
    </PageContainer>
  );
}
