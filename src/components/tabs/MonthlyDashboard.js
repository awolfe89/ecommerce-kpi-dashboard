// src/components/tabs/MonthlyDashboard.js
import React from 'react';
import SummaryCards from '../SummaryCards';
import MonthlyPerformanceHeatMap from '../visualizations/MonthlyPerformanceHeatMap';
import KPICalendarView from '../visualizations/KPICalendarView';
import KPIRadarChart from '../visualizations/KPIRadarChart';
import SalesComparisonChart from '../charts/SalesComparisonChart';
import UserComparisonChart from '../charts/UserComparisonChart';
import SessionDurationChart from '../charts/SessionDurationChart';
import BounceRateChart from '../charts/BounceRateChart';

const MonthlyDashboard = ({ 
  data, 
  chartData,
  userChartData,
  sessionDurationData,
  bounceRateData,
  calculateAverageMonthSales, 
  forecastYearlySales,
  selectedYear,
  colors
}) => {
  return (
    <>
      {/* Summary Cards */}
      <SummaryCards 
        data={data} 
        calculateAverageMonthSales={calculateAverageMonthSales} 
        forecastYearlySales={forecastYearlySales} 
      />
      
      {/* Heat Map */}
      <MonthlyPerformanceHeatMap 
        data={data} 
        selectedYear={selectedYear} 
      />
      
      {/* KPI Calendar View */}
      <KPICalendarView data={data} />
      
      {/* KPI Radar Chart */}
      <KPIRadarChart data={data} />
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SalesComparisonChart 
          chartData={chartData} 
          selectedYear={selectedYear} 
          colors={colors} 
        />
        
        <UserComparisonChart 
          userChartData={userChartData} 
          selectedYear={selectedYear} 
          colors={colors} 
        />
        
        <SessionDurationChart 
          sessionDurationData={sessionDurationData} 
          colors={colors} 
        />
        
        <BounceRateChart 
          bounceRateData={bounceRateData} 
          colors={colors} 
        />
      </div>
    </>
  );
};

export default MonthlyDashboard;