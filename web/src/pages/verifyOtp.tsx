import { Button, Paper, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useVerifyOtp, useVerifyRegister } from "../hooks/api/auth";

interface Payload {
  email: string;
  password?: string;
  phone?: string;
  username?: string;
}
type From = "verReg" | "verLogin";
interface VerifyOtpProps {
  from: From;
  verData: Payload;
}
export const VerifyOtp = ({ from, verData }: VerifyOtpProps) => {
  const [otp, setOtp] = useState<string>("");
  const loginVer = useVerifyOtp();
  const regVer = useVerifyRegister();
 const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(from=="verLogin"){
        loginVer.mutate({email:verData.email,otp})
    }
    else{
        regVer.mutate({email:verData.email,password:verData.password||"",username:verData.username!,phone:verData.phone||"",otp})
    }
    
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
        {from=="verLogin"?("Welcome Back"):("HI")}
      </Typography>

      <Typography
        variant="body2"
        align="center"
        color="text.secondary"
        gutterBottom
      >
        Enter The Code 
      </Typography>

      <TextField
        label="Code"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        fullWidth
        required
        variant="outlined"
      />
        <Button 
        type="submit" 
        variant="contained" 
        fullWidth
        sx={{ mt: 2 }}
        disabled={loginVer.isPending||regVer.isPending}
      >
        {loginVer.isPending||regVer.isPending? 'Verifying...' : 'Check'}
      </Button>
      
    </Paper>
  );
};
