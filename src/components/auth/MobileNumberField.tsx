
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePhone } from '@/utils/validation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNumberFieldProps {
  mobileNumber: string;
  setMobileNumber: (mobileNumber: string) => void;
  placeholder?: string;
  showValidation?: boolean;
  /** Unique id so Guardian vs Driver tabs never share the same input id (fixes label/focus bugs). */
  inputId?: string;
}

const MobileNumberField: React.FC<MobileNumberFieldProps> = ({
  mobileNumber,
  setMobileNumber,
  placeholder = "Enter mobile number",
  showValidation = true,
  inputId = "mobile",
}) => {
  const [validationError, setValidationError] = useState<string>('');

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 10) {
      setMobileNumber(value);
      
      // Real-time validation
      if (showValidation && value) {
        const validation = validatePhone(value);
        setValidationError(validation.isValid ? '' : validation.error || '');
      } else {
        setValidationError('');
      }
    }
  };

  const hasError = Boolean(validationError);

  return (
    <div className="space-y-2.5">
      <Label
        htmlFor={inputId}
        className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Phone className="h-3.5 w-3.5" aria-hidden />
        </span>
        Mobile number
      </Label>
      <div
        className={cn(
          "flex min-h-[3rem] w-full min-w-0 flex-row items-stretch overflow-hidden rounded-2xl border-2 bg-background shadow-sm transition-[border-color,box-shadow] duration-200",
          hasError
            ? "border-destructive shadow-none"
            : "border-input focus-within:border-primary/55 focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.14)] dark:focus-within:border-emerald-500/50 dark:focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.15)]",
        )}
        style={{ display: "flex", width: "100%" }}
      >
        <span
          className="flex shrink-0 select-none items-center border-r border-border/70 bg-muted/50 px-3 py-2 text-sm font-bold tabular-nums text-muted-foreground dark:bg-slate-800/80 dark:text-slate-300"
          aria-hidden
        >
          +91
        </span>
        <Input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={placeholder}
          value={mobileNumber}
          onChange={handleMobileChange}
          className="h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 text-base font-medium tracking-wide shadow-none focus-visible:ring-0 sm:text-lg dark:placeholder:text-slate-500"
          maxLength={10}
          aria-invalid={hasError}
        />
      </div>
      {showValidation && validationError && (
        <Alert variant="destructive" className="rounded-xl py-2.5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{validationError}</AlertDescription>
        </Alert>
      )}
      {!validationError && mobileNumber.length > 0 && mobileNumber.length !== 10 && (
        <p className="text-xs font-medium text-destructive">Enter all 10 digits to continue</p>
      )}
    </div>
  );
};

export default MobileNumberField;
