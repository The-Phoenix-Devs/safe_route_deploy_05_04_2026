import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Image as ImageIcon, X, Send } from 'lucide-react';
import { mobileService } from '@/services/mobileService';

interface PhotoSharingProps {
  onSendPhoto: (photoUrl: string, caption?: string) => void;
  disabled?: boolean;
}

export const PhotoSharing: React.FC<PhotoSharingProps> = ({ onSendPhoto, disabled }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const takePhoto = async () => {
    try {
      setIsLoading(true);
      await mobileService.hapticFeedback('light');
      
      const photoUrl = await mobileService.takePhoto();
      if (photoUrl) {
        setSelectedPhoto(photoUrl);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectImage = async () => {
    try {
      setIsLoading(true);
      await mobileService.hapticFeedback('light');
      
      const photoUrl = await mobileService.selectImage();
      if (photoUrl) {
        setSelectedPhoto(photoUrl);
      }
    } catch (error) {
      console.error('Failed to select image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPhoto = async () => {
    if (selectedPhoto) {
      await mobileService.hapticFeedback('medium');
      onSendPhoto(selectedPhoto, caption);
      resetPhoto();
    }
  };

  const resetPhoto = () => {
    setSelectedPhoto(null);
    setCaption('');
  };

  if (selectedPhoto) {
    return (
      <Card className="p-4 space-y-3">
        <div className="relative">
          <img 
            src={selectedPhoto} 
            alt="Selected" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={resetPhoto}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <textarea
          placeholder="Add a caption (optional)..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-2 border rounded-md resize-none h-20 text-sm"
        />
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={resetPhoto}>
            Cancel
          </Button>
          <Button onClick={sendPhoto}>
            <Send className="h-4 w-4 mr-2" />
            Send Photo
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={takePhoto}
        disabled={disabled || isLoading}
        className="h-8"
        onTouchStart={() => mobileService.hapticFeedback('light')}
      >
        <Camera className="h-4 w-4 mr-1" />
        Camera
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={selectImage}
        disabled={disabled || isLoading}
        className="h-8"
        onTouchStart={() => mobileService.hapticFeedback('light')}
      >
        <ImageIcon className="h-4 w-4 mr-1" />
        Gallery
      </Button>
    </div>
  );
};