
export interface Guardian {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  children: string[];
}

export type NewGuardian = Omit<Guardian, 'id' | 'children'>;
