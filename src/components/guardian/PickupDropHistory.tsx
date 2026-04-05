import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Bus, Calendar } from 'lucide-react';
import { usePickupDropHistory } from '@/hooks/usePickupDropHistory';

interface PickupDropHistoryProps {
  guardianProfileId: string | null;
}

const PickupDropHistory: React.FC<PickupDropHistoryProps> = ({ guardianProfileId }) => {
  const { history, loading } = usePickupDropHistory(guardianProfileId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pickup & Drop History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getEventTypeColor = (eventType: string) => {
    return eventType === 'pickup' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getEventTypeIcon = (eventType: string) => {
    return eventType === 'pickup' ? '🚌' : '🏠';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pickup & Drop History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pickup or drop history yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              History will appear here when your child is picked up or dropped off
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((event) => {
              const { date, time } = formatDateTime(event.event_time);
              
              return (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getEventTypeIcon(event.event_type)}</span>
                      <Badge 
                        variant="outline" 
                        className={getEventTypeColor(event.event_type)}
                      >
                        {event.event_type === 'pickup' ? 'Picked Up' : 'Dropped Off'}
                      </Badge>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {date}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {time}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Student
                      </p>
                      <p className="font-medium">{event.student_name}</p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Driver
                      </p>
                      <p className="font-medium">{event.driver_name}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Bus className="h-3 w-3" />
                        Bus
                      </p>
                      <p className="font-medium">{event.bus_number}</p>
                    </div>

                    {event.location_name && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Location
                        </p>
                        <p className="font-medium">{event.location_name}</p>
                        {event.location_lat && event.location_lng && (
                          <p className="text-xs text-muted-foreground">
                            Lat: {Number(event.location_lat).toFixed(6)}, 
                            Lng: {Number(event.location_lng).toFixed(6)}
                          </p>
                        )}
                      </div>
                    )}

                    {event.notes && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-muted-foreground">Notes</p>
                        <p className="font-medium text-sm">{event.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PickupDropHistory;