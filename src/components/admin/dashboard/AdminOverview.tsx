import React, { useState, useEffect } from "react";
import AdminDashboardStats from "./AdminDashboardStats";
import { AdminTodaySnapshot } from "./AdminTodaySnapshot";
import { AdminDriverStatusFeed } from "./AdminDriverStatusFeed";
import { AdminQuickActions } from "./AdminQuickActions";
import { AdminUpcomingHolidays } from "./AdminUpcomingHolidays";

const AdminOverview: React.FC = () => {
  const [dashboardData, setDashboardData] = useState({
    totalDrivers: 0,
    totalStudents: 0,
    activeBuses: 0,
    loading: true
  });

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Import services dynamically to avoid circular dependencies
        const [{ getDrivers }, { getStudents }] = await Promise.all([
          import('@/services/driverService'),
          import('@/services/studentService')
        ]);
        
        const [drivers, students] = await Promise.all([
          getDrivers(),
          getStudents()
        ]);
        
        // Count active buses (all drivers with bus numbers)
        const activeBuses = drivers.filter(driver => driver.bus_number).length;
        
        setDashboardData({
          totalDrivers: drivers.length,
          totalStudents: students.length,
          activeBuses,
          loading: false
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-10">
      <AdminDashboardStats dashboardData={dashboardData} />
      <AdminTodaySnapshot />
      <AdminDriverStatusFeed />
      <AdminQuickActions />
      <AdminUpcomingHolidays />
    </div>
  );
};

export default AdminOverview;