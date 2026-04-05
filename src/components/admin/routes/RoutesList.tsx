
import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, Map, Users, User } from 'lucide-react';
import { Route } from './types';
import { Driver } from '@/services/driverService';

interface RoutesListProps {
  routes: Route[];
  drivers: Driver[];
  onDelete: (id: string) => void;
  onEdit?: (route: Route) => void;
}

const RoutesList: React.FC<RoutesListProps> = ({ routes, drivers, onDelete, onEdit }) => {
  const getAssignedDrivers = (routeId: string) => {
    return drivers.filter(driver => driver.route_id === routeId);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Start & End Points</TableHead>
          <TableHead>Assigned Drivers</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {routes.map((route) => {
          const assignedDrivers = getAssignedDrivers(route.id);
          
          return (
            <TableRow key={route.id}>
              <TableCell className="font-medium">{route.name}</TableCell>
              <TableCell>{route.description}</TableCell>
              <TableCell>
                <div className="text-xs">
                  <p>From: {route.start_point}</p>
                  <p>To: {route.end_point}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {assignedDrivers.length > 0 ? (
                    assignedDrivers.map((driver) => (
                      <div key={driver.id} className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {driver.name}
                        </Badge>
                        {driver.bus_number && (
                          <Badge variant="outline" className="text-xs">
                            Bus: {driver.bus_number}
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Unassigned
                    </Badge>
                  )}
                </div>
                {assignedDrivers.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {assignedDrivers.length} driver{assignedDrivers.length !== 1 ? 's' : ''} assigned
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="icon">
                    <Map className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEdit && onEdit(route)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onDelete(route.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default RoutesList;
