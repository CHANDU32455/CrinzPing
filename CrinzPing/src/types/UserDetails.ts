export interface UserDetails {
  displayName: string;
  email: string;
  timeZone: string;
  preferences?: {
    categories?: string[];
  };
}
