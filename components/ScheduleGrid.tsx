"use client";

import { useState, useEffect } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';

const TIME_SLOTS = [];
for (let hour = 8; hour <= 22; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    if (hour === 22 && minute > 30) break;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    TIME_SLOTS.push(timeString);
  }
}

interface ScheduleItem {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  column: number;
}

// サンプルデータ
const SAMPLE_SCHEDULE: ScheduleItem[] = [
  {
    id: '1',
    title: '数学A',
    subject: '数学',
    teacher: '田中先生',
    startTime: '09:00',
    endTime: '10:30',
    column: 0
  },
  {
    id: '2',
    title: '英語B',
    subject: '英語',
    teacher: '佐藤先生',
    startTime: '10:00',
    endTime: '11:30',
    column: 1
  },
  {
    id: '3',
    title: '国語A',
    subject: '国語',
    teacher: '鈴木先生',
    startTime: '14:00',
    endTime: '15:30',
    column: 0
  }
];

const SUBJECT_COLORS = {
  '数学': 'bg-blue-100 text-blue-800 border-blue-200',
  '英語': 'bg-green-100 text-green-800 border-green-200',
  '国語': 'bg-red-100 text-red-800 border-red-200',
  '理科': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '社会': 'bg-purple-100 text-purple-800 border-purple-200',
  'その他': 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function ScheduleGrid() {
  const [currentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const daysToShow = isMobile ? 1 : 4;
  const dates = Array.from({ length: daysToShow }, (_, i) => addDays(currentDate, i));

  const getTimeSlotPosition = (time: string) => {
    const index = TIME_SLOTS.indexOf(time);
    return index * 60; // 各スロット60px高
  };

  const getScheduleHeight = (startTime: string, endTime: string) => {
    const startIndex = TIME_SLOTS.indexOf(startTime);
    const endIndex = TIME_SLOTS.indexOf(endTime);
    return (endIndex - startIndex) * 60;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">授業スケジュール</h2>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* ヘッダー */}
          <div className="flex sticky top-0 bg-white z-10 border-b border-gray-200">
            <div className="w-20 flex-shrink-0 p-3 font-medium text-gray-700 text-center border-r border-gray-200">
              時刻
            </div>
            {dates.map((date, dateIndex) => (
              <div key={dateIndex} className="flex-1 min-w-0">
                <div className={`p-3 text-center border-r border-gray-200 ${isToday(date) ? 'bg-blue-50' : ''}`}>
                  <div className="font-medium text-gray-900">
                    {format(date, 'M/d', { locale: ja })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(date, 'EEEE', { locale: ja })}
                  </div>
                </div>
                {/* 6列のサブヘッダー */}
                <div className="flex border-t border-gray-200">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex-1 p-2 text-xs text-center text-gray-500 border-r border-gray-200">
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* タイムグリッド */}
          <div className="flex">
            {/* 時間軸 */}
            <div className="w-20 flex-shrink-0 border-r border-gray-200">
              {TIME_SLOTS.map((time, index) => (
                <div
                  key={time}
                  className="h-15 p-2 text-sm text-gray-600 border-b border-gray-100 flex items-center justify-center"
                  style={{ height: '60px' }}
                >
                  {index % 2 === 0 ? time : ''}
                </div>
              ))}
            </div>

            {/* 各日のスケジュール */}
            {dates.map((date, dateIndex) => (
              <div key={dateIndex} className="flex-1 relative border-r border-gray-200">
                {/* 6列のグリッド */}
                <div className="flex h-full">
                  {Array.from({ length: 6 }, (_, columnIndex) => (
                    <div 
                      key={columnIndex} 
                      className="flex-1 relative border-r border-gray-100"
                      style={{ height: `${TIME_SLOTS.length * 60}px` }}
                    >
                      {/* 時間スロットの背景グリッド */}
                      {TIME_SLOTS.map((_, timeIndex) => (
                        <div
                          key={timeIndex}
                          className="absolute w-full border-b border-gray-50"
                          style={{
                            top: `${timeIndex * 60}px`,
                            height: '60px'
                          }}
                        />
                      ))}

                      {/* 授業アイテム（サンプル、今日のみ表示） */}
                      {dateIndex === 0 && SAMPLE_SCHEDULE
                        .filter(item => item.column === columnIndex)
                        .map(item => (
                          <div
                            key={item.id}
                            className={`absolute left-1 right-1 rounded-md border p-2 shadow-sm ${
                              SUBJECT_COLORS[item.subject as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS['その他']
                            }`}
                            style={{
                              top: `${getTimeSlotPosition(item.startTime)}px`,
                              height: `${getScheduleHeight(item.startTime, item.endTime)}px`
                            }}
                          >
                            <div className="font-medium text-sm">{item.title}</div>
                            <div className="text-xs opacity-75">{item.teacher}</div>
                            <div className="text-xs opacity-75">
                              {item.startTime}-{item.endTime}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}