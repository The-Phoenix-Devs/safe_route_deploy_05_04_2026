
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { generateCredentials } from '@/utils/authUtils';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Download, Plus } from 'lucide-react';

interface Credential {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: 'guardian' | 'driver' | 'admin';
  createdAt: Date;
}

const CredentialGenerator: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'guardian' | 'driver' | 'admin'>('guardian');
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name to generate credentials.",
        variant: "destructive"
      });
      return;
    }

    const newCreds = generateCredentials(name, role);
    const newCredential: Credential = {
      ...newCreds,
      id: Date.now().toString(),
      name,
      role, // Adding the role property that was missing
      createdAt: new Date(),
      email: `${newCreds.username}@example.com` // Adding a placeholder email
    };

    setCredentials([newCredential, ...credentials]);
    setName('');
    
    toast({
      title: "Credentials Generated",
      description: `Login details created for ${name}`
    });
  };

  const handleCopyCredentials = (credential: Credential) => {
    const credText = `
Name: ${credential.name}
Role: ${credential.role}
Username: ${credential.username}
Password: ${credential.password}
Generated: ${credential.createdAt.toLocaleString()}
    `.trim();
    
    navigator.clipboard.writeText(credText);
    
    toast({
      title: "Copied to Clipboard",
      description: "Login details have been copied to clipboard."
    });
  };

  const handleDownloadAllCredentials = () => {
    if (credentials.length === 0) {
      toast({
        title: "No Credentials",
        description: "There are no credentials to download.",
        variant: "destructive"
      });
      return;
    }

    const credentialsText = credentials.map(cred => `
Name: ${cred.name}
Role: ${cred.role}
Username/Email: ${cred.email}
Password: ${cred.password}
Generated: ${cred.createdAt.toLocaleString()}
----------------------------------------
    `.trim()).join('\n\n');

    const blob = new Blob([credentialsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sishu_tirtha_credentials_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "All credentials have been downloaded as a text file."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Login Credentials</CardTitle>
          <CardDescription>Create login details for guardians, drivers, and administrators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter user's full name"
              />
            </div>
            <div className="space-y-2 sm:w-1/3">
              <Label htmlFor="role">User Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'guardian' | 'driver' | 'admin')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerate} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {credentials.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Generated Credentials</CardTitle>
              <CardDescription>Temporary login details for users</CardDescription>
            </div>
            <Button variant="outline" onClick={handleDownloadAllCredentials}>
              <Download className="mr-2 h-4 w-4" /> Download All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Username/Email</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell>{cred.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          cred.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : cred.role === 'driver'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {cred.role}
                        </span>
                      </TableCell>
                      <TableCell>{cred.email}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger className="text-sm underline cursor-pointer">View Password</DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Password for {cred.name}</DialogTitle>
                              <DialogDescription>This is a temporary password. The user should change it after first login.</DialogDescription>
                            </DialogHeader>
                            <div className="p-4 bg-gray-50 rounded-md border text-center font-mono text-lg">
                              {cred.password}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>{cred.createdAt.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleCopyCredentials(cred)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CredentialGenerator;
