
export interface DriverQRCode {
  id: string;
  driverName: string;
  busNumber: string;
  generated: Date;
  qrData: string;
}

export interface DriverOption {
  id: string;
  name: string;
}

export interface BusOption {
  id: string;
  name: string;
}
