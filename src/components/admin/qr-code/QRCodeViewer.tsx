
import React from 'react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

interface QRCodeViewerProps {
  qrData: string;
  busNumber?: string;
}

const QRCodeViewer: React.FC<QRCodeViewerProps> = ({ qrData, busNumber }) => {
  const qrRef = React.useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    if (!qrRef.current || !qrData) return;
    
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
      link.download = `driver_qr_${busNumber || 'code'}.png`;
      link.href = dataUrl;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  if (!qrData) return null;

  return (
    <div className="flex flex-col items-center mt-4 p-4 border rounded-lg">
      <h3 className="font-medium mb-4">QR Code Preview</h3>
      <div ref={qrRef} className="border rounded-lg p-4 bg-white">
        <QRCodeSVG value={qrData} size={240} />
      </div>
      <Button 
        onClick={downloadQRCode} 
        variant="outline" 
        className="mt-4"
      >
        <Download className="mr-2 h-4 w-4" /> Download QR Code
      </Button>
    </div>
  );
};

export default QRCodeViewer;
