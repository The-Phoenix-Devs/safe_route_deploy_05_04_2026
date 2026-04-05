
import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DriverQRCode } from '@/types/qrcode.types';

interface QRCodeListProps {
  qrCodes: DriverQRCode[];
  onViewQRCode: (qrData: string) => void;
}

const QRCodeList: React.FC<QRCodeListProps> = ({ qrCodes, onViewQRCode }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Driver</TableHead>
          <TableHead>Bus Number</TableHead>
          <TableHead>Generated Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {qrCodes.map((qrCode) => (
          <TableRow key={qrCode.id}>
            <TableCell>{qrCode.driverName}</TableCell>
            <TableCell>{qrCode.busNumber}</TableCell>
            <TableCell>{qrCode.generated.toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewQRCode(qrCode.qrData)}
              >
                View QR
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default QRCodeList;
