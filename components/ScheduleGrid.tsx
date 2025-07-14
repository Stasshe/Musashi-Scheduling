"use client";

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ScheduleModal from './ScheduleModal';
import { database } from '@/lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { format, addDays, isToday, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SUBJECT_COLORS } from '@/config/constants';
import { TIME_SLOTS } from '@/config/timeslots';
import type { Schedule } from '@/types';

/**
 * スケジュールグリッドコンポーネント
 * 日付ごとに授業スケジュールを表示するグリッド
 * 
 * interface Schedule {
 *  id: string;
 *  classId: string;
 *  className: string;
 *  subject: string;
 *  date: string;
 *  startTime: string;
 *  endTime: string;
 *  column: number; // 0-5の列番号
 * }
 */

interface EditScheduleData {
  id?: string;
  subject: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  column: number;
}

export default function ScheduleGrid() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [selectedItem, setSelectedItem] = useState<Schedule | null>(null);
  const [dateOffset, setDateOffset] = useState(0); // 横スクロール用
  const [roster, setRoster] = useState<any>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EditScheduleData | null>(null);

  // useLocalStorageでuserProfile取得
  const [userProfile] = useLocalStorage<any>('userProfile', { name: '' });
  const selectedStudentName = userProfile?.name || '';

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

  // Firebaseから名簿(roster)取得
  useEffect(() => {
    const rosterRef = ref(database, 'roster');
    const unsubscribe = onValue(rosterRef, (snapshot) => {
      const val = snapshot.val() || {};
      setRoster(val);
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

  const handleItemClick = (item: Schedule) => {
    if (isEditMode) {
      // 編集モードの場合は編集モーダルを開く
      setEditingSchedule({
        id: item.id,
        subject: item.subject,
        className: item.className,
        date: item.date || format(new Date(), 'yyyy-MM-dd'),
        startTime: item.startTime,
        endTime: item.endTime,
        column: item.column
      });
      setShowEditModal(true);
    } else {
      // 閲覧モードの場合は詳細モーダルを開く
      setSelectedItem(item);
    }
  };

  const handleGridClick = (date: Date, column: number, timeSlot: string) => {
    if (!isEditMode) return;
    
    // 2時間後の時刻を計算
    const startIndex = TIME_SLOTS.indexOf(timeSlot);
    const endIndex = Math.min(startIndex + 5, TIME_SLOTS.length - 1); // 5スロット後（2時間後）
    const endTime = TIME_SLOTS[endIndex];

    setEditingSchedule({
      subject: '',
      className: '',
      date: format(date, 'yyyy-MM-dd'),
      startTime: timeSlot,
      endTime: endTime,
      column: column
    });
    setShowEditModal(true);
  };

  const handleCreateNew = () => {
    setEditingSchedule({
      subject: '',
      className: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: TIME_SLOTS[0],
      endTime: TIME_SLOTS[5], // 2時間後
      column: 0
    });
    setShowEditModal(true);
  };

  const handleSaveSchedule = async (scheduleData: EditScheduleData) => {
    try {
      if (scheduleData.id) {
        // 編集の場合
        const scheduleRef = ref(database, `schedule/${scheduleData.id}`);
        await set(scheduleRef, {
          ...scheduleData,
          classId: `${scheduleData.subject}_${scheduleData.className}`,
        });
      } else {
        // 新規作成の場合
        const scheduleRef = ref(database, 'schedule');
        await push(scheduleRef, {
          ...scheduleData,
          classId: `${scheduleData.subject}_${scheduleData.className}`,
        });
      }
      setShowEditModal(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('スケジュールの保存に失敗しました:', error);
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSchedule(null);
  };

  // 教科一覧を取得
  const getSubjects = () => {
    return Object.keys(roster);
  };

  // 選択された教科のクラス一覧を取得
  const getClassesForSubject = (subject: string) => {
    if (!subject || !roster[subject]) return [];
    return Object.keys(roster[subject]);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-screen flex flex-col">
        <div className="p-4 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">授業スケジュール</h2>
          <div className="flex gap-2 items-center">
            {/* 編集モード切り替えボタン */}
            <button
              className={`px-3 py-1 rounded-full border text-sm font-semibold ${
                isEditMode 
                  ? 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200' 
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? '編集中' : '編集'}
            </button>
            
            {/* 新規作成ボタン（編集モード時のみ表示） */}
            {isEditMode && (
              <button
                className="px-3 py-1 rounded-full bg-green-100 border border-green-300 text-green-700 hover:bg-green-200 text-sm font-semibold"
                onClick={handleCreateNew}
              >
                新規作成
              </button>
            )}
            
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
                        {TIME_SLOTS.map((timeSlot, timeIndex) => (
                          <div
                            key={timeIndex}
                            className={`absolute w-full border-b border-gray-50 ${
                              isEditMode ? 'hover:bg-gray-50 cursor-pointer' : ''
                            }`}
                            style={{
                              top: `${timeIndex * 40}px`,
                              height: '40px'
                            }}
                            onClick={() => handleGridClick(date, columnIndex, timeSlot)}
                          />
                        ))}
                        {/* 授業アイテム */}
                        {(getScheduleForDate(date, columnIndex) ?? []).map(item => {
                          const students = Array.isArray(roster[item.subject]?.[item.className]) ? roster[item.subject][item.className] : [];
                          const isMyClass = selectedStudentName && students.includes(selectedStudentName);
                          return (
                            <div
                              key={item.id}
                              className={`absolute left-0.5 right-0.5 rounded-sm border p-1 shadow-sm cursor-pointer hover:opacity-80 ${
                                SUBJECT_COLORS[item.subject as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS['その他']
                              }${isMyClass ? ' ring-2 ring-blue-400' : ''}`}
                              style={{
                                top: `${getTimeSlotPosition(item.startTime)}px`,
                                height: `${getScheduleHeight(item.startTime, item.endTime)}px`
                              }}
                              onClick={() => handleItemClick(item)}
                            >
                              <div className="font-medium text-xs leading-tight">
                                {truncateTitle(item.className ?? item.subject)}
                              </div>
                              {isEditMode && (
                                <div className="absolute top-0 right-0 w-2 h-2 bg-orange-400 rounded-full"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 詳細モーダルウィンドウ */}
      <ScheduleModal selectedItem={selectedItem} onClose={closeModal} />

      {/* 編集モーダルウィンドウ */}
      {showEditModal && editingSchedule && (
        <EditScheduleModal 
          schedule={editingSchedule}
          subjects={getSubjects()}
          getClassesForSubject={getClassesForSubject}
          onSave={handleSaveSchedule}
          onClose={closeEditModal}
        />
      )}
    </>
  );
}

// 編集モーダルコンポーネント
function EditScheduleModal({ 
  schedule, 
  subjects, 
  getClassesForSubject, 
  onSave, 
  onClose 
}: {
  schedule: EditScheduleData;
  subjects: string[];
  getClassesForSubject: (subject: string) => string[];
  onSave: (schedule: EditScheduleData) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<EditScheduleData>(schedule);

  const handleSubjectChange = (subject: string) => {
    const classes = getClassesForSubject(subject);
    const firstClass = classes[0] || '';
    
    setFormData(prev => ({
      ...prev,
      subject,
      className: firstClass,
    }));
  };

  const handleClassChange = (className: string) => {
    setFormData(prev => ({
      ...prev,
      className,
    }));
  };

  const handleStartTimeChange = (startTime: string) => {
    // startTimeが変更された場合、endTimeを2時間後に設定
    const startIndex = TIME_SLOTS.indexOf(startTime);
    const endIndex = Math.min(startIndex + 5, TIME_SLOTS.length - 1); // 5スロット後（2時間後）
    const endTime = TIME_SLOTS[endIndex];
    
    setFormData(prev => ({
      ...prev,
      startTime,
      endTime
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {schedule.id ? 'スケジュール編集' : 'スケジュール作成'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              教科
            </label>
            <select
              value={formData.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">選択してください</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              クラス
            </label>
            <select
              value={formData.className}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!formData.subject}
            >
              <option value="">選択してください</option>
              {getClassesForSubject(formData.subject).map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日付
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始時刻
              </label>
              <select
                value={formData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {TIME_SLOTS.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了時刻
              </label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {TIME_SLOTS.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              列
            </label>
            <select
              value={formData.column}
              onChange={(e) => setFormData(prev => ({ ...prev, column: parseInt(e.target.value) }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {Array.from({ length: 6 }, (_, i) => (
                <option key={i} value={i}>{i + 1}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}