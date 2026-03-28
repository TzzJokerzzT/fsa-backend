export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileDTO extends UserDTO {
  architecturesCount?: number;
}
