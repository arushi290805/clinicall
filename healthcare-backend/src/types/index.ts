export interface UserFormData {
  id?: string;
  name: string;
  age: string;
  gender: string;
  contactNumber: string;
  symptoms: string;
  medication: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  createdAt?: Date;
}

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  scheduledAt: string;
  status: "SCHEDULED" | "CANCELLED" | "COMPLETED";
  notes: string;
  doctor?: Doctor;
  user?: UserFormData;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
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
  contactNumber: string;
  symptoms: string;
  medication: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string;
}
