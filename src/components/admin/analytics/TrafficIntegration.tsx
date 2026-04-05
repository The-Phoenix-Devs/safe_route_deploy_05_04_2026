import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, AlertCircle, Navigation, Clock, TrendingUp, Zap } from 'lucide-react';
import { AdvancedAnalyticsService } from '@/services/advancedAnalyticsService';
import { useToast } from '@/hooks/use-toast';

interface TrafficZone {
  id: string;
  name: string;
  density: 'low' | 'medium' | 'high' | 'severe';
  avgSpeed: number;
  congestionLevel: number;
  incidents: number;
  lastUpdate: string;
}

export const TrafficIntegration = () => {
  const [trafficZones, setTrafficZones] = useState<TrafficZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with demo data
    const demoZones: TrafficZone[] = [
      {
        id: '1',
        name: 'Main Street Corridor',
        density: 'high',
        avgSpeed: 25,
        congestionLevel: 8,
        incidents: 2,
        lastUpdate: new Date().toISOString()
      },
      {
        id: '2',
        name: 'School District Zone',
        density: 'medium',
        avgSpeed: 35,
        congestionLevel: 5,
        incidents: 0,
        lastUpdate: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Highway Junction',
        density: 'severe',
        avgSpeed: 15,
        congestionLevel: 9,
        incidents: 3,
        lastUpdate: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Residential Area',
        density: 'low',
        avgSpeed: 45,
        congestionLevel: 2,
        incidents: 0,
        lastUpdate: new Date().toISOString()
      }
    ];
    setTrafficZones(demoZones);

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (realTimeUpdates) {
        setTrafficZones(prev => prev.map(zone => ({
          ...zone,
          avgSpeed: Math.max(10, zone.avgSpeed + (Math.random() - 0.5) * 10),
          congestionLevel: Math.max(0, Math.min(10, zone.congestionLevel + (Math.random() - 0.5) * 2)),
          lastUpdate: new Date().toISOString()
        })));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  const updateTrafficData = async () => {
    setLoading(true);
    try {
      // Simulate updating traffic data
      await Promise.all(
        trafficZones.map(zone => 
          AdvancedAnalyticsService.updateTrafficData(
            `route-${zone.id}`,
            Math.random() * 90 - 45, // Random lat
            Math.random() * 180 - 90  // Random lng
          )
        )
      );
      
      toast({
        title: "Traffic Data Updated",
        description: "Real-time traffic information refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update traffic data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'severe': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDensityBadgeVariant = (density: string) => {
    switch (density) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'severe': return 'destructive';
      default: return 'outline';
    }
  };

  const getCongestionStatus = (level: number) => {
    if (level >= 8) return { text: 'Severe', color: 'text-red-600' };
    if (level >= 6) return { text: 'Heavy', color: 'text-orange-600' };
    if (level >= 4) return { text: 'Moderate', color: 'text-yellow-600' };
    return { text: 'Light', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Traffic Integration</h2>
          <p className="text-muted-foreground">
            Live traffic monitoring and route optimization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={realTimeUpdates ? "default" : "outline"}
            onClick={() => setRealTimeUpdates(!realTimeUpdates)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Real-time {realTimeUpdates ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={updateTrafficData} disabled={loading}>
            <Navigation className="w-4 h-4 mr-2" />
            {loading ? 'Updating...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Traffic Zones</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="optimization">Route Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {trafficZones.map((zone) => {
              const congestionStatus = getCongestionStatus(zone.congestionLevel);
              return (
                <Card key={zone.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <MapPin className="w-5 h-5" />
                        <span>{zone.name}</span>
                      </CardTitle>
                      <Badge 
                        variant={getDensityBadgeVariant(zone.density)}
                        className={`${getDensityColor(zone.density)} text-white`}
                      >
                        {zone.density.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                      Last updated: {new Date(zone.lastUpdate).toLocaleTimeString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{Math.round(zone.avgSpeed)}</div>
                        <div className="text-sm text-muted-foreground">km/h avg</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{zone.incidents}</div>
                        <div className="text-sm text-muted-foreground">incidents</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Congestion Level</span>
                        <span className={`text-sm font-medium ${congestionStatus.color}`}>
                          {congestionStatus.text}
                        </span>
                      </div>
                      <Progress 
                        value={zone.congestionLevel * 10} 
                        className="h-2"
                      />
                    </div>

                    {zone.incidents > 0 && (
                      <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg border border-red-200">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700">
                          {zone.incidents} active incident{zone.incidents > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Traffic Incidents</CardTitle>
                <CardDescription>Real-time incident monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trafficZones.filter(zone => zone.incidents > 0).map((zone) => (
                    <div key={zone.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{zone.name}</h4>
                        <Badge variant="destructive">{zone.incidents} incidents</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Reported: {new Date(zone.lastUpdate).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Impact: {zone.congestionLevel}/10 congestion level</span>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          Recommended: Use alternative routes or delay departure by 15-30 minutes
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {trafficZones.filter(zone => zone.incidents > 0).length === 0 && (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-green-700">No Active Incidents</h3>
                      <p className="text-green-600">All routes are clear of reported incidents</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Route Recommendations</CardTitle>
                <CardDescription>AI-powered route optimization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Route A → School District</span>
                      <Badge variant="default">Recommended</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Estimated time: 25 minutes</div>
                      <div>Traffic delay: +5 minutes</div>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Route B → Main Street</span>
                      <Badge variant="secondary">Caution</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Estimated time: 35 minutes</div>
                      <div>Traffic delay: +15 minutes</div>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Route C → Highway</span>
                      <Badge variant="destructive">Avoid</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Estimated time: 45 minutes</div>
                      <div>Traffic delay: +25 minutes</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Metrics</CardTitle>
                <CardDescription>Performance improvements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">23%</div>
                    <div className="text-sm text-green-700">Time Saved</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">18%</div>
                    <div className="text-sm text-blue-700">Fuel Saved</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">92%</div>
                    <div className="text-sm text-purple-700">Route Accuracy</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">156</div>
                    <div className="text-sm text-orange-700">Routes Optimized</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};