export interface IntegrationResponse {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
