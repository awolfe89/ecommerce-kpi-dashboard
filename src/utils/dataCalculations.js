// src/utils/dataCalculations.js
export const calculateSalesComparison = (data, prevYearData) => {
    return data.map(item => {
      const prevMonthData = prevYearData.find(prev => prev.month === item.month);
      const salesDiff = prevMonthData ? item.sales - prevMonthData.sales : item.sales;
      const salesPercent = prevMonthData && prevMonthData.sales > 0 
        ? ((item.sales - prevMonthData.sales) / prevMonthData.sales * 100).toFixed(2)
        : '100.00';
        
      return {
        ...item,
        prevSales: prevMonthData ? prevMonthData.sales : 0,
        salesDiff,
        salesPercent
      };
    });
  };
  
  export const calculateUserComparison = (data, prevYearData) => {
    return data.map(item => {
      const prevMonthData = prevYearData.find(prev => prev.month === item.month);
      const userDiff = prevMonthData ? item.users - prevMonthData.users : item.users;
      
      return {
        ...item,
        prevUsers: prevMonthData ? prevMonthData.users : 0,
        userDiff
      };
    });
  };
  
  export const calculateAverageMonthSales = (data) => {
    if (data.length === 0) return 0;
    const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
    return (totalSales / data.length).toFixed(2);
  };
  
  export const forecastYearlySales = (data) => {
    if (data.length === 0) return 0;
    const avgMonthlySales = calculateAverageMonthSales(data);
    const completedMonths = data.length;
    const remainingMonths = 12 - completedMonths;
    
    const actualSales = data.reduce((sum, item) => sum + item.sales, 0);
    const projectedSales = Number(avgMonthlySales) * remainingMonths;
    
    return (actualSales + projectedSales).toFixed(2);
  };
  
  export const prepareChartData = (data, prevYearData, monthNames) => {
    const salesComparisonData = calculateSalesComparison(data, prevYearData);
    const userComparisonData = calculateUserComparison(data, prevYearData);
    
    // Create chart data
    const chartData = salesComparisonData.map(item => ({
      month: monthNames[item.month - 1],
      currentSales: item.sales,
      previousSales: item.prevSales
    }));
    
    const userChartData = userComparisonData.map(item => ({
      month: monthNames[item.month - 1],
      currentUsers: item.users,
      previousUsers: item.prevUsers
    }));
    
    const sessionDurationData = data.map(item => ({
      month: monthNames[item.month - 1],
      sessionDuration: item.sessionDuration
    }));
    
    const bounceRateData = data.map(item => ({
      month: monthNames[item.month - 1],
      bounceRate: item.bounceRate
    }));
    
    // Combine the user comparison data with the sales comparison data
    const combinedData = salesComparisonData.map(salesItem => {
      const userItem = userComparisonData.find(item => item.month === salesItem.month);
      return {
        ...salesItem,
        prevUsers: userItem ? userItem.prevUsers : 0,
        userDiff: userItem ? userItem.userDiff : 0
      };
    });
    
    return {
      chartData,
      userChartData,
      sessionDurationData,
      bounceRateData,
      combinedData
    };
  };