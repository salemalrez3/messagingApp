import { Paper, TextField, Typography, Button, Link, Box, Alert } from "@mui/material";
import { useState } from "react";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForgotPassword } from "../hooks/api/auth";
interface Payload{
email:string;
}
interface ForgotPasswordProps {
  setCurrentState: (state: 'login' | 'register' | 'forgotPassword' | 'changePassword'| 'verReg' | 'verLogin') => void;
   setData: (payload:Payload) => void;
}

export const ForgotPasswordPage = ({ setCurrentState,setData}: ForgotPasswordProps) => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const forgot = useForgotPassword();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    forgot.mutate({email},{onSuccess:()=>{console.log('Sending reset link to:', email); setCurrentState('changePassword'); setData({email})}})
    
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