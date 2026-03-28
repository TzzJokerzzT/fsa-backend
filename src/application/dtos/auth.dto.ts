export interface AuthUserDTO {
  id: string;
  email: string;
  name: string;
}

export interface TokensDTO {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseDTO {
  user: AuthUserDTO;
  tokens: TokensDTO;
}

export interface RegisterResponseDTO {
  user: AuthUserDTO;
}
