import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Calendar, Award } from 'lucide-react';

export const StudentBehaviorAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const studentMetrics = {
    attendanceRate: 94.2,
    punctualityRate: 87.8,
    behaviorScore: 4.3,
    totalStudents: 156
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Behavior Analytics</h2>
          <p className="text-muted-foreground">Attendance patterns and behavior analysis</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="punctuality">Punctuality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentMetrics.totalStudents}</div>
                <Badge variant="default">Active</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{studentMetrics.attendanceRate}%</div>
                <Progress value={studentMetrics.attendanceRate} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Punctuality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{studentMetrics.punctualityRate}%</div>
                <Progress value={studentMetrics.punctualityRate} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Behavior Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{studentMetrics.behaviorScore}/5</div>
                <Progress value={studentMetrics.behaviorScore * 20} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => {
                  const attendance = 95 - index * 2;
                  return (
                    <div key={day} className="flex items-center justify-between">
                      <span className="font-medium">{day}</span>
                      <div className="flex items-center space-x-2 w-32">
                        <Progress value={attendance} className="h-2" />
                        <span className="text-sm font-medium">{attendance}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="punctuality">
          <Card>
            <CardHeader>
              <CardTitle>Punctuality Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">82%</div>
                  <div className="text-sm text-green-700">On Time</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">15%</div>
                  <div className="text-sm text-yellow-700">Slightly Late</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">3%</div>
                  <div className="text-sm text-red-700">Significantly Late</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};