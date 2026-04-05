"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  createGuardianCoordinator,
} from "@/services/guardianCoordinatorService";
import { coordinatorWelcomeMessage, openWhatsAppInvite } from "@/utils/whatsappInvite";
import { UsersRound, MessageCircle } from "lucide-react";

const AddGuardianCoordinatorForm: React.FC = () => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{
    username: string;
    mobile_number: string;
    pin: string;
  } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreated(null);
    try {
      const result = await createGuardianCoordinator({
        name: name.trim(),
        mobile_number: mobile.trim(),
      });
      setCreated({
        username: result.username,
        mobile_number: result.mobile_number,
        pin: result.pin,
      });
      setName("");
      setMobile("");
      toast({
        title: "Coordinator created",
        description: `PIN: ${result.pin} — share securely or send via WhatsApp.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not create coordinator";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openWa = () => {
    if (!created) return;
    openWhatsAppInvite(
      created.mobile_number,
      coordinatorWelcomeMessage({
        name: created.username,
        mobile: created.mobile_number,
        pin: created.pin,
      }),
    );
  };

  return (
    <Card className="w-full max-w-lg border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UsersRound className="h-5 w-5 text-primary" />
          Parent coordinator
        </CardTitle>
        <CardDescription>
          Creates a limited admin who signs in with mobile + 6-digit PIN (separate from full school admin).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coord-name">Display name</Label>
            <Input
              id="coord-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PTA transport lead"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coord-mobile">Mobile number</Label>
            <Input
              id="coord-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit number"
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create coordinator"}
          </Button>
        </form>

        {created && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
            <p className="font-medium">Credentials (copy or send)</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <span className="text-foreground">Mobile:</span> {created.mobile_number}
              </li>
              <li>
                <span className="text-foreground">6-digit PIN:</span>{" "}
                <span className="font-mono font-semibold tracking-widest text-foreground">{created.pin}</span>
              </li>
            </ul>
            <Button type="button" variant="secondary" className="w-full gap-2" onClick={openWa}>
              <MessageCircle className="h-4 w-4" />
              Open WhatsApp (welcome message)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AddGuardianCoordinatorForm;
