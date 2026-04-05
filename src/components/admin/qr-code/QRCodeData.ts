
import { DriverQRCode, DriverOption, BusOption } from '@/types/qrcode.types';

// Mock data for QR codes
export const mockQRCodes: DriverQRCode[] = [
  { 
    id: '1', 
    driverName: 'John Doe', 
    busNumber: 'BUS001', 
    generated: new Date(2023, 2, 15), 
    qrData: 'driver_1_BUS001' 
  },
  { 
    id: '2', 
    driverName: 'Jane Smith', 
    busNumber: 'BUS002', 
    generated: new Date(2023, 2, 20), 
    qrData: 'driver_2_BUS002' 
  },
];

// Mock data for driver dropdown
export const driverOptions: DriverOption[] = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Mike Johnson' },
];

// Mock data for bus dropdown
export const busOptions: BusOption[] = [
  { id: 'BUS001', name: 'BUS001' },
  { id: 'BUS002', name: 'BUS002' },
  { id: 'BUS003', name: 'BUS003' },
];
