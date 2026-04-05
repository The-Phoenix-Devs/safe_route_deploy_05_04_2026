import React from 'react';
import { Bus } from 'lucide-react';

const LoadingBusAnimation: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        {/* Road */}
        <div className="w-48 h-2 bg-gray-300 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-transparent via-gray-400 to-transparent animate-pulse"></div>
        </div>
        
        {/* Bus */}
        <div className="relative animate-bounce">
          <Bus className="w-12 h-12 text-primary animate-pulse" />
          
          {/* Bus wheels animation */}
          <div className="absolute -bottom-1 left-2 w-2 h-2 bg-gray-700 rounded-full animate-spin"></div>
          <div className="absolute -bottom-1 right-2 w-2 h-2 bg-gray-700 rounded-full animate-spin"></div>
        </div>
        
        {/* Moving background lines */}
        <div className="absolute top-6 w-full h-px bg-gray-200 overflow-hidden">
          <div className="h-full w-8 bg-gray-400 animate-pulse opacity-50"></div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-lg font-medium text-primary animate-pulse">
          Authenticating...
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Please wait while we verify your credentials
        </div>
      </div>
    </div>
  );
};

export default LoadingBusAnimation;