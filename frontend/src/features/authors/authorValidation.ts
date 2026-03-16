export interface AuthorFormState {
  name: string;
  email: string;
  errors: { name?: string; email?: string };
}

export function validateAuthor(
  values: Pick<AuthorFormState, 'name' | 'email'>,
): AuthorFormState['errors'] {
  const errors: AuthorFormState['errors'] = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = 'Must be a valid email address';
  return errors;
}
