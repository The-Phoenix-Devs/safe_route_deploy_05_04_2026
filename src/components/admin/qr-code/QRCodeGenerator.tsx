
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Download, AlertTriangle } from 'lucide-react';
import { DriverOption, BusOption, DriverQRCode } from '@/types/qrcode.types';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QRCodeGeneratorProps {
  driverOptions: DriverOption[];
  busOptions: BusOption[];
  onQRCodeGenerated: (qrCode: DriverQRCode) => void;
  existingQRCodes: DriverQRCode[];
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  driverOptions, 
  busOptions, 
  onQRCodeGenerated,
  existingQRCodes
}) => {
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedBus, setSelectedBus] = useState<string>('');
  const [currentQRCode, setCurrentQRCode] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [existingQRCode, setExistingQRCode] = useState<DriverQRCode | null>(null);
  const qrRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check if there's an existing QR code when driver or bus selection changes
  useEffect(() => {
    if (selectedDriver && selectedBus) {
      const existing = existingQRCodes.find(qr => 
        qr.driverName === driverOptions.find(d => d.id === selectedDriver)?.name && 
        qr.busNumber === selectedBus
      );
      setExistingQRCode(existing || null);
    } else {
      setExistingQRCode(null);
    }
  }, [selectedDriver, selectedBus, existingQRCodes, driverOptions]);

  const validateSelections = () => {
    if (!selectedDriver || !selectedBus) {
      toast({
        title: 'Validation Error',
        description: 'Please select both a driver and a bus',
        variant: 'destructive',
      });
      return false;
    }
    
    if (existingQRCode) {
      setShowConfirmDialog(true);
      return false;
    }
    
    return true;
  };

  const generateQRCode = () => {
    if (!validateSelections()) {
      return;
    }

    createQRCode();
  };

  const createQRCode = () => {
    const selectedDriverName = driverOptions.find(d => d.id === selectedDriver)?.name || '';
    
    // Generate QR code data
    const qrData = `driver_${selectedDriver}_${selectedBus}_${Date.now()}`;
    
    // Create a new QR code entry
    const newQRCode: DriverQRCode = {
      id: Date.now().toString(),
      driverName: selectedDriverName,
      busNumber: selectedBus,
      generated: new Date(),
      qrData
    };
    
    onQRCodeGenerated(newQRCode);
    setCurrentQRCode(qrData);
    setShowConfirmDialog(false);
    
    toast({
      title: 'Success',
      description: 'QR code generated successfully',
    });
  };

  const downloadQRCode = () => {
    if (!qrRef.current || !currentQRCode) return;
    
    // Get the SVG element
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const svgRect = svgElement.getBoundingClientRect();
    canvas.width = svgRect.width;
    canvas.height = svgRect.height;
    
    // Create an image element from the SVG
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      // Draw the image to the canvas
      ctx.drawImage(img, 0, 0);
      
      // Convert the canvas to a data URL and trigger a download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `driver_qr_${selectedBus || 'code'}.png`;
      link.href = dataUrl;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="driver">Select Driver</Label>
        <Select value={selectedDriver} onValueChange={setSelectedDriver}>
          <SelectTrigger>
            <SelectValue placeholder="Select Driver" />
          </SelectTrigger>
          <SelectContent>
            {driverOptions.map(driver => (
              <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bus">Select Bus</Label>
        <Select value={selectedBus} onValueChange={setSelectedBus}>
          <SelectTrigger>
            <SelectValue placeholder="Select Bus" />
          </SelectTrigger>
          <SelectContent>
            {busOptions.map(bus => (
              <SelectItem key={bus.id} value={bus.id}>{bus.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {existingQRCode && (
        <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            A QR code already exists for this driver and bus combination.
          </p>
        </div>
      )}
      
      <Button onClick={generateQRCode} className="w-full">
        Generate QR Code
      </Button>
      
      {currentQRCode && (
        <div className="flex flex-col items-center mt-4">
          <div ref={qrRef} className="border rounded-lg p-4 bg-white">
            <QRCodeSVG value={currentQRCode} size={240} />
          </div>
          <Button 
            onClick={downloadQRCode} 
            variant="outline" 
            className="mt-2"
          >
            <Download className="mr-2 h-4 w-4" /> Download QR Code
          </Button>
        </div>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Override</AlertDialogTitle>
            <AlertDialogDescription>
              A QR code already exists for this driver and bus combination. 
              Generating a new one will replace the existing code. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={createQRCode}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QRCodeGenerator;
