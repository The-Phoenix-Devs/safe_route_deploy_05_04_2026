import { useState, useRef } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface PhotoCaptureProps {
  onPhotoTaken: (photoData: string, metadata: PhotoMetadata) => void;
  studentName?: string;
  busNumber?: string;
  action: 'pickup' | 'dropoff';
}

interface PhotoMetadata {
  timestamp: string;
  location?: { lat: number; lng: number };
  studentName?: string;
  busNumber?: string;
  action: 'pickup' | 'dropoff';
}

export function PhotoCapture({ onPhotoTaken, studentName, busNumber, action }: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions."
      });
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get photo data
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoData);
    stopCamera();

    // Get current location
    let location: { lat: number; lng: number } | undefined;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000
        });
      });
      location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error) {
      console.warn('Location access denied:', error);
    }

    const metadata: PhotoMetadata = {
      timestamp: new Date().toISOString(),
      location,
      studentName,
      busNumber,
      action
    };

    onPhotoTaken(photoData, metadata);
    
    toast({
      title: "Photo Captured",
      description: `${action === 'pickup' ? 'Pickup' : 'Drop-off'} photo saved successfully.`
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const photoData = e.target?.result as string;
      setCapturedPhoto(photoData);

      // Get current location for uploaded photo
      let location: { lat: number; lng: number } | undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000
          });
        });
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      } catch (error) {
        console.warn('Location access denied:', error);
      }

      const metadata: PhotoMetadata = {
        timestamp: new Date().toISOString(),
        location,
        studentName,
        busNumber,
        action
      };

      onPhotoTaken(photoData, metadata);
      
      toast({
        title: "Photo Uploaded",
        description: `${action === 'pickup' ? 'Pickup' : 'Drop-off'} photo uploaded successfully.`
      });
    };
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  if (capturedPhoto) {
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">
            {action === 'pickup' ? 'Pickup' : 'Drop-off'} Photo
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={retakePhoto}>
              <Camera className="w-4 h-4 mr-1" />
              Retake
            </Button>
          </div>
        </div>
        
        <div className="relative rounded-lg overflow-hidden">
          <img 
            src={capturedPhoto} 
            alt="Captured photo" 
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
        
        {studentName && (
          <p className="text-sm text-muted-foreground">
            Photo for: <span className="font-medium">{studentName}</span>
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          {action === 'pickup' ? 'Pickup' : 'Drop-off'} Photo
        </h3>
        {isCapturing && (
          <Button variant="outline" size="sm" onClick={stopCamera}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      {isCapturing ? (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="w-full h-48 object-cover"
              autoPlay
              playsInline
              muted
            />
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={capturePhoto} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Capture Photo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={startCamera} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
          
          {studentName && (
            <p className="text-sm text-muted-foreground text-center">
              Photo for: <span className="font-medium">{studentName}</span>
            </p>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Hidden canvas for photo processing */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
}

export type { PhotoMetadata };