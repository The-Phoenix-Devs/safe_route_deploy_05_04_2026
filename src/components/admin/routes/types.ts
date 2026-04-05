
export interface Route {
  id: string;
  name: string;
  description: string;
  start_point: string;
  end_point: string;
  created_at?: string;
  updated_at?: string;
}

export interface Driver {
  id: string;
  name: string;
  busNumber: string;
}
