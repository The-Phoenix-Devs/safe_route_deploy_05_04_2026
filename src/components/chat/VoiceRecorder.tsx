import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send, Trash2 } from 'lucide-react';
import { mobileService } from '@/services/mobileService';

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, duration: number) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      await mobileService.hapticFeedback('light');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setRecordedBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Update duration every second
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    await mobileService.hapticFeedback('medium');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsRecording(false);
  };

  const sendVoiceMessage = async () => {
    if (recordedBlob) {
      await mobileService.hapticFeedback('light');
      onSendVoice(recordedBlob, duration);
      resetRecording();
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordedBlob) {
    return (
      <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Voice message recorded</p>
          <p className="text-xs text-muted-foreground">{formatDuration(duration)}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={resetRecording}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={sendVoiceMessage}
          className="h-8 w-8 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">
            {formatDuration(duration)}
          </span>
        </div>
      )}
      
      <Button
        size="sm"
        variant={isRecording ? "destructive" : "outline"}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className="h-8 w-8 p-0"
        onTouchStart={() => mobileService.hapticFeedback('light')}
      >
        {isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};