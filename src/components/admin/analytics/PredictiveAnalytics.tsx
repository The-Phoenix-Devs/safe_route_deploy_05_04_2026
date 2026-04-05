import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { AdvancedAnalyticsService, ETAPrediction } from '@/services/advancedAnalyticsService';
import { useToast } from '@/hooks/use-toast';

export const PredictiveAnalytics = () => {
  const [predictions, setPredictions] = useState<ETAPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generatePrediction = async () => {
    setLoading(true);
    try {
      // Demo with sample data
      const prediction = await AdvancedAnalyticsService.generateETAPrediction(
        'sample-route-id',
        'sample-driver-id'
      );
      
      if (prediction) {
        setPredictions(prev => [prediction, ...prev.slice(0, 4)]);
        toast({
          title: "ETA Prediction Generated",
          description: "New prediction created successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate prediction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.8) return 'bg-green-500';
    if (score > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (score: number) => {
    if (score > 0.8) return 'High';
    if (score > 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Predictive Analytics</h2>
          <p className="text-muted-foreground">
            AI-powered ETA predictions and route analysis
          </p>
        </div>
        <Button 
          onClick={generatePrediction} 
          disabled={loading}
          className="bg-primary hover:bg-primary/90"
        >
          <Clock className="w-4 h-4 mr-2" />
          {loading ? 'Generating...' : 'Generate Prediction'}
        </Button>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">ETA Predictions</TabsTrigger>
          <TabsTrigger value="accuracy">Model Accuracy</TabsTrigger>
          <TabsTrigger value="factors">Influencing Factors</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {predictions.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No predictions generated yet</p>
                </CardContent>
              </Card>
            ) : (
              predictions.map((prediction) => (
                <Card key={prediction.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Route Prediction</CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={`${getConfidenceColor(prediction.confidence_score)} text-white`}
                      >
                        {getConfidenceText(prediction.confidence_score)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Driver ID: {prediction.driver_id.slice(0, 8)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Predicted ETA:</span>
                      <span className="font-medium">
                        {new Date(prediction.predicted_eta).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence Score</span>
                        <span>{Math.round(prediction.confidence_score * 100)}%</span>
                      </div>
                      <Progress 
                        value={prediction.confidence_score * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Traffic: {Math.round(prediction.traffic_factor * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Weather: {Math.round(prediction.weather_factor * 100)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="accuracy" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
                <CardDescription>Prediction accuracy metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Overall Accuracy</span>
                    <span className="font-medium">87.3%</span>
                  </div>
                  <Progress value={87.3} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Rush Hour Accuracy</span>
                    <span className="font-medium">82.1%</span>
                  </div>
                  <Progress value={82.1} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Off-Peak Accuracy</span>
                    <span className="font-medium">91.8%</span>
                  </div>
                  <Progress value={91.8} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction Statistics</CardTitle>
                <CardDescription>Last 30 days performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">1,247</div>
                    <div className="text-sm text-muted-foreground">Accurate Predictions</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">184</div>
                    <div className="text-sm text-muted-foreground">Minor Deviations</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">43</div>
                    <div className="text-sm text-muted-foreground">Major Deviations</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-red-600">12</div>
                    <div className="text-sm text-muted-foreground">Failed Predictions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="factors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span>Traffic Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High congestion periods</span>
                    <Badge variant="destructive">+35% delay</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium traffic</span>
                    <Badge variant="secondary">+15% delay</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Free flow traffic</span>
                    <Badge variant="outline">Normal timing</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span>Weather Factors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Heavy rain</span>
                    <Badge variant="destructive">+25% delay</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Light rain</span>
                    <Badge variant="secondary">+10% delay</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Clear weather</span>
                    <Badge variant="outline">Normal timing</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Historical Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Data quality</span>
                    <Badge variant="default">Excellent</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Data points</span>
                    <span className="text-sm font-medium">50,000+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Coverage period</span>
                    <span className="text-sm font-medium">12 months</span>
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