"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users } from "lucide-react";
import { guardianWelcomeMessage, openWhatsAppInvite } from "@/utils/whatsappInvite";

export type GuardianPostCreatePayload = {
  guardianName: string;
  studentName: string;
  mobile: string;
  pickup: string;
  bus?: string;
  pin?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: GuardianPostCreatePayload | null;
};

export function GuardianPostCreateDialog({ open, onClose, data }: Props) {
  const sendWhatsApp = () => {
    if (!data) return;
    openWhatsAppInvite(
      data.mobile,
      guardianWelcomeMessage({
        guardianName: data.guardianName,
        studentName: data.studentName,
        mobile: data.mobile,
        pickup: data.pickup,
        bus: data.bus?.trim() || undefined,
        pin: data.pin && /^\d{6}$/.test(data.pin) ? data.pin : undefined,
      }),
    );
  };

  const hasPin = Boolean(data?.pin && /^\d{6}$/.test(data.pin));

  return (
    <Dialog open={Boolean(open && data)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Guardian login — share with parent
          </DialogTitle>
          <DialogDescription>
            Send mobile number and 6-digit PIN on WhatsApp. Parents use the Guardian tab on the login
            page.
          </DialogDescription>
        </DialogHeader>

        {data ? (
        <div className="space-y-3 rounded-xl border bg-muted/40 p-4 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Guardian</span>
            <span className="text-right font-medium">{data.guardianName}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Student</span>
            <span className="text-right font-medium">{data.studentName}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Mobile (username)</span>
            <span className="font-mono font-medium">{data.mobile}</span>
          </div>
          {hasPin ? (
            <div className="flex justify-between gap-2 border-t border-border/60 pt-2">
              <span className="text-muted-foreground">6-digit PIN</span>
              <span className="font-mono text-base font-semibold tracking-widest">{data.pin}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              PIN not shown here — use the WhatsApp button in the students table to resend if needed.
            </p>
          )}
        </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" className="w-full gap-2" variant="secondary" onClick={sendWhatsApp} disabled={!data}>
            <MessageCircle className="h-4 w-4" />
            WhatsApp — mobile, PIN & pickup
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
