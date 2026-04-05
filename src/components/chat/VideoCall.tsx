import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { mobileService } from '@/services/mobileService';

interface VideoCallProps {
  isInitiator: boolean;
  recipientId: string;
  recipientName: string;
  onEndCall: () => void;
  onCallStateChange: (state: 'connecting' | 'connected' | 'ended') => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  isInitiator,
  recipientId,
  recipientName,
  onEndCall,
  onCallStateChange
}) => {
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');

  useEffect(() => {
    initializeWebRTC();
    return () => cleanup();
  }, []);

  useEffect(() => {
    onCallStateChange(callState);
  }, [callState, onCallStateChange]);

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setCallState('connected');
        mobileService.hapticFeedback('medium');
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // In a real implementation, send this to the remote peer via signaling server
          console.log('ICE candidate:', event.candidate);
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log('Connection state:', state);
        
        if (state === 'connected') {
          setCallState('connected');
          setConnectionQuality('excellent');
        } else if (state === 'disconnected' || state === 'failed') {
          setCallState('ended');
          setConnectionQuality('poor');
        }
      };

      // Monitor connection quality
      const interval = setInterval(() => {
        peerConnection.getStats().then(stats => {
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
              const packetsLost = report.packetsLost || 0;
              const packetsReceived = report.packetsReceived || 0;
              const lossRate = packetsLost / (packetsLost + packetsReceived);
              
              if (lossRate < 0.02) setConnectionQuality('excellent');
              else if (lossRate < 0.05) setConnectionQuality('good');
              else setConnectionQuality('poor');
            }
          });
        });
      }, 5000);

      if (isInitiator) {
        // Create offer for outgoing call
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        // In a real implementation, send offer to remote peer
        console.log('Created offer:', offer);
      }

      toast({
        title: "Call Started",
        description: `${isInitiator ? 'Calling' : 'Receiving call from'} ${recipientName}`,
      });

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      toast({
        title: "Call Failed",
        description: "Could not access camera/microphone",
        variant: "destructive",
      });
      setCallState('ended');
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        mobileService.hapticFeedback('light');
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        mobileService.hapticFeedback('light');
      }
    }
  };

  const endCall = () => {
    cleanup();
    setCallState('ended');
    onEndCall();
    toast({
      title: "Call Ended",
      description: "The call has been terminated",
    });
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    mobileService.hapticFeedback('light');
  };

  const getConnectionBadgeColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={`${isFullscreen ? 'fixed inset-0 z-50' : 'w-full max-w-4xl mx-auto'} bg-black text-white border-0`}>
      <CardContent className="p-0 h-full relative">
        {/* Connection quality indicator */}
        <div className="absolute top-4 right-4 z-20">
          <Badge className={`${getConnectionBadgeColor()} text-white`}>
            {connectionQuality} connection
          </Badge>
        </div>

        {/* Call state indicator */}
        {callState === 'connecting' && (
          <div className="absolute top-4 left-4 z-20">
            <Badge variant="secondary" className="bg-blue-500 text-white">
              Connecting...
            </Badge>
          </div>
        )}

        {/* Video containers */}
        <div className="relative w-full h-[400px] md:h-[600px] bg-gray-900 rounded-lg overflow-hidden">
          {/* Remote video (main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJjdXJyZW50Q29sb3IiLz4KPHBhdGggZD0iTTEyIDE0QzguNjg2MjkgMTQgNiAxNi42ODYzIDYgMjBIMThDMTggMTYuNjg2MyAxNS4zMTM3IDE0IDEyIDE0WiIgZmlsbD0iY3VycmVudENvbG9yIi8+Cjwvc3ZnPgo="
          />

          {/* Local video (picture-in-picture) */}
          <div className="absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Remote video placeholder */}
          {callState === 'connecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-foreground">
                  {recipientName.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-medium mb-2">{recipientName}</h3>
              <p className="text-gray-400">
                {isInitiator ? 'Calling...' : 'Incoming call...'}
              </p>
              <div className="mt-4">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full animation-delay-200"></div>
                  <div className="w-2 h-2 bg-white rounded-full animation-delay-400"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            {/* Audio toggle */}
            <Button
              size="lg"
              variant={isAudioEnabled ? "secondary" : "destructive"}
              className="w-12 h-12 rounded-full"
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            {/* Video toggle */}
            <Button
              size="lg"
              variant={isVideoEnabled ? "secondary" : "destructive"}
              className="w-12 h-12 rounded-full"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            {/* End call */}
            <Button
              size="lg"
              variant="destructive"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
              onClick={endCall}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>

            {/* Fullscreen toggle */}
            <Button
              size="lg"
              variant="secondary"
              className="w-12 h-12 rounded-full"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>

            {/* Settings */}
            <Button
              size="lg"
              variant="secondary"
              className="w-12 h-12 rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};