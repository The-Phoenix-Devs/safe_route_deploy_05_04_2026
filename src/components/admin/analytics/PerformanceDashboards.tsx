import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Target, Star } from 'lucide-react';

export const PerformanceDashboards = () => {
  const kpis = [
    { name: 'On-Time Performance', value: 92.3, target: 95, unit: '%', trend: 'up' },
    { name: 'Fuel Efficiency', value: 12.8, target: 14, unit: 'km/L', trend: 'up' },
    { name: 'Student Satisfaction', value: 4.6, target: 4.5, unit: '/5', trend: 'stable' },
    { name: 'Route Optimization', value: 87.2, target: 90, unit: '%', trend: 'up' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboards</h2>
          <p className="text-muted-foreground">Advanced KPI tracking and analytics</p>
        </div>
      </div>

      <Tabs defaultValue="kpis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kpis">Key Performance Indicators</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {kpis.map((kpi) => {
              const achievement = (kpi.value / kpi.target) * 100;
              return (
                <Card key={kpi.name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{kpi.name}</CardTitle>
                      <Badge variant={achievement >= 100 ? "default" : "secondary"}>
                        {kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {kpi.value}{kpi.unit}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Target: {kpi.target}{kpi.unit}
                      </span>
                    </div>
                    <Progress value={Math.min(achievement, 100)} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      {achievement >= 100 ? 'Target Achieved' : `${(100 - achievement).toFixed(1)}% to target`}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="benchmarks">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>Industry Standards</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">On-Time Performance</span>
                  <span className="font-medium">88%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Fuel Efficiency</span>
                  <span className="font-medium">11.5 km/L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Student Satisfaction</span>
                  <span className="font-medium">4.2/5</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Our Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">On-Time Performance</span>
                  <span className="font-medium text-green-600">92.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Fuel Efficiency</span>
                  <span className="font-medium text-green-600">12.8 km/L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Student Satisfaction</span>
                  <span className="font-medium text-green-600">4.6/5</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance vs Industry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Overall Ranking</span>
                  <Badge variant="default">Top 15%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Efficiency Score</span>
                  <Badge variant="default">Above Average</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Innovation Index</span>
                  <Badge variant="default">High</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['January', 'February', 'March', 'April', 'May'].map((month, index) => {
                  const score = 85 + index * 2;
                  return (
                    <div key={month} className="flex items-center justify-between">
                      <span className="font-medium">{month}</span>
                      <div className="flex items-center space-x-2 w-48">
                        <Progress value={score} className="h-2" />
                        <span className="text-sm font-medium">{score}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};