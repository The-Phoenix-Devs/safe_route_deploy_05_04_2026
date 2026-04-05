import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import { DriverQRCode } from '@/types/qrcode.types';
import { mockQRCodes, driverOptions, busOptions } from './qr-code/QRCodeData';
import QRCodeGenerator from './qr-code/QRCodeGenerator';
import QRCodeViewer from './qr-code/QRCodeViewer';
import QRCodeList from './qr-code/QRCodeList';

const AdminQRCode: React.FC = () => {
  const [driverQRCodes, setDriverQRCodes] = useState<DriverQRCode[]>(mockQRCodes);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentQRCode, setCurrentQRCode] = useState<string>('');

  const filteredQRCodes = driverQRCodes.filter(qr => 
    qr.driverName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    qr.busNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQRCodeGenerated = (newQRCode: DriverQRCode) => {
    // Check if we're replacing an existing QR code
    const existingIndex = driverQRCodes.findIndex(
      qr => qr.driverName === newQRCode.driverName && qr.busNumber === newQRCode.busNumber
    );
    
    if (existingIndex >= 0) {
      // Replace the existing QR code
      const updatedQRCodes = [...driverQRCodes];
      updatedQRCodes[existingIndex] = newQRCode;
      setDriverQRCodes(updatedQRCodes);
    } else {
      // Add new QR code
      setDriverQRCodes([...driverQRCodes, newQRCode]);
    }
    
    setCurrentQRCode(newQRCode.qrData);
  };

  const viewQRCode = (qrData: string) => {
    setCurrentQRCode(qrData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Driver QR Codes</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search QR codes..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Generate QR Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Driver QR Code</DialogTitle>
              </DialogHeader>
              <QRCodeGenerator 
                driverOptions={driverOptions} 
                busOptions={busOptions}
                onQRCodeGenerated={handleQRCodeGenerated}
                existingQRCodes={driverQRCodes}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <QRCodeList 
        qrCodes={filteredQRCodes} 
        onViewQRCode={viewQRCode}
      />
      
      {currentQRCode && <QRCodeViewer qrData={currentQRCode} />}
    </div>
  );
};

export default AdminQRCode;
