import { Paper, TextField, Typography, Button, Link, Box } from "@mui/material";
import { useState } from "react";
import { useRegister } from "../../hooks/api/auth";
interface Payload{
email:string;
password:string;
phone?:string;
username:string;
}
interface RegisterProps {
  setCurrentState: (state: 'login' | 'register' | 'forgotPassword' | 'changePassword' | 'verReg' | 'verLogin') => void;
  setData:(payload:Payload)=>void;
}

export const RegisterPage = ({ setCurrentState,setData }: RegisterProps) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const { mutate: reg, isPending } = useRegister();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reg({email, password, phone, username}, {
      onSuccess: () => {
        // After successful registration request, go to OTP verification
      setData({email, password, phone, username});
      setCurrentState('verReg');
      },
      onError: (error: any) => {
        console.error('Registration failed:', error);
        alert('Registration failed. Please try again.');
      }
    });
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
        gap: 2,
        borderRadius: 2,
      }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Create Account
      </Typography>
      
      <TextField 
        label="Username" 
        value={username} 
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        required
        disabled={isPending}
      />
      
      <TextField 
        label="Email" 
        type="email"
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        required
        disabled={isPending}
      />
      
      <TextField 
        label="Phone (Optional)" 
        type="tel"
        value={phone} 
        onChange={(e) => setPhone(e.target.value)}
        fullWidth
        disabled={isPending}
      />
      
      <TextField 
        label="Password" 
        type="password"
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
        disabled={isPending}
      />
      
      <Button 
        type="submit" 
        variant="contained" 
        fullWidth
        sx={{ mt: 2 }}
        disabled={isPending}
      >
        {isPending ? 'Registering...' : 'Sign Up'}
      </Button>
      
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2">
          Already have an account?{' '}
          <Link 
            component="button"
            type="button"
            onClick={() => setCurrentState('login')}
            sx={{ cursor: 'pointer' }}
            disabled={isPending}
          >
            Sign In
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};