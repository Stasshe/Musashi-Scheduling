import React, { useEffect, useState } from 'react';
import { SUBJECT_COLORS } from '@/config/constants';
import type { Schedule, Student } from '@/types';

type ScheduleModalProps = {
  selectedItem: Schedule | null;
  onClose: () => void;
  students?: Student[];
  studentConfigs?: { [name: string]: { isVisible?: boolean } };
  currentUserName?: string;
};


const ScheduleModal: React.FC<ScheduleModalProps> = ({ selectedItem, onClose, students = [], studentConfigs = {}, currentUserName = '' }) => {
  if (!selectedItem) return null;
  // モーダル外クリックで閉じる
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 参加生徒リストを抽出
  const participatingStudents = students.filter(student =>
    student.classes.includes(selectedItem.className)
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackgroundClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900">{selectedItem.className ?? selectedItem.subject}</h3>
          <button
            onClick={onClose}
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
            <span className="text-sm text-gray-900 flex-1 text-center">
              {selectedItem.column + 1}列目
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600 w-16">
              説明
            </span>
            <span className="text-sm text-gray-900">
              {selectedItem.description || 'なし'}
            </span>
          </div>
          {/* 参加生徒リスト表示 */}
          <div className="flex items-start">
            <span className="text-sm font-medium text-gray-600 w-16">参加者</span>
            <div className="flex-1 flex flex-wrap gap-1">
              {participatingStudents.length > 0 ? (
                participatingStudents.map(student => {
                  const config = studentConfigs[student.name];
                  const isVisible = config?.isVisible !== undefined ? config.isVisible : true;
                  const isSelf = currentUserName === student.name;
                  return (
                    <span key={student.id} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-800">
                      {isVisible || isSelf ? student.name : '*'}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-gray-400">該当なし</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
