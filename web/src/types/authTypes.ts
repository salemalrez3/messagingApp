// Generated types for Authentication

export interface RegisterPayload {
  email: string;
  password: string;
  phone?: string;
  username: string;
}

export interface RegisterResponse {
  message: string;
  debug_otp?: string;
}

export interface VerifyRegisterPayload {
  email: string;
  password: string;
  otp: string;
  phone?: string;
  username: string;
}

export interface VerifyRegisterResponse {
  message: string;
  token: string;
  user: UserResponse;
}

export interface RequestOtpPayload {
  email: string;
  password: string;
}

export interface RequestOtpResponse {
  msg: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  msg: string;
  token: string;
  user: UserResponse;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  // Based on 200 response (no specific schema)
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  msg: string;
}

// Common Types
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  phone?: string;
}

export interface ErrorResponse {
  error: string;
  details: string;
}