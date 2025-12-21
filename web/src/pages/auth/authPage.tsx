import { Box } from "@mui/material";
import { useState } from "react";

import { LoginPage } from "./loginPage";
import { RegisterPage } from "./registerPage";
import { ForgotPasswordPage } from "./forgotPassword";
import { ChangePasswordPage } from "./resetPassword";
import { VerifyOtp } from "./verifyOtp";

type AuthState = 'login' | 'register' | 'forgotPassword' | 'changePassword' | 'verReg' | 'verLogin';
interface Payload{
email:string;
password?:string;
phone?:string;
username?:string;
}
export const AuthPage = () => {
  const [currentState, setCurrentState] = useState<AuthState>('login');
  const [data,setData] = useState<Payload>();
  const renderComponent = () => {
    switch (currentState) {
      case 'register':
        return <RegisterPage setCurrentState={setCurrentState} setData={setData} />;
      case 'forgotPassword':
        return <ForgotPasswordPage setCurrentState={setCurrentState} setData={setData} />;
      case 'changePassword':
        return <ChangePasswordPage setCurrentState={setCurrentState} email={data?.email!} />;
      case 'verReg':
        return <VerifyOtp from={'verReg'} verData={data!} />;
      case 'verLogin':
        return <VerifyOtp from={'verLogin'} verData={data!} />;
      case 'login':
      default:
        return <LoginPage setCurrentState={setCurrentState} setData={setData}/>;
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: "center", 
      alignItems: "center",
      height: "100dvh",
      bgcolor: '#f5f5f5',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      {renderComponent()}
    </Box>
  );
};