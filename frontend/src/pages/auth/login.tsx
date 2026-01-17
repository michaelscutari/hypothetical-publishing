import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  alignItems: 'center',
  justifyContent: 'center',
}));

export default function Login() {
  const [usernameError, setUsernameError] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);
  const navigate = useNavigate();

  const validateInputs = () => {
    const username = (document.getElementById('username') as HTMLInputElement)?.value ?? '';
    const password = (document.getElementById('password') as HTMLInputElement)?.value ?? '';

    let valid = true;

    if (!username.trim()) {
      setUsernameError(true);
      valid = false;
    } else {
      setUsernameError(false);
    }

    if (!password) {
      setPasswordError(true);
      valid = false;
    } else {
      setPasswordError(false);
    }

    return valid;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs()) return;

    navigate('/dashboard');
  };

  return (
    <>
      <CssBaseline />
      <SignInContainer direction="column">
        <Card variant="outlined">
          <Typography component="h1" variant="h4" textAlign="center">
            Sign in
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="username">Username</FormLabel>
              <TextField
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                required
                fullWidth
                error={usernameError}
                helperText={usernameError ? 'Username is required' : ''}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                fullWidth
                error={passwordError}
                helperText={passwordError ? 'Password is required' : ''}
              />
            </FormControl>

            <Button type="submit" variant="contained" fullWidth>
              Sign in
            </Button>

            <Link
              component="button"
              type="button"
              variant="body2"
              sx={{ alignSelf: 'center' }}
              onClick={() => alert('Forgot password not implemented yet')}
            >
              Forgot your password?
            </Link>
          </Box>
        </Card>
      </SignInContainer>
    </>
  );
}
