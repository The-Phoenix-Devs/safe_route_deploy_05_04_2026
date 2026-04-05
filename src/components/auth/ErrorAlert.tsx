
import React from 'react';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorAlertProps {
  error: string | null;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="rounded-xl border-destructive/40 shadow-sm">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <AlertTitle className="font-semibold">Something went wrong</AlertTitle>
      <AlertDescription className="text-sm leading-relaxed">{error}</AlertDescription>
    </Alert>
  );
};

export default ErrorAlert;
