import { Paper, TextField, Typography, Button, Link, Box } from "@mui/material";
import { useState } from "react";
import { useRequestOtp } from "../../hooks/api/auth";
interface Payload{
email:string;
}
interface LoginProps {
  setCurrentState: (state: 'login' | 'register' | 'forgotPassword' | 'changePassword' | 'verReg' | 'verLogin') => void;
  setData: (payload:Payload) => void;
}

export const LoginPage = ({ setCurrentState,setData }: LoginProps) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const login = useRequestOtp();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Requesting OTP for:', { email, password, rememberMe });
    login.mutate({email,password},{onSuccess:()=>{setData({email})
    setCurrentState('verLogin');}});
    
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
      <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
        Welcome Back
      </Typography>
      
      <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
        Sign in to your account to continue
      </Typography>
      
      <TextField 
        label="Email Address" 
        type="email"
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        required
        variant="outlined"
      />
      
      <TextField 
        label="Password" 
        type="password"
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
        variant="outlined"
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <input 
            type="checkbox" 
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          <label htmlFor="rememberMe">
            <Typography variant="body2">Remember me</Typography>
          </label>
        </Box>
        
        <Link 
          component="button"
          type="button"
          onClick={() => setCurrentState('forgotPassword')}
          sx={{ cursor: 'pointer', textDecoration: 'none' }}
          variant="body2"
        >
          Forgot Password?
        </Link>
      </Box>
      
      <Button 
        type="submit" 
        variant="contained" 
        fullWidth
        size="large"
        sx={{ mt: 2, py: 1.5 }}
      >
        Sign In
      </Button>
      
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
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
      
      <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
        <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider' }} />
        <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
          OR
        </Typography>
        <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider' }} />
      </Box>
      
      <Button 
        variant="outlined" 
        fullWidth
        sx={{ py: 1.5 }}
      >
        Continue with Google
      </Button>
    </Paper>
  );
};