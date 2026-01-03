'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

// ✅ Use the same API URL as your dashboard
const API_URL = "http://192.168.100.77:3001";

interface AnalyticsData {
  summary: {
    totalDetections: number;
    uniqueSpecies: number;
    detectionAccuracy: number;
    avgConfidence: number;
    endangeredDetections: number;
    aiVsManual: { ai: number; manual: number };
  };
  speciesStats: {
    species: string;
    count: number;
    avgConfidence: number;
    conservationStatus: string;
    trend: 'up' | 'down' | 'stable';
  }[];
  accuracyMetrics: {
    overallAccuracy: number;
    bySpecies: { species: string; accuracy: number; total: number }[];
    falsePositives: number;
    falseNegatives: number;
  };
  timeAnalysis: {
    peakHours: { hour: number; count: number }[];
    weeklyPattern: { day: string; count: number }[];
  };
  geographicData: {
    locations: { location: string; count: number; species: string[] }[];
  };
}

interface Report {
  id: number;
  species: string;
  confidence: number;
  condition_confidence: number;
  detection_type: string;
  created_at: string;
  location_name: string;
  status: string;
  urgency: string;
  user_name: string;
}

interface Sighting {
  id: number;
  species: string;
  confidence: number;
  created_at: string;
  location_name: string;
  conservation_status: string;
}

export default function DetectionAnalytics() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'today':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    return {
      start: startDate.toISOString(),
      end: now.toISOString()
    };
  };

  const filterDataByDateRange = (data: any[], dateField: string = 'created_at') => {
    const { start } = getDateRange();
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      const startDate = new Date(start);
      return itemDate >= startDate;
    });
  };

  const calculateAccuracyMetrics = (reports: Report[], sightings: Sighting[]) => {
    // Calculate accuracy based on verified reports and confidence scores
    const verifiedReports = reports.filter(report => 
      report.status === 'resolved' || report.status === 'under_review'
    );
    
    const totalVerified = verifiedReports.length;
    const highConfidenceVerified = verifiedReports.filter(report => 
      report.confidence >= 70
    ).length;

    const overallAccuracy = totalVerified > 0 ? (highConfidenceVerified / totalVerified) * 100 : 0;

    // Calculate accuracy by species
    const speciesAccuracy: Record<string, { total: number; highConfidence: number }> = {};
    
    verifiedReports.forEach(report => {
      if (!speciesAccuracy[report.species]) {
        speciesAccuracy[report.species] = { total: 0, highConfidence: 0 };
      }
      speciesAccuracy[report.species].total++;
      if (report.confidence >= 70) {
        speciesAccuracy[report.species].highConfidence++;
      }
    });

    const bySpecies = Object.entries(speciesAccuracy).map(([species, metrics]) => ({
      species,
      accuracy: metrics.total > 0 ? (metrics.highConfidence / metrics.total) * 100 : 0,
      total: metrics.total
    }));

    // Estimate false positives/negatives (simplified)
    const falsePositives = reports.filter(report => 
      report.status === 'dismissed' && report.confidence < 50
    ).length;

    const falseNegatives = reports.filter(report => 
      report.status === 'pending' && report.confidence > 80
    ).length;

    return {
      overallAccuracy,
      bySpecies,
      falsePositives,
      falseNegatives
    };
  };

  const calculateTimeAnalysis = (reports: Report[]) => {
    // Calculate peak hours
    const hourCounts: Record<number, number> = {};
    reports.forEach(report => {
      const hour = new Date(report.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Calculate weekly pattern
    const dayCounts: Record<string, number> = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    reports.forEach(report => {
      const day = dayNames[new Date(report.created_at).getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const weeklyPattern = dayNames.map(day => ({
      day,
      count: dayCounts[day] || 0
    }));

    return { peakHours, weeklyPattern };
  };

  const calculateGeographicData = (reports: Report[]) => {
    const locationCounts: Record<string, { count: number; species: Set<string> }> = {};
    
    reports.forEach(report => {
      const location = report.location_name || 'Unknown Location';
      if (!locationCounts[location]) {
        locationCounts[location] = { count: 0, species: new Set() };
      }
      locationCounts[location].count++;
      locationCounts[location].species.add(report.species);
    });

    return Object.entries(locationCounts)
      .map(([location, data]) => ({
        location,
        count: data.count,
        species: Array.from(data.species).slice(0, 5) // Limit to top 5 species per location
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };

  const calculateSpeciesTrends = (reports: Report[], sightings: Sighting[]) => {
    const allData = [...reports, ...sightings];
    const speciesData: Record<string, { count: number; totalConfidence: number; conservationStatus?: string }> = {};
    
    allData.forEach(item => {
      if (!speciesData[item.species]) {
        speciesData[item.species] = { 
          count: 0, 
          totalConfidence: 0,
          conservationStatus: (item as Sighting).conservation_status 
        };
      }
      speciesData[item.species].count++;
      speciesData[item.species].totalConfidence += item.confidence;
    });

    return Object.entries(speciesData)
      .map(([species, data]) => ({
        species,
        count: data.count,
        avgConfidence: data.count > 0 ? data.totalConfidence / data.count : 0,
        conservationStatus: data.conservationStatus || 'Unknown',
        trend: 'stable' as const // In a real implementation, you'd compare with previous period
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [reportsResponse, sightingsResponse] = await Promise.all([
        fetch(`${API_URL}/api/user-reports`),
        fetch(`${API_URL}/api/sightings`)
      ]);

      let allReports: Report[] = [];
      let allSightings: Sighting[] = [];

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        allReports = reportsData.reports || [];
      }

      if (sightingsResponse.ok) {
        const sightingsData = await sightingsResponse.json();
        allSightings = sightingsData.sightings || [];
      }

      const filteredReports = filterDataByDateRange(allReports);
      const filteredSightings = filterDataByDateRange(allSightings);

      // Calculate all analytics from real data
      const accuracyMetrics = calculateAccuracyMetrics(filteredReports, filteredSightings);
      const timeAnalysis = calculateTimeAnalysis(filteredReports);
      const geographicData = calculateGeographicData(filteredReports);
      const speciesStats = calculateSpeciesTrends(filteredReports, filteredSightings);

      const aiDetections = filteredReports.filter(report => 
        report.detection_type === 'ai_detection'
      ).length;
      
      const manualDetections = filteredReports.filter(report => 
        report.detection_type === 'manual_report'
      ).length;

      const endangeredDetections = filteredSightings.filter(sighting => 
        sighting.conservation_status && 
        ['Endangered', 'Critically Endangered', 'Vulnerable'].includes(sighting.conservation_status)
      ).length;

      const uniqueSpecies = new Set([
        ...filteredReports.map(r => r.species),
        ...filteredSightings.map(s => s.species)
      ]).size;

      const totalDetections = filteredReports.length + filteredSightings.length;
      const avgConfidence = totalDetections > 0 
        ? ([...filteredReports, ...filteredSightings].reduce((sum, item) => sum + item.confidence, 0) / totalDetections)
        : 0;

      const analyticsData: AnalyticsData = {
        summary: {
          totalDetections,
          uniqueSpecies,
          detectionAccuracy: accuracyMetrics.overallAccuracy,
          avgConfidence,
          endangeredDetections,
          aiVsManual: { ai: aiDetections, manual: manualDetections }
        },
        speciesStats,
        accuracyMetrics,
        timeAnalysis,
        geographicData: {
          locations: geographicData
        }
      };

      setData(analyticsData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    setExportLoading(true);
    try {
      // In a real implementation, you'd call an API endpoint to generate the report
      const reportData = {
        timeRange,
        generatedAt: new Date().toISOString(),
        data
      };
      
      // Create and download a JSON report
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
    }
  };

  const getConservationColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'critically endangered': return 'bg-red-100 text-red-800';
      case 'endangered': return 'bg-orange-100 text-orange-800';
      case 'vulnerable': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeRangeText = () => {
    switch (timeRange) {
      case 'today': return 'Last 24 Hours';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      default: return 'Last 7 Days';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detection Analytics</h1>
                <p className="text-gray-600 mt-1">Loading analytics data...</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading analytics data...</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-red-400 text-6xl mb-4">❌</div>
              <p className="text-gray-500 text-lg mb-2">Failed to load analytics data</p>
              <button 
                onClick={fetchAnalyticsData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detection Analytics</h1>
              <p className="text-gray-600 mt-1">
                Advanced insights and analytics from animal detection system • <span className="font-medium">{getTimeRangeText()}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <button 
                onClick={handleExportReport}
                disabled={exportLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {exportLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    📊 Export Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Total Detections</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalDetections}</p>
              <p className="text-xs text-gray-500">{getTimeRangeText()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Unique Species</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.uniqueSpecies}</p>
              <p className="text-xs text-gray-500">Identified</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Detection Accuracy</p>
              <p className="text-2xl font-bold text-green-600">{data.summary.detectionAccuracy.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Overall system</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-blue-600">{data.summary.avgConfidence.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Per detection</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Endangered Species</p>
              <p className="text-2xl font-bold text-orange-600">{data.summary.endangeredDetections}</p>
              <p className="text-xs text-gray-500">Protected detections</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-600">AI vs Manual</p>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-blue-600">AI: {data.summary.aiVsManual.ai}</span>
                <span className="text-gray-600">Manual: {data.summary.aiVsManual.manual}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: data.summary.totalDetections > 0 
                      ? `${(data.summary.aiVsManual.ai / data.summary.totalDetections) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Species Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Top Species Detections</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {data.speciesStats.map((species, index) => (
                    <div key={species.species} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-500 w-6">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">{species.species}</p>
                          <p className="text-sm text-gray-500">
                            {species.count} detections • {species.avgConfidence.toFixed(1)}% avg confidence
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {species.conservationStatus !== 'Unknown' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConservationColor(species.conservationStatus)}`}>
                            {species.conservationStatus}
                          </span>
                        )}
                        <span className="text-lg">{getTrendIcon(species.trend)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Accuracy Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Accuracy Metrics</h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall System Accuracy</span>
                      <span className="text-lg font-bold text-green-600">{data.accuracyMetrics.overallAccuracy.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full" 
                        style={{ width: `${data.accuracyMetrics.overallAccuracy}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-700">False Positives</p>
                      <p className="text-xl font-bold text-red-600">{data.accuracyMetrics.falsePositives}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-700">False Negatives</p>
                      <p className="text-xl font-bold text-orange-600">{data.accuracyMetrics.falseNegatives}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Accuracy by Species</h3>
                    <div className="space-y-2">
                      {data.accuracyMetrics.bySpecies.map((metric) => (
                        <div key={metric.species} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{metric.species}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{metric.accuracy.toFixed(1)}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${metric.accuracy}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Geographic Distribution</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.geographicData.locations.map((location, index) => (
                  <div key={location.location} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">{location.location}</h3>
                      <span className="text-2xl font-bold text-blue-600">{location.count}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Detected species:</p>
                    <div className="flex flex-wrap gap-1">
                      {location.species.map(species => (
                        <span key={species} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {species}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {data.geographicData.locations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No location data available for {getTimeRangeText().toLowerCase()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Time Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Peak Hours */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Peak Detection Hours</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {data.timeAnalysis.peakHours.map((hourData) => (
                    <div key={hourData.hour} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {hourData.hour === 0 ? '12 AM' : 
                         hourData.hour < 12 ? `${hourData.hour} AM` : 
                         hourData.hour === 12 ? '12 PM' : `${hourData.hour - 12} PM`}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ 
                              width: data.timeAnalysis.peakHours.length > 0 
                                ? `${(hourData.count / Math.max(...data.timeAnalysis.peakHours.map(h => h.count))) * 100}%` 
                                : '0%' 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{hourData.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {data.timeAnalysis.peakHours.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p>No time data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Pattern */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Weekly Pattern</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {data.timeAnalysis.weeklyPattern.map((dayData) => (
                    <div key={dayData.day} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{dayData.day}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ 
                              width: data.timeAnalysis.weeklyPattern.length > 0 
                                ? `${(dayData.count / Math.max(...data.timeAnalysis.weeklyPattern.map(d => d.count))) * 100}%` 
                                : '0%' 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{dayData.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}