"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ScheduleGrid from '@/components/ScheduleGrid';
import InitialSetupModal from '@/components/InitialSetupModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Home() {
  const [userProfile] = useLocalStorage('userProfile', { name: '', registeredClasses: [] });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 初回訪問時のチェック
    if (!userProfile.name) {
      setShowModal(true);
    }
  }, [userProfile.name]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header active="root"/>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 上半分：スケジュール */}
          <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded mb-4">
            <p className="text-sm sm:text-sm text-xs text-gray-800 font-semibold">
              このサイトは、<span className="underline">スケジュールがクラウドで管理されます</span>。皆がスケジュールを直接編集することで、初めて成り立ちます。<br />
              <span className="text-yellow-700 font-bold">気づいた人からスケジュール追加・編集を誠によろしくお願いします。</span><br />
              編集ボタンを押して、スケジュール一覧の、追加し時間帯のグリッドのセルをクリックすることで追加できます。
            </p>
          </div>
          <ScheduleGrid />
        </div>
      </main>

      <InitialSetupModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}