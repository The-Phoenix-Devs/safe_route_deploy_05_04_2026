import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QrCode, RefreshCw, Trash2, Edit } from 'lucide-react';
import { Driver } from '@/services/driverService';
import { WhatsAppShareButton } from '@/components/ui/whatsapp-share-button';
import { WhatsAppPortalCredentialsButton } from '@/components/admin/WhatsAppPortalCredentialsButton';
import { driverLoginReminderMessage } from '@/utils/whatsappInvite';

interface DriversTableProps {
  drivers: Driver[];
  loading: boolean;
  searchTerm: string;
  loginOrigin: string;
  onViewQrCode: (driver: Driver) => void;
  onRegenerateQr?: (driver: Driver) => void;
  onEditDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

const DriversTableSupabase: React.FC<DriversTableProps> = ({
  drivers,
  loading,
  searchTerm,
  loginOrigin,
  onViewQrCode,
  onRegenerateQr,
  onEditDriver,
  onDeleteDriver
}) => {
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.bus_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.profile?.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex justify-center py-4">Loading drivers...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>License</TableHead>
            <TableHead>Bus Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDrivers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                No drivers found
              </TableCell>
            </TableRow>
          ) : (
            filteredDrivers.map((driver) => {
              const waPhone =
                driver.mobile_number || driver.phone || driver.profile?.username;
              const waUser =
                driver.profile?.username || driver.mobile_number || waPhone || "—";
              const waMsg = driverLoginReminderMessage({
                name: driver.name,
                username: waUser,
                busNumber: driver.bus_number || "—",
                loginOrigin,
                pin: null,
              });
              return (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.name}</TableCell>
                <TableCell>{driver.profile?.username || 'N/A'}</TableCell>
                <TableCell>{driver.profile?.email || 'N/A'}</TableCell>
                <TableCell>{driver.phone || driver.mobile_number || 'N/A'}</TableCell>
                <TableCell>{driver.license_number || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{driver.bus_number}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">Active</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {driver.profile_id ? (
                      <WhatsAppPortalCredentialsButton
                        phone={waPhone}
                        profileId={driver.profile_id}
                        buildMessage={(pin) =>
                          driverLoginReminderMessage({
                            name: driver.name,
                            username: waUser,
                            busNumber: driver.bus_number || "—",
                            loginOrigin,
                            pin,
                          })
                        }
                        title="Send driver login details via WhatsApp"
                      />
                    ) : (
                      <WhatsAppShareButton phone={waPhone} message={waMsg} />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      title="Show login QR"
                      onClick={() => onViewQrCode(driver)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    {onRegenerateQr ? (
                      <Button
                        variant="outline"
                        size="sm"
                        title="Renew QR (invalidates old codes)"
                        onClick={() => onRegenerateQr(driver)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditDriver(driver)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteDriver(driver.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DriversTableSupabase;