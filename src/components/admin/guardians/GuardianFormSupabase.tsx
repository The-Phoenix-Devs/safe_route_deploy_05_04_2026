import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateGuardianData } from '@/hooks/useSupabaseGuardians';

interface GuardianFormSupabaseProps {
  onSubmit: (data: CreateGuardianData) => Promise<any>;
  onCancel: () => void;
}

const GuardianFormSupabase: React.FC<GuardianFormSupabaseProps> = ({
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateGuardianData>({
    email: '',
    username: '',
    mobile_number: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(formData);
      setFormData({ email: '', username: '', mobile_number: '' });
      onCancel();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateGuardianData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          placeholder="Enter username"
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Enter email address"
          required
        />
      </div>

      <div>
        <Label htmlFor="mobile_number">Mobile Number</Label>
        <Input
          id="mobile_number"
          value={formData.mobile_number}
          onChange={(e) => handleChange('mobile_number', e.target.value)}
          placeholder="Enter mobile number"
          required
        />
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Guardian'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default GuardianFormSupabase;