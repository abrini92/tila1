// API Request/Response types

// Generic API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

// Recitation
export interface CreateRecitationRequest {
  title: string;
  description?: string;
  surah: string;
  verses: string;
  language?: string;
}

export interface RecitationResponse {
  id: string;
  title: string;
  description?: string;
  surah: string;
  verses: string;
  language: string;
  audioUrl?: string;
  duration?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
  };
}
