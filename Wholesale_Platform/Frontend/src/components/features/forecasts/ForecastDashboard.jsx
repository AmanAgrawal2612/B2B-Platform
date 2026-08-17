import React, { useState, useEffect } from 'react';
import apiClient from '../../../apiClient';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Lock, TrendingUp, AlertCircle, Loader } from 'lucide-react';

const ForecastDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await apiClient.get('/api/forecast');
        
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Forecast fetch error:", err);
        setError("Failed to load forecast data. Please try again later.");
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">AI is Analyzing Sales Data...</h2>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          Running inference on your historical sales to generate the next 6 months of predictions.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Oops!</h2>
        <p className="text-slate-600 mt-2">{error}</p>
      </div>
    );
  }

  // Handle Data Threshold Lock
  if (data?.locked) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-4">
        <div className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Forecasts Locked</h2>
          <p className="text-slate-600 mb-6 text-lg">
            Our AI needs a minimum of <strong>{data.requiredMonths} months</strong> of historical sales data to generate accurate trend predictions.
          </p>
          
          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6 relative overflow-hidden">
            <div className="flex justify-between items-end mb-2 relative z-10">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Your Progress</span>
              <span className="text-2xl font-bold text-blue-600">{data.currentMonths} / {data.requiredMonths}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2 relative z-10 overflow-hidden">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min((data.currentMonths / data.requiredMonths) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 text-right relative z-10">Months of Data</p>
          </div>
          
          <p className="text-sm text-slate-500">
            Keep recording your sales. We will automatically unlock your 6-month AI forecasts once the threshold is reached!
          </p>
        </div>
      </div>
    );
  }

  // Data Formatting for Recharts
  // Raw from Python: { "August 2026": { "Pencils": 450, "Notebooks": 200 }, ... }
  // Recharts needs: [ { name: "August 2026", "Pencils": 450, "Notebooks": 200 }, ... ]
  const rawPredictions = data?.predictions || {};
  const months = Object.keys(rawPredictions);
  
  if (months.length === 0) {
    return <div className="p-8 text-center text-slate-500">No predictions available.</div>;
  }

  // Extract all unique item names for line creation
  const allItems = new Set();
  months.forEach(m => {
    Object.keys(rawPredictions[m]).forEach(item => allItems.add(item));
  });
  const itemsList = Array.from(allItems);

  const chartData = months.map(month => {
    const dataPoint = { name: month };
    itemsList.forEach(item => {
      dataPoint[item] = rawPredictions[month][item] || 0;
    });
    return dataPoint;
  });

  // Generate some distinct colors for lines
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <TrendingUp className="text-blue-500" size={32} />
          AI Sales Forecast
        </h1>
        <p className="text-slate-500 mt-2">Projected unit sales for the next 6 months across your top items.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">6-Month Trend Prediction</h2>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {itemsList.map((item, idx) => (
                <Line 
                  key={item} 
                  type="monotone" 
                  dataKey={item} 
                  stroke={colors[idx % colors.length]} 
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Forecast Data Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 border-b border-slate-200">Item Name</th>
                {months.map(month => (
                  <th key={month} className="px-6 py-4 text-sm font-semibold text-slate-600 border-b border-slate-200">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsList.map(item => (
                <tr key={item} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{item}</td>
                  {months.map(month => (
                    <td key={`${item}-${month}`} className="px-6 py-4 text-slate-600">
                      {rawPredictions[month][item] || 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ForecastDashboard;
