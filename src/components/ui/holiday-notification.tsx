import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HolidayStatus {
  is_holiday: boolean;
  is_weekend: boolean;
  holiday_name: string;
  holiday_message: string;
}

export const HolidayNotification: React.FC = () => {
  const [holidayStatus, setHolidayStatus] = useState<HolidayStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHolidayStatus = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_today_holiday_status')
          .single();

        if (error) throw error;
        setHolidayStatus(data as HolidayStatus);
      } catch (error) {
        console.error('Error checking holiday status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkHolidayStatus();
  }, []);

  if (loading || !holidayStatus || !holidayStatus.holiday_message) {
    return null;
  }

  const isHolidayOrWeekend = holidayStatus.is_holiday || holidayStatus.is_weekend;

  return (
    <Card className={`border-l-4 ${
      isHolidayOrWeekend 
        ? 'border-l-orange-500 bg-orange-50 border-orange-200' 
        : 'border-l-blue-500 bg-blue-50 border-blue-200'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${
            isHolidayOrWeekend ? 'bg-orange-100' : 'bg-blue-100'
          }`}>
            {holidayStatus.is_holiday ? (
              <Calendar className={`h-5 w-5 ${
                isHolidayOrWeekend ? 'text-orange-600' : 'text-blue-600'
              }`} />
            ) : (
              <AlertCircle className={`h-5 w-5 ${
                isHolidayOrWeekend ? 'text-orange-600' : 'text-blue-600'
              }`} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`font-semibold ${
                isHolidayOrWeekend ? 'text-orange-900' : 'text-blue-900'
              }`}>
                {holidayStatus.is_holiday ? holidayStatus.holiday_name : 'Weekend Notice'}
              </h3>
              <Badge variant={isHolidayOrWeekend ? "destructive" : "secondary"}>
                {holidayStatus.is_holiday ? 'Holiday' : 'Weekend'}
              </Badge>
            </div>
            <p className={`text-sm ${
              isHolidayOrWeekend ? 'text-orange-700' : 'text-blue-700'
            }`}>
              {holidayStatus.holiday_message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};