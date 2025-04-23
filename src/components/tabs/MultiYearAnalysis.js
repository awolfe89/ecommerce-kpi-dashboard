// src/components/tabs/MultiYearAnalysis.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ThemeContext } from '../../context/ThemeContext';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  ReferenceLine
} from 'recharts';

const MultiYearAnalysis = ({ selectedWebsite, websiteName }) => {
  const { darkMode } = useContext(ThemeContext);
  const [allYearsData, setAllYearsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearlyTotals, setYearlyTotals] = useState([]);
  const [yearlyAverages, setYearlyAverages] = useState([]);
  const [quarterlyData, setQuarterlyData] = useState([]);
  const [activeMetric, setActiveMetric] = useState('sales');
  const [comparisonMetric, setComparisonMetric] = useState('totalSales');
  const [includeCurrentYear, setIncludeCurrentYear] = useState(true);
  const [showProjections, setShowProjections] = useState(true);
  
  // Get current year for filtering out incomplete years
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // Color palette
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
  ];
  
  // Metric options
  const metricOptions = [
    { value: 'sales', label: 'Sales' },
    { value: 'users', label: 'Users' },
    { value: 'sessionDuration', label: 'Session Duration' },
    { value: 'bounceRate', label: 'Bounce Rate' }
  ];
  
  // Comparison metric options
  const comparisonOptions = [
    { value: 'totalSales', label: 'Total Sales' },
    { value: 'avgMonthlySales', label: 'Average Monthly Sales' },
    { value: 'totalUsers', label: 'Total Users' },
    { value: 'avgMonthlyUsers', label: 'Average Monthly Users' },
    { value: 'growth', label: 'Year-over-Year Growth (%)' }
  ];
  
  // Calculate yearly metrics from all data
  const calculateYearlyMetrics = useCallback((data) => {
    // Group data by year
    const yearlyData = data.reduce((acc, item) => {
      const year = item.year;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(item);
      return acc;
    }, {});
    
    // Calculate yearly totals
    const totals = Object.keys(yearlyData).map(year => {
      const yearData = yearlyData[year];
      const isCurrentYearData = Number(year) === currentYear;
      const monthsInYear = isCurrentYearData ? currentMonth : 12;
      
      const totalSales = yearData.reduce((sum, item) => sum + (item.sales || 0), 0);
      const totalUsers = yearData.reduce((sum, item) => sum + (item.users || 0), 0);
      const avgSessionDuration = yearData.reduce((sum, item) => sum + (item.sessionDuration || 0), 0) / yearData.length;
      const avgBounceRate = yearData.reduce((sum, item) => sum + (item.bounceRate || 0), 0) / yearData.length;
      
      // Count non-zero entries for accurate metrics
      const salesEntries = yearData.filter(item => item.sales > 0).length;
      const userEntries = yearData.filter(item => item.users > 0).length;
      
      // Calculate projected annual totals for current year
      let projectedAnnualSales = totalSales;
      let projectedAnnualUsers = totalUsers;
      
      if (isCurrentYearData && monthsInYear < 12 && salesEntries > 0) {
        const monthlyAvgSales = totalSales / salesEntries;
        const monthlyAvgUsers = userEntries > 0 ? totalUsers / userEntries : 0;
        
        projectedAnnualSales = monthlyAvgSales * 12;
        projectedAnnualUsers = monthlyAvgUsers * 12;
      }
      
      return {
        year: Number(year),
        totalSales,
        totalUsers,
        avgSessionDuration,
        avgBounceRate,
        monthsReported: yearData.length,
        salesEntries,
        userEntries,
        projectedAnnualSales,
        projectedAnnualUsers,
        avgMonthlySales: salesEntries > 0 ? totalSales / salesEntries : 0,
        avgMonthlyUsers: userEntries > 0 ? totalUsers / userEntries : 0,
        // Annualized values for partial years
        annualizedSales: isCurrentYearData && salesEntries > 0 ? (totalSales / salesEntries) * 12 : totalSales,
        annualizedUsers: isCurrentYearData && userEntries > 0 ? (totalUsers / userEntries) * 12 : totalUsers,
        dataPoints: yearData.length,
        // Flag for incomplete current year
        isCurrentYear: isCurrentYearData,
        completionPercentage: isCurrentYearData ? (monthsInYear / 12) * 100 : 100
      };
    }).sort((a, b) => a.year - b.year);
    
    // Calculate year-over-year growth
    totals.forEach((yearData, index) => {
      if (index > 0) {
        const prevYear = totals[index - 1];
        
        // Sales growth
        const salesGrowth = prevYear.totalSales > 0 
          ? ((yearData.totalSales - prevYear.totalSales) / prevYear.totalSales) * 100 
          : 0;
          
        // Projected sales growth
        const projectedSalesGrowth = prevYear.totalSales > 0 
          ? ((yearData.projectedAnnualSales - prevYear.totalSales) / prevYear.totalSales) * 100 
          : 0;
        
        // User growth
        const userGrowth = prevYear.totalUsers > 0 
          ? ((yearData.totalUsers - prevYear.totalUsers) / prevYear.totalUsers) * 100 
          : 0;
          
        // Projected user growth
        const projectedUserGrowth = prevYear.totalUsers > 0 
          ? ((yearData.projectedAnnualUsers - prevYear.totalUsers) / prevYear.totalUsers) * 100 
          : 0;
        
        yearData.salesGrowth = salesGrowth;
        yearData.projectedSalesGrowth = projectedSalesGrowth;
        yearData.userGrowth = userGrowth;
        yearData.projectedUserGrowth = projectedUserGrowth;
      } else {
        yearData.salesGrowth = 0;
        yearData.projectedSalesGrowth = 0;
        yearData.userGrowth = 0;
        yearData.projectedUserGrowth = 0;
      }
    });
    
    // Calculate yearly averages
    const averages = Object.keys(yearlyData).map(year => {
      const yearData = yearlyData[year];
      const isCurrentYearData = Number(year) === currentYear;
      
      // Only count non-zero entries for accurate averages
      const salesItems = yearData.filter(item => item.sales > 0);
      const userItems = yearData.filter(item => item.users > 0);
      const sessionItems = yearData.filter(item => item.sessionDuration > 0);
      const bounceItems = yearData.filter(item => item.bounceRate > 0);
      
      const avgMonthlySales = salesItems.length > 0 
        ? salesItems.reduce((sum, item) => sum + (item.sales || 0), 0) / salesItems.length 
        : 0;
      const avgMonthlyUsers = userItems.length > 0 
        ? userItems.reduce((sum, item) => sum + (item.users || 0), 0) / userItems.length 
        : 0;
      const avgSessionDuration = sessionItems.length > 0 
        ? sessionItems.reduce((sum, item) => sum + (item.sessionDuration || 0), 0) / sessionItems.length 
        : 0;
      const avgBounceRate = bounceItems.length > 0 
        ? bounceItems.reduce((sum, item) => sum + (item.bounceRate || 0), 0) / bounceItems.length 
        : 0;
      
      return {
        year: Number(year),
        avgMonthlySales,
        avgMonthlyUsers,
        avgSessionDuration,
        avgBounceRate,
        salesCount: salesItems.length,
        userCount: userItems.length,
        sessionCount: sessionItems.length,
        bounceCount: bounceItems.length,
        // Flag for incomplete current year
        isCurrentYear: isCurrentYearData
      };
    }).sort((a, b) => a.year - b.year);
    
    // Calculate quarterly data
    const quarters = {};
    
    data.forEach(item => {
      const year = item.year;
      const month = item.month;
      let quarter;
      
      if (month <= 3) quarter = 1;
      else if (month <= 6) quarter = 2;
      else if (month <= 9) quarter = 3;
      else quarter = 4;
      
      const key = `${year}-Q${quarter}`;
      
      if (!quarters[key]) {
        quarters[key] = {
          year,
          quarter,
          label: `Q${quarter} ${year}`,
          sales: 0,
          users: 0,
          sessionDuration: 0,
          bounceRate: 0,
          count: 0,
          isCurrentQuarter: year === currentYear && (
            (quarter === 1 && currentMonth <= 3) ||
            (quarter === 2 && currentMonth > 3 && currentMonth <= 6) ||
            (quarter === 3 && currentMonth > 6 && currentMonth <= 9) ||
            (quarter === 4 && currentMonth > 9)
          ),
          isPartial: year === currentYear && (
            (quarter === 1 && currentMonth < 3) ||
            (quarter === 2 && currentMonth < 6) ||
            (quarter === 3 && currentMonth < 9) ||
            (quarter === 4 && currentMonth < 12)
          )
        };
      }
      
      quarters[key].sales += item.sales || 0;
      quarters[key].users += item.users || 0;
      quarters[key].sessionDuration += item.sessionDuration || 0;
      quarters[key].bounceRate += item.bounceRate || 0;
      quarters[key].count++;
    });
    
    // Calculate averages for quarterly data
    const quarterlyDataArray = Object.values(quarters).map(q => ({
      ...q,
      sessionDuration: q.count > 0 ? q.sessionDuration / q.count : 0,
      bounceRate: q.count > 0 ? q.bounceRate / q.count : 0
    })).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.quarter - b.quarter;
    });
    
    setYearlyTotals(totals);
    setYearlyAverages(averages);
    setQuarterlyData(quarterlyDataArray);
  }, [currentYear, currentMonth]);
  
  // Fetch all data across all years
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Filter by website
        const websiteQuery = query(
          collection(db, 'kpiData'),
          where('website', '==', selectedWebsite)
        );
        
        const querySnapshot = await getDocs(websiteQuery);
        const fetchedData = [];
        
        querySnapshot.forEach((doc) => {
          fetchedData.push({ id: doc.id, ...doc.data() });
        });
        
        setAllYearsData(fetchedData);
        calculateYearlyMetrics(fetchedData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [selectedWebsite, calculateYearlyMetrics]);

  // Format currency values
  const formatCurrency = (value) => {
    return `$${value.toLocaleString()}`;
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-md shadow ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry, index) => {
            // Check if this is a projected value
            const isProjected = entry.dataKey.includes('projected') || entry.dataKey.includes('annualized');
            
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {entry.value.toLocaleString(undefined, {
                  minimumFractionDigits: entry.name.includes('Growth') ? 2 : 0,
                  maximumFractionDigits: entry.name.includes('Growth') ? 2 : 0
                })}
                {entry.name.includes('Sales') ? ' $' : entry.name.includes('Growth') ? '%' : ''}
                {isProjected ? ' (Projected)' : ''}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };
  
  // Get filtered data based on includeCurrentYear preference
  const getFilteredData = (data) => {
    if (includeCurrentYear) {
      return data;
    }
    return data.filter(item => !item.isCurrentYear);
  };
  
  // Get data for yearly comparison chart
  const getYearlyComparisonData = () => {
    const filteredData = getFilteredData(yearlyTotals);
    
    // If showing projections and we have current year data, add projected values
    if (showProjections && includeCurrentYear) {
      return filteredData.map(item => {
        if (item.isCurrentYear) {
          return {
            ...item,
            // Add projected values for the charts
            projectedTotalSales: item.projectedAnnualSales,
            projectedAvgMonthlySales: item.avgMonthlySales,
            projectedTotalUsers: item.projectedAnnualUsers,
            projectedAvgMonthlyUsers: item.avgMonthlyUsers,
            // Use the projected growth values
            projectedGrowth: item.projectedSalesGrowth
          };
        }
        return item;
      });
    }
    
    return filteredData;
  };
  
  // Calculate growth percentages for the selected metric
  const calculateGrowthData = () => {
    const filteredData = getFilteredData(yearlyTotals);
    
    if (filteredData.length < 2) return [];
    
    return filteredData.map((yearData, index) => {
      if (index === 0) {
        return {
          year: yearData.year,
          growth: 0,
          projectedGrowth: 0,
          isCurrentYear: yearData.isCurrentYear
        };
      }
      
      const prevYear = filteredData[index - 1];
      let metricName, projectedMetricName;
      
      // Determine which metric to use based on activeMetric
      switch (activeMetric) {
        case 'sales':
          metricName = 'totalSales';
          projectedMetricName = 'projectedAnnualSales';
          break;
        case 'users':
          metricName = 'totalUsers';
          projectedMetricName = 'projectedAnnualUsers';
          break;
        case 'sessionDuration':
          metricName = 'avgSessionDuration';
          projectedMetricName = 'avgSessionDuration';
          break;
        case 'bounceRate':
          metricName = 'avgBounceRate';
          projectedMetricName = 'avgBounceRate';
          break;
        default:
          metricName = 'totalSales';
          projectedMetricName = 'projectedAnnualSales';
      }
      
      const currentValue = yearData[metricName];
      const prevValue = prevYear[metricName];
      
      // Calculate actual growth
      const growth = prevValue !== 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;
      
      // Calculate projected growth for the current year
      let projectedGrowth = growth;
      if (yearData.isCurrentYear && showProjections) {
        const projectedValue = yearData[projectedMetricName];
        projectedGrowth = prevValue !== 0 ? ((projectedValue - prevValue) / prevValue) * 100 : 0;
      }
      
      return {
        year: yearData.year,
        growth: growth,
        projectedGrowth: projectedGrowth,
        isCurrentYear: yearData.isCurrentYear
      };
    });
  };
  
  // Calculate overall growth (excluding current year if needed)
  const calculateOverallGrowth = () => {
    const filteredData = getFilteredData(yearlyTotals);
    
    if (filteredData.length < 2) return 'N/A';
    
    const firstYear = filteredData[0];
    let lastYear = filteredData[filteredData.length - 1];
    
    // If the last year is the current year and we're showing projections, use projected values
    if (lastYear.isCurrentYear && showProjections) {
      return ((lastYear.projectedAnnualSales - firstYear.totalSales) / firstYear.totalSales * 100).toFixed(1) + '%';
    }
    
    // Otherwise use actual values
    return ((lastYear.totalSales - firstYear.totalSales) / firstYear.totalSales * 100).toFixed(1) + '%';
  };
  
  // Track user's selection
  const handleMetricChange = (e) => {
    setActiveMetric(e.target.value);
  };
  
  const handleComparisonChange = (e) => {
    setComparisonMetric(e.target.value);
  };
  
  const toggleIncludeCurrentYear = () => {
    setIncludeCurrentYear(!includeCurrentYear);
  };
  
  const toggleShowProjections = () => {
    setShowProjections(!showProjections);
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Multi-Year Analysis - {websiteName}
      </h2>
      
      {loading ? (
        <div className={`text-center py-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Loading multi-year data...
        </div>
      ) : yearlyTotals.length === 0 ? (
        <div className={`text-center py-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          No data available for multiple years
        </div>
      ) : (
        <div className="space-y-8">
          {/* Options/Filters */}
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
            <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Analysis Options
            </h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeCurrentYear}
                  onChange={toggleIncludeCurrentYear}
                  className="mr-2 rounded"
                />
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Include {currentYear} (Current Year)
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showProjections}
                  onChange={toggleShowProjections}
                  className="mr-2 rounded"
                />
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Show Projections for {currentYear}
                </span>
              </label>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Years with Data
              </h3>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {yearlyTotals.length}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {yearlyTotals.map(y => y.year).join(', ')}
              </p>
            </div>
            
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Total Sales (All Years)
              </h3>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ${getFilteredData(yearlyTotals).reduce((sum, item) => {
                  // If it's the current year and we're showing projections, use projected values
                  if (item.isCurrentYear && showProjections) {
                    return sum + item.projectedAnnualSales;
                  }
                  return sum + item.totalSales;
                }, 0).toLocaleString()}
              </p>
              {showProjections && includeCurrentYear && (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Includes projections for {currentYear}
                </p>
              )}
            </div>
            
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Avg. Monthly Sales
              </h3>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ${Math.round(getFilteredData(yearlyAverages).reduce((sum, item) => sum + item.avgMonthlySales, 0) / (getFilteredData(yearlyAverages).length || 1)).toLocaleString()}
              </p>
            </div>
            
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Overall Growth
              </h3>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {getFilteredData(yearlyTotals).length > 1 && getFilteredData(yearlyTotals)[0].totalSales > 0
                  ? calculateOverallGrowth()
                  : 'N/A'}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                From {getFilteredData(yearlyTotals)[0]?.year} to {getFilteredData(yearlyTotals)[getFilteredData(yearlyTotals).length - 1]?.year}
              </p>
            </div>
          </div>
          
          {/* Yearly Comparison Chart */}
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
            <div className="flex flex-wrap items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Yearly Metrics Comparison
              </h3>
              
              <div className="flex flex-wrap gap-4 mt-2 sm:mt-0">
                <select
                  value={comparisonMetric}
                  onChange={handleComparisonChange}
                  className={`rounded-md px-3 py-1 text-sm ${
                    darkMode 
                      ? 'bg-gray-800 text-gray-200 border-gray-600' 
                      : 'bg-white text-gray-700 border-gray-300'
                  } border`}
                >
                  {comparisonOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getYearlyComparisonData()}
                  margin={{ top: 20, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#ccc'} />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fill: darkMode ? '#aaa' : '#666' }} 
                  />
                  <YAxis 
                    tick={{ fill: darkMode ? '#aaa' : '#666' }} 
                    tickFormatter={value => comparisonMetric.includes('Sales') 
                      ? `$${value/1000}k` 
                      : comparisonMetric === 'growth' 
                        ? `${value}%` 
                        : value.toLocaleString()
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey={comparisonMetric} 
                    name={comparisonOptions.find(opt => opt.value === comparisonMetric)?.label} 
                    fill={colors[0]} 
                    radius={[4, 4, 0, 0]}
                  />
                  {showProjections && includeCurrentYear && (
                    <Bar 
                      dataKey={`projected${comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1)}`} 
                      name={`Projected ${comparisonOptions.find(opt => opt.value === comparisonMetric)?.label}`} 
                      fill={colors[1]} 
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.6}
                    />
                  )}
                  {/* Add a reference line for current month if showing current year */}
                  {includeCurrentYear && yearlyTotals.some(item => item.isCurrentYear) && (
                    <ReferenceLine
                      x={currentYear}
                      stroke="#ff8800"
                      strokeDasharray="3 3"
                      label={{
                        value: `Current Year (${currentMonth}/12 months)`,
                        position: 'insideTopRight',
                        fill: darkMode ? '#fff' : '#333',
                      }}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {showProjections && includeCurrentYear && (
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                * Projected values for {currentYear} are based on data from completed months ({currentMonth}/12 months)
              </p>
            )}
          </div>
          
          // Replace the Quarterly Trends Chart section with this fixed code:

{/* Quarterly Trends Chart */}
<div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
  <div className="flex flex-wrap items-center justify-between mb-4">
    <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
      Quarterly {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Trends
    </h3>
    
    <div className="flex flex-wrap gap-4 mt-2 sm:mt-0">
      <select
        value={activeMetric}
        onChange={handleMetricChange}
        className={`rounded-md px-3 py-1 text-sm ${
          darkMode 
            ? 'bg-gray-800 text-gray-200 border-gray-600' 
            : 'bg-white text-gray-700 border-gray-300'
        } border`}
      >
        {metricOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </div>
  
  <div className="h-80">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={includeCurrentYear ? quarterlyData : quarterlyData.filter(q => q.year !== currentYear)}
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#ccc'} />
        <XAxis 
          dataKey="label" 
          tick={{ fill: darkMode ? '#aaa' : '#666' }} 
        />
        <YAxis 
          tick={{ fill: darkMode ? '#aaa' : '#666' }} 
          tickFormatter={value => activeMetric === 'sales' 
            ? `$${value/1000}k` 
            : value.toLocaleString()
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={activeMetric} 
          name={activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} 
          stroke={colors[1]}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        {/* Add a separate line for current year data if showing projections */}
        {showProjections && includeCurrentYear && (
          <Line 
            type="monotone" 
            dataKey={activeMetric} 
            name={`${currentYear} Data (Current Year)`}
            stroke={colors[3]}
            strokeWidth={2}
            strokeDasharray="5 5"
            // Only include this line for current year data
            data={quarterlyData.filter(q => q.year === currentYear)}
            dot={{ r: 5, fill: colors[3] }}
            activeDot={{ r: 7 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  </div>
  {includeCurrentYear && quarterlyData.some(q => q.year === currentYear && q.isPartial) && (
    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      * Current quarter ({quarterlyData.find(q => q.year === currentYear && q.isPartial)?.label}) is incomplete
    </p>
  )}
</div>
          
          {/* Year-over-Year Growth Chart */}
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
            <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Year-over-Year Growth
            </h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={calculateGrowthData()}
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#ccc'} />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fill: darkMode ? '#aaa' : '#666' }} 
                  />
                  <YAxis 
                    tick={{ fill: darkMode ? '#aaa' : '#666' }} 
                    tickFormatter={value => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="growth" 
                    name={`${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Growth %`} 
                    fill={colors[2]}
                    radius={[4, 4, 0, 0]}
                  />
                  {showProjections && includeCurrentYear && (
                    <Bar 
                      dataKey="projectedGrowth" 
                      name={`Projected ${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Growth %`} 
                      fill={colors[3]}
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.6}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Growth calculated based on selected metric: {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}
              {showProjections && includeCurrentYear && ' (includes projections for current year)'}
            </p>
          </div>
          
          {/* Data Table */}
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg overflow-x-auto`}>
            <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Yearly Summary
            </h3>
            
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Year</th>
                  <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Total Sales</th>
                  {showProjections && (
                    <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Projected Annual</th>
                  )}
                  <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Growth</th>
                  {showProjections && (
                    <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Proj. Growth</th>
                  )}
                  <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Avg. Monthly</th>
                  <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Total Users</th>
                  <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Months Data</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
                {getFilteredData(yearlyTotals).map((year, index) => (
                  <tr key={year.year} className={`
                    ${index % 2 === 0 ? (darkMode ? 'bg-gray-600' : 'bg-gray-50') : ''}
                    ${year.isCurrentYear ? (darkMode ? 'bg-gray-500' : 'bg-blue-50') : ''}
                  `}>
                    <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {year.year} {year.isCurrentYear ? '(Current)' : ''}
                    </td>
                    <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      ${year.totalSales.toLocaleString()}
                    </td>
                    {showProjections && (
                      <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {year.isCurrentYear ? (
                          `$${year.projectedAnnualSales.toLocaleString()}`
                        ) : (
                          `$${year.totalSales.toLocaleString()}`
                        )}
                      </td>
                    )}
                    <td className={`px-4 py-2 ${year.salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {year.salesGrowth ? `${year.salesGrowth.toFixed(1)}%` : 'N/A'}
                    </td>
                    {showProjections && (
                      <td className={`px-4 py-2 ${year.projectedSalesGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {year.isCurrentYear ? (
                          `${year.projectedSalesGrowth.toFixed(1)}%`
                        ) : (
                          `${year.salesGrowth ? year.salesGrowth.toFixed(1) : 0}%`
                        )}
                      </td>
                    )}
                    <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      ${year.salesEntries > 0 
                        ? Math.round(year.totalSales / year.salesEntries).toLocaleString() 
                        : 0}
                    </td>
                    <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {year.totalUsers.toLocaleString()}
                    </td>
                    <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {year.monthsReported} / 12 
                      {year.isCurrentYear ? ` (${Math.round(year.completionPercentage)}% of year)` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {showProjections && (
              <p className={`text-sm mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                * Projections for {currentYear} are based on average monthly performance for the first {currentMonth} months.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiYearAnalysis;