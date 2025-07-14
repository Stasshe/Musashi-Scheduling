"use client";


// 教科ID→日本語名変換
const SUBJECT_ID_TO_NAME: Record<string, string> = {
  english: '英語',
  japanese: '国語',
  math: '数学',
  science: '理科',
  social: '社会',
  other: 'その他'
};

// 教科ID→略称変換
const SUBJECT_ID_TO_SHORT: Record<string, string> = {
  english: '英',
  japanese: '国',
  math: '数',
  science: '理',
  social: '社',
  other: '他'
};


import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ScheduleModal from './ScheduleModal';
import { database } from '@/lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { format, addDays, isToday, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SUBJECT_COLORS } from '@/config/constants';
import { TIME_SLOTS } from '@/config/timeslots';
import type { Schedule, EditScheduleData } from '@/types';
import { EditScheduleModal } from './EditNewSchedule';

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

export default function ScheduleGrid() {
  // スケジュール削除処理
  // 削除ダイアログ状態
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteSchedule = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!deleteTargetId) return;
    try {
      const scheduleRef = ref(database, `schedule/${deleteTargetId}`);
      await set(scheduleRef, null);
      setShowEditModal(false);
      setEditingSchedule(null);
      setShowDeleteDialog(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error('スケジュールの削除に失敗しました:', error);
    }
  };

  const cancelDeleteSchedule = () => {
    setShowDeleteDialog(false);
    setDeleteTargetId(null);
  };
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

  // 時刻文字列（例: "08:30"）を分単位でグリッド位置・高さ計算
  const GRID_START = 8 * 60; // 8:00（分）
  const GRID_END = 23 * 60; // 23:00（分）
  const GRID_HEIGHT_PER_MIN = 40 / 60; // 1時間=40px, 1分=0.666...px

  const parseTimeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const getTimeSlotPosition = (time: string) => {
    const min = parseTimeToMinutes(time);
    return (min - GRID_START) * GRID_HEIGHT_PER_MIN;
  };

  const getScheduleHeight = (startTime: string, endTime: string) => {
    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    return (endMin - startMin) * GRID_HEIGHT_PER_MIN;
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
        column: item.column,
        description: item.description ?? ''
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
    const endIndex = Math.min(startIndex + 2, TIME_SLOTS.length - 1); // 2スロット後（2時間後）
    const endTime = TIME_SLOTS[endIndex];

    setEditingSchedule({
      subject: '',
      className: '',
      date: format(date, 'yyyy-MM-dd'),
      startTime: timeSlot,
      endTime: endTime,
      column: column,
      description: ''
    });
    setShowEditModal(true);
  };

  const handleCreateNew = () => {
    setEditingSchedule({
      subject: '',
      className: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: TIME_SLOTS[0],
      endTime: TIME_SLOTS[2], // 2時間後
      column: 0,
      description: ''
    });
    setShowEditModal(true);
  };

  const handleSaveSchedule = async (scheduleData: EditScheduleData) => {
    // 必須項目バリデーション
    if (
      !scheduleData.subject ||
      !scheduleData.className ||
      !scheduleData.date ||
      !scheduleData.startTime ||
      !scheduleData.endTime ||
      scheduleData.column === undefined ||
      isNaN(Number(scheduleData.column))
    ) {
      alert('全ての項目を正しく入力してください。');
      return;
    }
    try {
      if (scheduleData.id) {
        // 編集の場合
        const scheduleRef = ref(database, `schedule/${scheduleData.id}`);
        await set(scheduleRef, {
          ...scheduleData,
          classId: `${scheduleData.subject}_${scheduleData.className}`,
          id: scheduleData.id
        });
      } else {
        // 新規作成の場合
        const { subject, className, date, startTime, endTime, column, description } = scheduleData;
        const classId = `${subject}_${className}`;
        const scheduleRef = ref(database, 'schedule');
        const newRef = await push(scheduleRef, { subject, className, date, startTime, endTime, column, classId, description });
        // idのみ追加
        await set(newRef, { subject, className, date, startTime, endTime, column, classId, description, id: newRef.key });
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
        <div className="p-2 sm:p-4 border-b border-gray-200 flex-shrink-0 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base sm:text-xl font-bold text-gray-900 whitespace-nowrap">授業スケジュール</h2>
          <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
            {/* 強調テキスト（編集モード時は非表示） */}
            {!isEditMode && (
              <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-yellow-200 text-red-900 font-bold text-xs sm:text-sm animate-pulse whitespace-nowrap">
                ここ！！→
              </span>
            )}
            {/* 編集モード切り替えボタン */}
            <button
              className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border text-xs sm:text-sm font-semibold ${
              isEditMode 
                ? 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? '編集をやめる' : '編集'}
            </button>
            <button
              className="p-1 sm:p-2 rounded-full bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 flex items-center justify-center"
              onClick={() => setDateOffset(dateOffset - 1)}
              aria-label="前の日付"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200 text-xs sm:text-sm font-semibold"
              onClick={() => setDateOffset(0)}
              aria-label="今日に戻る"
            >
              今日
            </button>
            <button
              className="p-1 sm:p-2 rounded-full bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 flex items-center justify-center"
              onClick={() => setDateOffset(dateOffset + 1)}
              aria-label="次の日付"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
                          // subjectはID（english等）か日本語名（英語等）どちらも来る可能性がある
                          const subjectId = SUBJECT_ID_TO_NAME[item.subject] ? item.subject : Object.keys(SUBJECT_ID_TO_NAME).find(key => SUBJECT_ID_TO_NAME[key] === item.subject) || 'other';
                          const subjectName = SUBJECT_ID_TO_NAME[subjectId] || 'その他';
                          const subjectShort = SUBJECT_ID_TO_SHORT[subjectId] || '他';
                          const students = Array.isArray(roster[item.subject]?.[item.className]) ? roster[item.subject][item.className] : [];
                          const isMyClass = selectedStudentName && students.includes(selectedStudentName);
                          const colorClass = SUBJECT_COLORS[subjectName as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS['その他'];
                          return (
                            <div
                              key={item.id}
                              className={`absolute left-0.5 right-0.5 rounded-sm border shadow-sm cursor-pointer hover:opacity-80${isMyClass ? ' ring-2 ring-blue-400' : ''}`}
                              style={{
                                top: `${getTimeSlotPosition(item.startTime)}px`,
                                height: `${getScheduleHeight(item.startTime, item.endTime)}px`,
                                backgroundColor: colorClass,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '4px'
                              }}
                              onClick={() => handleItemClick(item)}
                            >
                              <div className="font-bold text-xs mb-0.5">
                                {subjectShort}
                              </div>
                              <div className="font-medium text-xs leading-tight">
                                {truncateTitle(item.className ?? subjectName)}
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
          onDelete={handleDeleteSchedule}
        />
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={cancelDeleteSchedule}></div>
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm z-10">
            <div className="text-lg font-semibold mb-2">スケジュール削除</div>
            <div className="text-sm text-gray-700 mb-4">本当にこのスケジュールを削除しますか？</div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded border bg-gray-100 hover:bg-gray-200" onClick={cancelDeleteSchedule}>キャンセル</button>
              <button className="px-4 py-2 rounded border bg-red-500 text-white hover:bg-red-600" onClick={confirmDeleteSchedule}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
