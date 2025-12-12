// Generated services for Authentication

import api from "../config/api";
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
} from '../types/authTypes';

export async function register(data: RegisterPayload): Promise<RegisterResponse> {
  const res = await api.post('/register', data);
  return res.data;
}

export async function verifyRegister(data: VerifyRegisterPayload): Promise<VerifyRegisterResponse> {
  const res = await api.post('/verify-register', data);
  return res.data;
}

export async function requestOtp(data: RequestOtpPayload): Promise<RequestOtpResponse> {
  const res = await api.post('/requestOtp', data);
  return res.data;
}

export async function verifyOtp(data: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const res = await api.post('/verifyOtp', data);
  return res.data;
}

export async function resetPassword(data: ResetPasswordPayload): Promise<ResetPasswordResponse> {
  const res = await api.post('/resetPassword', data);
  return res.data;
}

export async function forgotPassword(data: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  const res = await api.post('/forgotPassword', data);
  return res.data;
}