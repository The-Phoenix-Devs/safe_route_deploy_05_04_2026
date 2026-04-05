import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, BarChart3, Users, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminReports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const reportTypes = [
    { id: 'daily-summary', name: 'Daily Trip Summary', icon: Calendar },
    { id: 'driver-performance', name: 'Driver Performance Report', icon: Users },
    { id: 'route-analytics', name: 'Route Analytics Report', icon: MapPin },
    { id: 'safety-incidents', name: 'Safety Incidents Report', icon: BarChart3 },
    { id: 'parent-feedback', name: 'Parent Feedback Summary', icon: FileText },
  ];

  const generateReport = async () => {
    if (!selectedReport) return;
    
    setGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false);
      toast({
        title: "Report Generated",
        description: "Your report has been generated and will be emailed to you.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Automated Report Generation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Create automated reports for analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map(report => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={generateReport} 
              disabled={!selectedReport || generating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Previously generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Daily Summary - Today</p>
              <p>Driver Performance - Yesterday</p>
              <p>Route Analytics - This Week</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;