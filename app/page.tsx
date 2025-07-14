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
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 上半分：スケジュール */}
          <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded mb-4">
            <p className="text-sm text-gray-800 font-semibold">
              このサイトは、<span className="underline">スケジュールがクラウドで管理されます</span>。皆がスケジュールを直接編集することで、初めて成り立ちます。<br />
              <span className="text-yellow-700 font-bold">気づいた人からスケジュール追加・編集を誠によろしくお願いします。</span>
            </p>
          </div>
          <ScheduleGrid />
          
          {/* 下半分：今後の機能用スペース */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center text-gray-500">
              <h2 className="text-xl font-medium mb-2">今後の機能</h2>
              <p>こちらには今後、お知らせや個人向け情報などが表示される予定です。</p>
            </div>
          </div>
        </div>
      </main>

      <InitialSetupModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}