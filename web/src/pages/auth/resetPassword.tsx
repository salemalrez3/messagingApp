
import { Paper, TextField, Typography, Button, Link, Box, Alert } from "@mui/material";
import { useState } from "react";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import { useResetPassword } from "../../hooks/api/auth";
import { useNavigate } from "react-router-dom";

interface ChangePasswordProps {
  setCurrentState: (state: 'login' | 'register' | 'forgotPassword' | 'changePassword') => void;
  email:string;
}

export const ChangePasswordPage = ({ setCurrentState,email }: ChangePasswordProps) => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [otp,setOtp] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const reset = useResetPassword();
  
    const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    debugger
    e.preventDefault();
    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    reset.mutate({email,newPassword,otp},{onSuccess:()=>{navigate('/chats')}})
  
  };

  const handleBackToLogin = () => {
    setCurrentState('login');
  };

  if (reset.isSuccess) {
    return (
      <Paper
        sx={{
          display: "flex",
          flexDirection: "column",
          padding: "40px",
          width: "400px",
          gap: 3,
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Alert severity="success" sx={{ mb: 2 }}>
          Password changed successfully!
        </Alert>
        
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Password Updated
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Your password has been changed successfully. You can now sign in with your new password.
        </Typography>
        
        <Button 
          variant="contained" 
          fullWidth
          size="large"
          onClick={handleBackToLogin}
          sx={{ mt: 2, py: 1.5 }}
        >
          Sign In Now
        </Button>
      </Paper>
    );
  }

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
          Set New Password
        </Typography>
      </Box>
      
      <Typography variant="body2" color="text.secondary">
        Create a new password for your account. Make sure it's strong and secure.
      </Typography>
      
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <TextField 
        label="New Password" 
        type={showNewPassword ? "text" : "password"}
        value={newPassword} 
        onChange={(e) => setNewPassword(e.target.value)}
        fullWidth
        required
        variant="outlined"
        InputProps={{
          endAdornment: (
            <IconButton
              onClick={() => setShowNewPassword(!showNewPassword)}
              edge="end"
            >
              {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          ),
        }}
      />
      
      <TextField 
        label="Confirm New Password" 
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword} 
        onChange={(e) => setConfirmPassword(e.target.value)}
        fullWidth
        required
        variant="outlined"
        InputProps={{
          endAdornment: (
            <IconButton
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              edge="end"
            >
              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          ),
        }}
      />
      
      <TextField 
        label="Enter Code" 
        value={otp} 
        onChange={(e) => setOtp(e.target.value)}
        fullWidth
        required
        variant="outlined"
      />
      <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          Password requirements:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • At least 8 characters long<br />
          • Include uppercase and lowercase letters<br />
          • Include at least one number<br />
          • Include at least one special character
        </Typography>
      </Box>
      
      <Button 
        type="submit" 
        variant="contained" 
        fullWidth
        size="large"
        sx={{ mt: 2, py: 1.5 }}
      >
        Change Password
      </Button>
      
      <Box sx={{ textAlign: 'center' }}>
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
    </Paper>
  );
};