import type { EditScheduleData } from '@/types';
import { useState, useEffect } from 'react';
import { TIME_SLOTS } from '@/config/timeslots';



// 編集モーダルコンポーネント
export function EditScheduleModal({ 
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
    const endIndex = Math.min(startIndex + 2, TIME_SLOTS.length - 1); // 2スロット後（2時間後）
    const endTime = TIME_SLOTS[endIndex];
    setFormData(prev => ({
      ...prev,
      startTime,
      endTime
    }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      description: e.target.value
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
              <input
                type="time"
                value={formData.startTime}
                onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                step={300} // 5分刻み
                min="08:00"
                max="23:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了時刻
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                step={300} // 5分刻み
                list="data-list"
                min="08:00"
                max="23:00"
              />
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明（任意）
            </label>
            <textarea
              value={formData.description ?? ''}
              onChange={handleDescriptionChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="授業回数（①）などを入力してください"
            />
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