const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@.]+$/;

export interface AuthorFormState {
  name: string;
  email: string;
  paypalAccount?: string;
  venmoAccount?: string;
  errors: { name?: string; email?: string };
}

export function validateAuthor(
  values: Pick<AuthorFormState, 'name' | 'email'>,
): AuthorFormState['errors'] {
  const errors: AuthorFormState['errors'] = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(values.email.toLowerCase().trim()))
    errors.email = 'Must be a valid email address';
  return errors;
}
