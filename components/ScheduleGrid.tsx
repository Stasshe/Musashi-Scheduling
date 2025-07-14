"use client";

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { format, addDays, isToday, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SUBJECT_COLORS } from '@/config/constants';

const TIME_SLOTS: string[] = [];
for (let hour = 8; hour <= 22; hour++) {
  const timeString = `${hour.toString().padStart(2, '0')}:00`;
  TIME_SLOTS.push(timeString);
}

interface ScheduleItem {
  id: string;
  title: string;
  subject: string;
  startTime: string;
  endTime: string;
  column: number;
  date: string; // 日付フィールドを追加
}

export default function ScheduleGrid() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [dateOffset, setDateOffset] = useState(0); // 横スクロール用

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Firebaseからスケジュール取得
  useEffect(() => {
    const scheduleRef = ref(database, 'schedule');
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      const val = snapshot.val() || [];
      const arr = Array.isArray(val)
        ? val
        : Object.values(val);
      setSchedule(arr);
    });
    return () => unsubscribe();
  }, []);


  const daysToShow = isMobile ? 1 : 4;
  const dates = Array.from({ length: daysToShow }, (_, i) => addDays(currentDate, dateOffset + i));

  const getTimeSlotPosition = (time: string) => {
    const index = TIME_SLOTS.indexOf(time);
    return index * 40; // 各スロット40px
  };

  const getScheduleHeight = (startTime: string, endTime: string) => {
    const startIndex = TIME_SLOTS.indexOf(startTime);
    const endIndex = TIME_SLOTS.indexOf(endTime);
    return (endIndex - startIndex) * 40;
  };

  const getScheduleForDate = (date: Date, column: number) => {
    return schedule.filter(item => {
      // 日付フィールドがある場合はそれを使用、なければ今日として扱う
      if (item.date) {
        return new Date(item.date).toDateString() === date.toDateString() && item.column === column;
      }
      return isToday(date) && item.column === column;
    });
  };

  const truncateTitle = (title: string, maxLength: number = 8) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const handleItemClick = (item: ScheduleItem) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-screen flex flex-col">
        <div className="p-4 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">授業スケジュール</h2>
          <div className="flex gap-2 items-center">
            <button
              className="p-2 rounded-full bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 flex items-center justify-center"
              onClick={() => setDateOffset(dateOffset - 1)}
              aria-label="前の日付"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              className="px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200 text-sm font-semibold"
              onClick={() => setDateOffset(0)}
              aria-label="今日に戻る"
            >
              今日
            </button>
            <button
              className="p-2 rounded-full bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 flex items-center justify-center"
              onClick={() => setDateOffset(dateOffset + 1)}
              aria-label="次の日付"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* ヘッダー */}
            <div className="flex bg-white border-b border-gray-200 flex-shrink-0">
              <div className="w-16 flex-shrink-0 p-2 font-medium text-gray-700 text-center border-r border-gray-200 text-sm">
                時刻
              </div>
              {dates.map((date, dateIndex) => (
                <div key={dateIndex} className="flex-1 min-w-0">
                  <div className={`p-2 text-center border-r border-gray-200 ${isToday(date) ? 'bg-blue-50' : ''}`}> 
                    <div className="font-medium text-gray-900 text-sm">
                      {format(date, 'M/d', { locale: ja })}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(date, 'EEEE', { locale: ja })}
                    </div>
                  </div>
                  {/* 6列のサブヘッダー */}
                  <div className="flex border-t border-gray-200">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="flex-1 p-1 text-xs text-center text-gray-500 border-r border-gray-200">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* タイムグリッド */}
            <div className="flex flex-1 overflow-y-auto">
              {/* 時間軸 */}
              <div className="w-16 flex-shrink-0 border-r border-gray-200">
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    className="p-1 text-xs text-gray-600 border-b border-gray-100 flex items-center justify-center"
                    style={{ height: '40px' }}
                  >
                    {time}
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
                        style={{ height: `${TIME_SLOTS.length * 40}px` }}
                      >
                        {/* 時間スロットの背景グリッド */}
                        {TIME_SLOTS.map((_, timeIndex) => (
                          <div
                            key={timeIndex}
                            className="absolute w-full border-b border-gray-50"
                            style={{
                              top: `${timeIndex * 40}px`,
                              height: '40px'
                            }}
                          />
                        ))}
                        {/* 授業アイテム */}
                        {getScheduleForDate(date, columnIndex).map(item => (
                          <div
                            key={item.id}
                            className={`absolute left-0.5 right-0.5 rounded-sm border p-1 shadow-sm cursor-pointer hover:opacity-80 ${
                              SUBJECT_COLORS[item.subject as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS['その他']
                            }`}
                            style={{
                              top: `${getTimeSlotPosition(item.startTime)}px`,
                              height: `${getScheduleHeight(item.startTime, item.endTime)}px`
                            }}
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="font-medium text-xs leading-tight">
                              {truncateTitle(item.title)}
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

      {/* モーダルウィンドウ */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedItem.title}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 w-16">科目:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  SUBJECT_COLORS[selectedItem.subject as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS['その他']
                }`}>
                  {selectedItem.subject}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 w-16">時間:</span>
                <span className="text-sm text-gray-900">
                  {selectedItem.startTime} - {selectedItem.endTime}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 w-16">教室:</span>
                <span className="text-sm text-gray-900">
                  {selectedItem.column + 1}限目
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}