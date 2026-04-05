
import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash, QrCode } from 'lucide-react';
import { Driver } from './types';

interface DriversTableProps {
  drivers: Driver[];
  loading: boolean;
  searchTerm: string;
  onViewQrCode: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

const DriversTable: React.FC<DriversTableProps> = ({ 
  drivers, 
  loading, 
  searchTerm, 
  onViewQrCode, 
  onDeleteDriver 
}) => {
  // Filter drivers based on search term
  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    driver.phone.includes(searchTerm) ||
    driver.busNumber.includes(searchTerm)
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>License</TableHead>
          <TableHead>Bus Number</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-4">
              Loading drivers...
            </TableCell>
          </TableRow>
        ) : filteredDrivers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-4">
              No drivers found
            </TableCell>
          </TableRow>
        ) : (
          filteredDrivers.map((driver) => (
            <TableRow key={driver.id}>
              <TableCell>{driver.name}</TableCell>
              <TableCell>{driver.phone}</TableCell>
              <TableCell>{driver.license}</TableCell>
              <TableCell>{driver.busNumber}</TableCell>
              <TableCell>{driver.status}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onViewQrCode(driver)}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onDeleteDriver(driver.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default DriversTable;
