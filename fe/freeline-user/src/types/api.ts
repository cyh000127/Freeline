export type ApiError = {
  status: string;
  message: string;
  method: string;
  requestUri: string;
  errors?: string[];
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
};
