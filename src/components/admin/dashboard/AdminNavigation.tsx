import React from 'react';
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { 
  Users, Map, Clock, UserCircle, Route as RouteIcon, BarChart3, FileText, UserPlus, Shield,
  MessageCircle, TrendingUp, Calendar, Download, Bell
} from 'lucide-react';

const AdminNavigation: React.FC = () => {
  const router = useRouter();

  const navigationItems = [
    { path: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { path: '/admin/drivers', icon: Users, label: 'Drivers' },
    { path: '/admin/students', icon: Users, label: 'Students' },
    { path: '/admin/routes', icon: RouteIcon, label: 'Routes' },
    { path: '/admin/locations', icon: Map, label: 'Live Map' },
    { path: '/admin/feedback', icon: MessageCircle, label: 'Parent Feedback' },
    { path: '/admin/performance', icon: TrendingUp, label: 'Driver Performance' },
    { path: '/admin/reports', icon: Download, label: 'Reports' },
    { path: '/admin/schedule', icon: Calendar, label: 'Schedule' },
    { path: '/admin/history', icon: Clock, label: 'Trip History' },
    { path: '/admin/user-logs', icon: FileText, label: 'User Logs' },
    { path: '/admin/session-management', icon: Shield, label: 'Session Control' },
    { path: '/admin/notifications', icon: Bell, label: 'Push Notifications' },
    { path: '/admin/add-admin', icon: UserPlus, label: 'Add Admin' },
    { path: '/admin/profile', icon: UserCircle, label: 'My Profile' },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {navigationItems.map((item) => (
        <Button 
          key={item.path}
          variant="outline" 
          className="flex h-auto min-h-[5.5rem] flex-col items-center justify-center gap-1.5 p-3 sm:min-h-24 sm:p-4"
          onClick={() => router.push(item.path)}
        >
          <item.icon className="h-6 w-6 mb-2" />
          <span>{item.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default AdminNavigation;