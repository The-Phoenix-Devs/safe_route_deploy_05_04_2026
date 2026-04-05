import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Award,
  MapPin,
  Gauge
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DriverPerformance {
  id: string;
  name: string;
  email: string;
  mobile_number: string;
  bus_number: string;
  total_trips: number;
  on_time_trips: number;
  delayed_trips: number;
  cancelled_trips: number;
  on_time_rate: number;
  average_speed: number;
  fuel_efficiency: number;
  safety_score: number;
  student_feedback_rating: number;
  recent_violations: number;
  route_name?: string;
}

const AdminDriverPerformance: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverPerformance[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [sortBy, setSortBy] = useState('on_time_rate');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDriverPerformance();
  }, [selectedPeriod, sortBy]);

  const fetchDriverPerformance = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Fetch drivers with their performance data
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select(`
          id,
          name,
          mobile_number,
          bus_number,
          routes:route_id(name),
          profiles:profile_id(email)
        `);

      if (driversError) throw driversError;

      // Fetch analytics data for each driver
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics_summary')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (analyticsError) throw analyticsError;

      // Fetch speed violations
      const { data: violationsData, error: violationsError } = await supabase
        .from('speed_violations')
        .select('driver_id')
        .gte('created_at', startDate.toISOString());

      if (violationsError) throw violationsError;

      // Process the data
      const processedDrivers = driversData?.map(driver => {
        const driverAnalytics = analyticsData?.filter(a => a.driver_id === driver.id) || [];
        const driverViolations = violationsData?.filter(v => v.driver_id === driver.id) || [];
        
        const totalTrips = driverAnalytics.reduce((sum, a) => sum + a.total_trips, 0);
        const onTimeTrips = driverAnalytics.reduce((sum, a) => sum + a.on_time_trips, 0);
        const delayedTrips = driverAnalytics.reduce((sum, a) => sum + a.delayed_trips, 0);
        const cancelledTrips = driverAnalytics.reduce((sum, a) => sum + a.cancelled_trips, 0);
        
        const onTimeRate = totalTrips > 0 ? (onTimeTrips / totalTrips) * 100 : 0;
        const averageSpeed = driverAnalytics.length > 0 
          ? driverAnalytics.reduce((sum, a) => sum + (a.average_speed || 0), 0) / driverAnalytics.length 
          : 0;

        // Calculate safety score based on violations and on-time performance
        const violationScore = Math.max(0, 100 - (driverViolations.length * 10));
        const punctualityScore = onTimeRate;
        const safetyScore = (violationScore + punctualityScore) / 2;

        return {
          id: driver.id,
          name: driver.name,
          email: (driver.profiles as any)?.email || '',
          mobile_number: driver.mobile_number || '',
          bus_number: driver.bus_number,
          total_trips: totalTrips,
          on_time_trips: onTimeTrips,
          delayed_trips: delayedTrips,
          cancelled_trips: cancelledTrips,
          on_time_rate: onTimeRate,
          average_speed: averageSpeed,
          fuel_efficiency: Math.random() * 20 + 10, // Mock data
          safety_score: safetyScore,
          student_feedback_rating: Math.random() * 2 + 3, // Mock data
          recent_violations: driverViolations.length,
          route_name: (driver.routes as any)?.name || 'Unassigned'
        };
      }).sort((a, b) => {
        switch (sortBy) {
          case 'on_time_rate':
            return b.on_time_rate - a.on_time_rate;
          case 'safety_score':
            return b.safety_score - a.safety_score;
          case 'total_trips':
            return b.total_trips - a.total_trips;
          default:
            return b.on_time_rate - a.on_time_rate;
        }
      }) || [];

      setDrivers(processedDrivers);
    } catch (error: any) {
      console.error('Error fetching driver performance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch driver performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (score >= 80) return <Badge variant="secondary">Good</Badge>;
    if (score >= 70) return <Badge variant="outline">Average</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Driver Performance Metrics</h2>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Driver Performance Metrics</h2>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on_time_rate">On-Time Rate</SelectItem>
              <SelectItem value="safety_score">Safety Score</SelectItem>
              <SelectItem value="total_trips">Total Trips</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.length}</div>
            <p className="text-xs text-muted-foreground">
              {drivers.filter(d => d.total_trips > 0).length} with trips
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg On-Time Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.length > 0 
                ? (drivers.reduce((sum, d) => sum + d.on_time_rate, 0) / drivers.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {drivers.length > 0 ? drivers[0]?.name : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {drivers.length > 0 ? `${drivers[0]?.on_time_rate.toFixed(1)}% on-time` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.reduce((sum, d) => sum + d.recent_violations, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Driver Performance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Driver Performance Rankings
          </CardTitle>
          <CardDescription>
            Detailed performance metrics for all drivers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {drivers.map((driver, index) => (
              <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{driver.name}</h4>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {driver.bus_number} • {driver.route_name}
                      </span>
                      <span>{driver.total_trips} trips</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm font-medium">{driver.on_time_rate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">On-Time</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">{driver.safety_score.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Safety</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium flex justify-center">
                      {getRatingStars(driver.student_feedback_rating)}
                    </div>
                    <div className="text-xs text-muted-foreground">Feedback</div>
                  </div>
                  
                  <div>
                    {getPerformanceBadge(driver.on_time_rate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDriverPerformance;