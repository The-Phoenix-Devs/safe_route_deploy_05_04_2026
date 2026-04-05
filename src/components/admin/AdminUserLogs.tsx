import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, User, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserLog {
  id: string;
  user_id: string;
  user_type: 'driver' | 'guardian' | 'admin';
  user_name: string;
  login_time: string;
  location: string;
  ip_address: string;
  device_info: string;
}

const AdminUserLogs: React.FC = () => {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserType, setFilterUserType] = useState<string>('all');
  const { toast } = useToast();

  const fetchUserLogs = async () => {
    try {
      setLoading(true);
      
      const { data: userLogs, error } = await supabase
        .from('user_logs')
        .select('*')
        .order('login_time', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching user logs:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch user logs',
          variant: 'destructive',
        });
        return;
      }

      // Type and filter the data to match our interface
      const typedLogs: UserLog[] = (userLogs || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        user_type: log.user_type as 'driver' | 'guardian' | 'admin',
        user_name: log.user_name,
        login_time: log.login_time || log.created_at || new Date().toISOString(),
        location: log.location || 'Unknown',
        ip_address: log.ip_address || 'Unknown',
        device_info: log.device_info || 'Unknown'
      }));
      
      setLogs(typedLogs);
    } catch (error) {
      console.error('Error fetching user logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ip_address.includes(searchTerm);
    const matchesFilter = filterUserType === 'all' || log.user_type === filterUserType;
    return matchesSearch && matchesFilter;
  });

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'driver':
        return 'bg-blue-100 text-blue-800';
      case 'guardian':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Login Logs</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Login Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterUserType} onValueChange={setFilterUserType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="driver">Drivers</SelectItem>
                <SelectItem value="guardian">Guardians</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No login logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user_name}</TableCell>
                      <TableCell>
                        <Badge className={getUserTypeColor(log.user_type)}>
                          {log.user_type.charAt(0).toUpperCase() + log.user_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDateTime(log.login_time)}</span>
                        </div>
                      </TableCell>
                       <TableCell>
                         <div className="flex items-center space-x-2">
                           <MapPin className="h-4 w-4 text-muted-foreground" />
                           <div className="flex flex-col space-y-1">
                             <span className="text-sm font-medium">
                               {log.location && log.location !== 'Unknown' ? 
                                 (log.location.includes(',') ? 'GPS Coordinates' : log.location) : 
                                 'Unknown Location'
                               }
                             </span>
                             {log.location && log.location !== 'Unknown' && log.location.includes(',') && (
                               <div className="text-xs text-muted-foreground font-mono space-y-0.5">
                                 <div>Lat: {log.location.split(',')[0].trim()}</div>
                                 <div>Lng: {log.location.split(',')[1].trim()}</div>
                               </div>
                             )}
                           </div>
                         </div>
                       </TableCell>
                      <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.device_info || 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserLogs;