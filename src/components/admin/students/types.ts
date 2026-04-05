
export interface Student {
  id: string;
  name: string;
  grade: string;
  guardianName: string;
  pickupPoint: string;
  busNumber: string;
  driverId: string;
  guardianUsername?: string;
  guardianPassword?: string;
  guardianId?: string;
  guardianEmail?: string;
}

export interface Driver {
  id: string;
  name: string;
  busNumber: string;
  phone: string;
  license: string;
  status: "active" | "inactive";
}
