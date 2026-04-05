import { supabase } from '@/integrations/supabase/client';

export interface ETAPrediction {
  id: string;
  route_id: string;
  driver_id: string;
  predicted_eta: string;
  actual_eta?: string;
  prediction_accuracy?: number;
  traffic_factor: number;
  weather_factor: number;
  historical_factor: number;
  confidence_score: number;
}

export interface TrafficData {
  id: string;
  route_id: string;
  latitude: number;
  longitude: number;
  traffic_density: 'low' | 'medium' | 'high' | 'severe';
  average_speed?: number;
  congestion_level: number;
  incident_reported: boolean;
  weather_impact?: string;
  timestamp: string;
}

export interface StudentAnalytics {
  id: string;
  student_id: string;
  date: string;
  attendance_status: 'present' | 'absent' | 'late';
  pickup_time?: string;
  dropoff_time?: string;
  delay_minutes: number;
  behavior_score: number;
  location_accuracy?: number;
  guardian_notified: boolean;
  notes?: string;
}

export interface RouteEfficiency {
  id: string;
  route_id: string;
  driver_id: string;
  date: string;
  total_distance: number;
  fuel_consumed?: number;
  fuel_efficiency?: number;
  optimal_distance?: number;
  efficiency_score?: number;
  co2_emissions?: number;
  cost_analysis: any;
  optimization_suggestions: string[];
  traffic_delays: number;
}

export interface PerformanceKPI {
  id: string;
  metric_name: string;
  metric_category: 'efficiency' | 'safety' | 'satisfaction' | 'cost';
  metric_value: number;
  target_value?: number;
  unit: string;
  period_start: string;
  period_end: string;
  driver_id?: string;
  route_id?: string;
  trend_direction: 'improving' | 'declining' | 'stable';
  benchmark_comparison?: number;
  metadata: any;
}

export class AdvancedAnalyticsService {
  // ETA Prediction using simple ML algorithm
  static async generateETAPrediction(routeId: string, driverId: string): Promise<ETAPrediction | null> {
    try {
      // Get historical data for the route
      const { data: historicalData } = await supabase
        .from('pickup_drop_history')
        .select('*')
        .eq('driver_id', driverId)
        .order('event_time', { ascending: false })
        .limit(50);

      // Get current traffic data
      const { data: trafficData } = await supabase
        .from('traffic_data')
        .select('*')
        .eq('route_id', routeId)
        .order('timestamp', { ascending: false })
        .limit(10);

      // Simple ML algorithm - calculate average times with factors
      const avgTravelTime = this.calculateAverageTime(historicalData || []);
      const trafficFactor = this.calculateTrafficFactor(trafficData || []);
      const weatherFactor = this.calculateWeatherFactor();
      const historicalFactor = this.calculateHistoricalFactor(historicalData || []);

      // Predict ETA
      const adjustedTime = avgTravelTime * trafficFactor * weatherFactor * historicalFactor;
      const predictedETA = new Date(Date.now() + adjustedTime * 60000); // Convert to milliseconds

      const prediction = {
        route_id: routeId,
        driver_id: driverId,
        predicted_eta: predictedETA.toISOString(),
        traffic_factor: trafficFactor,
        weather_factor: weatherFactor,
        historical_factor: historicalFactor,
        confidence_score: this.calculateConfidenceScore(historicalData?.length || 0),
        model_version: 'v1.0'
      };

      const { data, error } = await supabase
        .from('eta_predictions')
        .insert(prediction)
        .select()
        .single();

      if (error) throw error;
      return data as ETAPrediction;
    } catch (error) {
      console.error('Error generating ETA prediction:', error);
      return null;
    }
  }

  // Traffic Integration
  static async updateTrafficData(routeId: string, latitude: number, longitude: number): Promise<void> {
    try {
      // In a real implementation, this would call external traffic APIs like Google Maps or HERE
      // For demo, we'll simulate traffic data
      const trafficData = {
        route_id: routeId,
        latitude,
        longitude,
        traffic_density: this.simulateTrafficDensity(),
        average_speed: Math.random() * 50 + 20, // 20-70 km/h
        congestion_level: Math.floor(Math.random() * 10),
        incident_reported: Math.random() < 0.1, // 10% chance of incident
        data_source: 'simulation'
      };

      await supabase.from('traffic_data').insert(trafficData);
    } catch (error) {
      console.error('Error updating traffic data:', error);
    }
  }

  // Student Behavior Analysis
  static async analyzeStudentBehavior(studentId: string, dateRange: { start: string; end: string }) {
    try {
      const { data: analytics } = await supabase
        .from('student_analytics')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (!analytics) return null;

      // Calculate behavior metrics
      const totalDays = analytics.length;
      const presentDays = analytics.filter(a => a.attendance_status === 'present').length;
      const lateDays = analytics.filter(a => a.attendance_status === 'late').length;
      const avgBehaviorScore = analytics.reduce((sum, a) => sum + a.behavior_score, 0) / totalDays;
      const avgDelayMinutes = analytics.reduce((sum, a) => sum + a.delay_minutes, 0) / totalDays;

      return {
        attendanceRate: (presentDays / totalDays) * 100,
        punctualityRate: ((totalDays - lateDays) / totalDays) * 100,
        averageBehaviorScore: avgBehaviorScore,
        averageDelay: avgDelayMinutes,
        totalDays,
        trends: this.calculateBehaviorTrends(analytics)
      };
    } catch (error) {
      console.error('Error analyzing student behavior:', error);
      return null;
    }
  }

  // Route Optimization for Fuel Efficiency
  static async optimizeRouteForFuel(routeId: string, driverId: string): Promise<RouteEfficiency | null> {
    try {
      // Get route data and calculate optimization
      const { data: routeData } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .single();

      const { data: trafficData } = await supabase
        .from('traffic_data')
        .select('*')
        .eq('route_id', routeId)
        .order('timestamp', { ascending: false })
        .limit(10);

      // Calculate current efficiency metrics
      const currentDistance = Math.random() * 50 + 10; // Simulated
      const fuelConsumed = currentDistance * 0.1; // Simulated fuel consumption
      const optimalDistance = currentDistance * 0.85; // 15% optimization potential
      const efficiencyScore = (optimalDistance / currentDistance) * 100;

      const efficiency = {
        route_id: routeId,
        driver_id: driverId,
        date: new Date().toISOString().split('T')[0],
        total_distance: currentDistance,
        fuel_consumed: fuelConsumed,
        fuel_efficiency: currentDistance / fuelConsumed,
        optimal_distance: optimalDistance,
        efficiency_score: efficiencyScore,
        co2_emissions: fuelConsumed * 2.31, // kg CO2 per liter
        cost_analysis: {
          currentCost: fuelConsumed * 100, // INR per liter
          optimizedCost: (fuelConsumed * 0.85) * 100,
          savings: (fuelConsumed * 0.15) * 100
        },
        optimization_suggestions: this.generateOptimizationSuggestions(trafficData || []),
        traffic_delays: Math.floor(Math.random() * 30)
      };

      const { data, error } = await supabase
        .from('route_efficiency')
        .insert(efficiency)
        .select()
        .single();

      if (error) throw error;
      return data as RouteEfficiency;
    } catch (error) {
      console.error('Error optimizing route for fuel:', error);
      return null;
    }
  }

  // Performance KPI Tracking
  static async updatePerformanceKPIs(category: string, period: { start: string; end: string }) {
    try {
      const kpis = await this.calculateKPIs(category, period);
      
      for (const kpi of kpis) {
        await supabase.from('performance_kpis').upsert(kpi);
      }

      return kpis;
    } catch (error) {
      console.error('Error updating performance KPIs:', error);
      return [];
    }
  }

  // Helper methods
  private static calculateAverageTime(historicalData: any[]): number {
    if (historicalData.length === 0) return 30; // Default 30 minutes
    
    const times = historicalData.map(d => {
      const event = new Date(d.event_time);
      return event.getHours() * 60 + event.getMinutes();
    });
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  private static calculateTrafficFactor(trafficData: any[]): number {
    if (trafficData.length === 0) return 1.0;
    
    const avgCongestion = trafficData.reduce((sum, t) => sum + t.congestion_level, 0) / trafficData.length;
    return 1 + (avgCongestion / 10) * 0.5; // Max 50% increase
  }

  private static calculateWeatherFactor(): number {
    // In real implementation, integrate with weather API
    return Math.random() * 0.2 + 0.9; // 0.9 to 1.1 factor
  }

  private static calculateHistoricalFactor(historicalData: any[]): number {
    // More data = more accurate predictions
    const dataQuality = Math.min(historicalData.length / 50, 1);
    return 0.8 + (dataQuality * 0.4); // 0.8 to 1.2 factor
  }

  private static calculateConfidenceScore(dataPoints: number): number {
    return Math.min(dataPoints / 100, 0.95); // Max 95% confidence
  }

  private static simulateTrafficDensity(): 'low' | 'medium' | 'high' | 'severe' {
    const rand = Math.random();
    if (rand < 0.3) return 'low';
    if (rand < 0.6) return 'medium';
    if (rand < 0.9) return 'high';
    return 'severe';
  }

  private static calculateBehaviorTrends(analytics: any[]) {
    // Calculate weekly trends
    const weeks = this.groupByWeek(analytics);
    return weeks.map(week => ({
      week: week.week,
      attendanceRate: week.data.filter((d: any) => d.attendance_status === 'present').length / week.data.length * 100,
      avgBehaviorScore: week.data.reduce((sum: number, d: any) => sum + d.behavior_score, 0) / week.data.length
    }));
  }

  private static groupByWeek(analytics: any[]) {
    const weeks: { [key: string]: any[] } = {};
    
    analytics.forEach(a => {
      const date = new Date(a.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(a);
    });

    return Object.entries(weeks).map(([week, data]) => ({ week, data }));
  }

  private static generateOptimizationSuggestions(trafficData: any[]): string[] {
    const suggestions = [];
    
    const avgCongestion = trafficData.reduce((sum, t) => sum + t.congestion_level, 0) / trafficData.length;
    
    if (avgCongestion > 7) {
      suggestions.push('Consider alternative routes during peak hours');
      suggestions.push('Adjust departure time by 15-30 minutes');
    }
    
    if (trafficData.some(t => t.incident_reported)) {
      suggestions.push('Monitor real-time incident reports');
      suggestions.push('Have backup routes planned');
    }
    
    suggestions.push('Maintain steady speed for optimal fuel efficiency');
    suggestions.push('Regular vehicle maintenance for better fuel economy');
    
    return suggestions;
  }

  private static async calculateKPIs(category: string, period: { start: string; end: string }) {
    // Implementation would calculate various KPIs based on category
    const baseKPIs = [
      {
        metric_name: 'On-Time Performance',
        metric_category: 'efficiency',
        metric_value: Math.random() * 20 + 80, // 80-100%
        target_value: 95,
        unit: 'percentage',
        period_start: period.start,
        period_end: period.end,
        trend_direction: 'improving'
      },
      {
        metric_name: 'Fuel Efficiency',
        metric_category: 'cost',
        metric_value: Math.random() * 5 + 10, // 10-15 km/l
        target_value: 12,
        unit: 'km/liter',
        period_start: period.start,
        period_end: period.end,
        trend_direction: 'stable'
      },
      {
        metric_name: 'Student Satisfaction',
        metric_category: 'satisfaction',
        metric_value: Math.random() * 1 + 4, // 4-5 rating
        target_value: 4.5,
        unit: 'rating',
        period_start: period.start,
        period_end: period.end,
        trend_direction: 'improving'
      }
    ];

    return baseKPIs;
  }
}