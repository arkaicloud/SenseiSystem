import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { Button } from '@/components/ui/button';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

interface AttendanceData {
  day: string;
  value: number;
}

interface AttendanceChartProps {
  data: AttendanceData[];
  period: 'week' | 'month' | 'year';
  onPeriodChange: (period: 'week' | 'month' | 'year') => void;
}

export const AttendanceChart = ({ 
  data, 
  period, 
  onPeriodChange 
}: AttendanceChartProps) => {
  const { t } = useTranslations();

  return (
    <div className="bg-gray-800 rounded-xl shadow-md p-6 xl:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-white">{t('dashboard.attendanceTrends')}</h2>
        <div className="flex space-x-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange('week')}
            className="px-3 py-1 text-xs font-medium"
          >
            {t('dashboard.week')}
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange('month')}
            className="px-3 py-1 text-xs font-medium"
          >
            {t('dashboard.month')}
          </Button>
          <Button
            variant={period === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange('year')}
            className="px-3 py-1 text-xs font-medium"
          >
            {t('dashboard.year')}
          </Button>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="day" 
              tick={{ fill: '#9CA3AF' }} 
              axisLine={{ stroke: '#4B5563' }}
            />
            <YAxis 
              tick={{ fill: '#9CA3AF' }} 
              axisLine={{ stroke: '#4B5563' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                borderColor: '#374151', 
                color: '#F3F4F6' 
              }}
              itemStyle={{ color: '#F3F4F6' }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceChart;
