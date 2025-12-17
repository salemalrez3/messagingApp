import { Box, Paper, TextField, Button, Typography } from "@mui/material";
import { useState } from "react";
interface AuthStates{
  state:'login'|'register'|'forgotPassword'|'changePassword';
}
export const AuthPage = () => {
  const [currentState,setCurrentState]=useState();
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: "center", 
      alignItems: "center",
      height: "100dvh",
      bgcolor: '#f5f5f5'
    }}>   
      <Paper sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        width: '400px', 
        gap: 2,
        borderRadius: 2 
      }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        <TextField 
          label="Email" 
          type="email"
          fullWidth
        />
        <TextField 
          label="Password" 
          type="password"
          fullWidth
        />
        <Button 
          variant="contained" 
          fullWidth
          sx={{ mt: 2 }} 
        >
          Sign In
        </Button>
      </Paper>
    </Box>
  );
};