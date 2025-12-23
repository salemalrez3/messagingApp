// Generated hooks for Authentication

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  register,
  verifyRegister,
  requestOtp,
  verifyOtp,
  resetPassword,
  forgotPassword
} from "../../services/auth";
import type {
  RegisterPayload,
  RegisterResponse,
  VerifyRegisterPayload,
  VerifyRegisterResponse,
  RequestOtpPayload,
  RequestOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
} from "../../types/authTypes";

export const useRegister = () => {
  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: register
  });
};

export const useVerifyRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation<VerifyRegisterResponse, Error, VerifyRegisterPayload>({
    mutationFn: verifyRegister,
    onSuccess: (data) => {
      // Store token on successful registration
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useRequestOtp = () => {
  return useMutation<RequestOtpResponse, Error, RequestOtpPayload>({
    mutationFn: requestOtp
  });
};

export const useVerifyOtp = () => {
  const queryClient = useQueryClient();
  
  return useMutation<VerifyOtpResponse, Error, VerifyOtpPayload>({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      // Store token on successful verification
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useResetPassword = () => {
  return useMutation<ResetPasswordResponse, Error, ResetPasswordPayload>({
     onSuccess: (data) => {
      // Store token on successful verification
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
    },
    mutationFn: resetPassword
  });
};

export const useForgotPassword = () => {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordPayload>({
    mutationFn: forgotPassword
  });
};