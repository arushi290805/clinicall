export interface UserFormData {
  id?: string;
  name: string;
  age: string;
  gender: string;
  symptoms: string;
  medication: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface CreateUserRequest {
  name: string;
  age: string;
  gender: string;
  symptoms: string;
  medication: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string;
}