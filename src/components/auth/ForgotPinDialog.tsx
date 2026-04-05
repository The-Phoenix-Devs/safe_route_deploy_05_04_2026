"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/utils/whatsappInvite";

function supportPhoneDigits(): string {
  return (process.env.NEXT_PUBLIC_LOGIN_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");
}

function forgotMessage(role: "guardian" | "driver", pageUrl: string): string {
  const school = process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || "Sishu Tirtha Safe Route";
  const kind = role === "guardian" ? "Guardian / parent" : "Driver";
  return (
    `Hello, I forgot my *6-digit login PIN* for ${school} (${kind}).\n\n` +
    (pageUrl ? `Page: ${pageUrl}\n` : "") +
    `Please reset my PIN or tell me how to sign in. Thank you.`
  );
}

type Props = {
  role: "guardian" | "driver";
  triggerClassName?: string;
};

export function ForgotPinDialog({ role, triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const phone = supportPhoneDigits();
  const pageUrl =
    typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "";
  const waHref =
    phone.length >= 10 ? buildWhatsAppLink(phone, forgotMessage(role, pageUrl)) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            triggerClassName ??
            "text-sm font-medium text-primary underline-offset-4 hover:underline"
          }
        >
          Forgot PIN?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset your PIN</DialogTitle>
          <DialogDescription className="text-left leading-relaxed">
            For security, PINs are managed by your school. Contact the office to reset your
            6-digit PIN, or message them on WhatsApp if that option is enabled.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          {waHref ? (
            <Button asChild>
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                WhatsApp school
              </a>
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
