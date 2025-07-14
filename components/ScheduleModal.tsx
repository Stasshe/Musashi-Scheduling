import React from 'react';
import { SUBJECT_COLORS } from '@/config/constants';
import type { Schedule } from '@/types';

interface ScheduleModalProps {
  selectedItem: Schedule | null;
  onClose: () => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ selectedItem, onClose }) => {
  if (!selectedItem) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
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
            <span className="text-sm text-gray-900">
              {selectedItem.column + 1}列目
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
