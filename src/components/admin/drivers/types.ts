
export interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  busNumber: string;
  status: "active" | "inactive";
  username?: string;
  password?: string;
  qrToken?: string;
}

export interface DriverFormData {
  name: string;
  phone: string;
  license: string;
  busNumber: string;
  status: "active" | "inactive";
}

export interface DriverCredentials {
  username: string;
  password: string;
}
