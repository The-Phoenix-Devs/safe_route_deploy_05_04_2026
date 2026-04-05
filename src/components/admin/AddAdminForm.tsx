"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addAdminByMobile, addNewAdminWithAuth } from "@/utils/addNewAdmin";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AddAdminForm: React.FC = () => {
  const { user } = useSimpleAuth();
  const [mobileForm, setMobileForm] = useState({
    mobile: "",
    name: "",
    email: "",
  });
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || user.user_type !== "admin") {
      toast({
        title: "Not signed in",
        description: "Sign in as a school admin to add another admin.",
        variant: "destructive",
      });
      return;
    }
    if (!mobileForm.mobile.trim() || !mobileForm.name.trim()) {
      toast({
        title: "Missing fields",
        description: "Mobile number and display name are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await addAdminByMobile(
        user.id,
        mobileForm.mobile,
        mobileForm.name,
        mobileForm.email || null
      );
      if (result.success === false) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: result.message });
      setMobileForm({ mobile: "", name: "", email: "" });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password || !authForm.name) {
      toast({
        title: "Error",
        description: "Fill in email, password, and name.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const result = await addNewAdminWithAuth(
        authForm.email,
        authForm.password,
        authForm.name
      );
      if (result.success) {
        toast({ title: "Success", description: result.message });
        setAuthForm({ email: "", password: "", name: "" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Add new admin</CardTitle>
        <CardDescription>
          Recommended: create an admin who signs in with their mobile number (same as the main admin
          login). Optional tab uses Supabase email sign-up if it is enabled in your project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mobile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mobile">Mobile login</TabsTrigger>
            <TabsTrigger value="email">Email (Auth)</TabsTrigger>
          </TabsList>
          <TabsContent value="mobile" className="mt-4">
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admin-mobile">Mobile number</Label>
                <Input
                  id="admin-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={mobileForm.mobile}
                  onChange={(e) => setMobileForm({ ...mobileForm, mobile: e.target.value })}
                  placeholder="10-digit mobile"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="admin-display">Display name</Label>
                <Input
                  id="admin-display"
                  value={mobileForm.name}
                  onChange={(e) => setMobileForm({ ...mobileForm, name: e.target.value })}
                  placeholder="Name shown in the app"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="admin-email-opt">Email (optional)</Label>
                <Input
                  id="admin-email-opt"
                  type="email"
                  value={mobileForm.email}
                  onChange={(e) => setMobileForm({ ...mobileForm, email: e.target.value })}
                  placeholder="Leave blank to use a placeholder address"
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating…" : "Create admin"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="email" className="mt-4">
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating…" : "Sign up via Supabase Auth"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AddAdminForm;
