import { Paper, TextField, Typography, Button, Link, Box, Alert } from "@mui/material";
import { useState } from "react";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface ForgotPasswordProps {
  setCurrentState: (state: 'login' | 'register' | 'forgotPassword' | 'changePassword') => void;
}

export const ForgotPasswordPage = ({ setCurrentState }: ForgotPasswordProps) => {
  const [email, setEmail] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Simulate API call
    console.log('Sending reset link to:', email);
    setIsSubmitted(true);
    setError('');
  };

  const handleBackToLogin = () => {
    setCurrentState('login');
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        padding: "40px",
        width: "400px",
        gap: 3,
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToLogin}
          sx={{ mr: 2 }}
          size="small"
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight="bold">
          Forgot Password
        </Typography>
      </Box>
      
      <Typography variant="body2" color="text.secondary">
        Enter your email address and we'll send you a link to reset your password.
      </Typography>
      
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {isSubmitted ? (
        <Alert severity="success">
          If an account exists with {email}, you will receive a password reset link shortly.
          Please check your inbox and spam folder.
        </Alert>
      ) : (
        <>
          <TextField 
            label="Email Address" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            variant="outlined"
            error={!!error}
            helperText={error}
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth
            size="large"
            sx={{ mt: 2, py: 1.5 }}
          >
            Send Reset Link
          </Button>
        </>
      )}
      
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Remember your password?{' '}
          <Link 
            component="button"
            type="button"
            onClick={handleBackToLogin}
            sx={{ cursor: 'pointer', fontWeight: 'bold' }}
          >
            Sign In
          </Link>
        </Typography>
      </Box>
      
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Need an account?{' '}
          <Link 
            component="button"
            type="button"
            onClick={() => setCurrentState('register')}
            sx={{ cursor: 'pointer', fontWeight: 'bold' }}
          >
            Sign Up
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};