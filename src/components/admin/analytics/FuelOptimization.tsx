import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Fuel, Leaf, DollarSign, TrendingDown, Route, Lightbulb } from 'lucide-react';
import { AdvancedAnalyticsService, RouteEfficiency } from '@/services/advancedAnalyticsService';
import { useToast } from '@/hooks/use-toast';

export const FuelOptimization = () => {
  const [optimizations, setOptimizations] = useState<RouteEfficiency[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runOptimization = async () => {
    setLoading(true);
    try {
      const optimization = await AdvancedAnalyticsService.optimizeRouteForFuel(
        'sample-route-id',
        'sample-driver-id'
      );
      
      if (optimization) {
        setOptimizations(prev => [optimization, ...prev.slice(0, 4)]);
        toast({
          title: "Route Optimized",
          description: "Fuel efficiency analysis completed",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize route",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, text: 'Excellent' };
    if (score >= 75) return { variant: 'secondary' as const, text: 'Good' };
    return { variant: 'destructive' as const, text: 'Needs Improvement' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fuel Optimization</h2>
          <p className="text-muted-foreground">
            AI-powered route optimization for maximum fuel efficiency
          </p>
        </div>
        <Button 
          onClick={runOptimization} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Fuel className="w-4 h-4 mr-2" />
          {loading ? 'Optimizing...' : 'Run Optimization'}
        </Button>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis">Efficiency Analysis</TabsTrigger>
          <TabsTrigger value="savings">Cost Savings</TabsTrigger>
          <TabsTrigger value="environmental">Environmental Impact</TabsTrigger>
          <TabsTrigger value="suggestions">Optimization Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {optimizations.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No optimization data available yet</p>
                </CardContent>
              </Card>
            ) : (
              optimizations.map((optimization) => {
                const efficiency = optimization.efficiency_score || 0;
                const badge = getEfficiencyBadge(efficiency);
                return (
                  <Card key={optimization.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Route Analysis</CardTitle>
                        <Badge variant={badge.variant}>{badge.text}</Badge>
                      </div>
                      <CardDescription>
                        Date: {new Date(optimization.date).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Distance:</span>
                          <div className="font-medium">{optimization.total_distance.toFixed(1)} km</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fuel Used:</span>
                          <div className="font-medium">{optimization.fuel_consumed?.toFixed(2)} L</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Efficiency:</span>
                          <div className="font-medium">{optimization.fuel_efficiency?.toFixed(1)} km/L</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Delays:</span>
                          <div className="font-medium">{optimization.traffic_delays} min</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Efficiency Score</span>
                          <span className={`text-sm font-medium ${getEfficiencyColor(efficiency)}`}>
                            {efficiency.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={efficiency} className="h-2" />
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm text-green-800">
                          <strong>Potential Savings:</strong>
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                          Distance: {((optimization.total_distance - (optimization.optimal_distance || 0))).toFixed(1)} km saved
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span>Cost Analysis</span>
                </CardTitle>
                <CardDescription>Monthly fuel cost breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">Current Monthly Cost</span>
                    <span className="text-red-600 font-bold">₹45,200</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Optimized Cost</span>
                    <span className="text-green-600 font-bold">₹37,800</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <span className="font-medium">Monthly Savings</span>
                    <span className="text-blue-600 font-bold">₹7,400</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Annual Projection</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-bold">₹88,800</div>
                      <div className="text-muted-foreground">Total Savings</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-bold">16.4%</div>
                      <div className="text-muted-foreground">Cost Reduction</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                  <span>Efficiency Trends</span>
                </CardTitle>
                <CardDescription>Performance over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">This Week</span>
                      <span className="font-medium">87.3%</span>
                    </div>
                    <Progress value={87.3} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Last Week</span>
                      <span className="font-medium">84.1%</span>
                    </div>
                    <Progress value={84.1} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Last Month</span>
                      <span className="font-medium">81.8%</span>
                    </div>
                    <Progress value={81.8} className="h-2" />
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      +5.5% improvement this month
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="environmental" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <span>CO₂ Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">2.8</div>
                  <div className="text-sm text-muted-foreground">Tons CO₂ saved/month</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Emission Reduction</span>
                    <span className="font-medium">18.3%</span>
                  </div>
                  <Progress value={18.3} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Environmental Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">147</div>
                  <div className="text-sm text-green-700">Trees Equivalent Saved</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">1,240</div>
                  <div className="text-sm text-blue-700">Liters Fuel Saved</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Green Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">A+</div>
                  <div className="text-sm text-muted-foreground">Environmental Rating</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Carbon Efficiency</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span>AI Optimization Suggestions</span>
                </CardTitle>
                <CardDescription>Personalized recommendations for your fleet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-600">Route Optimization</h4>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start space-x-2">
                          <Route className="w-4 h-4 mt-1 text-blue-500" />
                          <div>
                            <div className="font-medium text-sm">Alternative Route 1</div>
                            <div className="text-xs text-muted-foreground">
                              Avoid Main Street during 8-9 AM. Saves 12% fuel.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start space-x-2">
                          <Route className="w-4 h-4 mt-1 text-blue-500" />
                          <div>
                            <div className="font-medium text-sm">Off-Peak Timing</div>
                            <div className="text-xs text-muted-foreground">
                              Start routes 15 minutes earlier. Reduces traffic delays by 8 minutes.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-orange-600">Driving Behavior</h4>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="font-medium text-sm">Maintain Steady Speed</div>
                        <div className="text-xs text-muted-foreground">
                          Keep speed between 40-60 km/h for optimal efficiency.
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="font-medium text-sm">Reduce Idling</div>
                        <div className="text-xs text-muted-foreground">
                          Turn off engine during stops longer than 30 seconds.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Weekly Challenge</h4>
                  <p className="text-sm text-blue-700">
                    Try to achieve 85% efficiency score this week. Current progress: 
                    <span className="font-medium ml-1">73/85%</span>
                  </p>
                  <Progress value={(73/85)*100} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};