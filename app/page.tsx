"use client";

import { useState, useEffect } from 'react';
import { FiShare } from 'react-icons/fi';
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
            超複雑な宮塾夏期講習のスケジュールを、<span className="font-bold">みんなで編集</span>していくためのシステムです。
            <br />
            学校のiPadでも見られます。というかそっちの方が見やすいからiPad推奨。
            <p className="text-sm sm:text-sm text-xs text-gray-800 font-semibold">
              このサイトは、<span className="underline">スケジュールがクラウドで管理されます</span>。皆がスケジュールを直接編集することで、初めて成り立ちます。<br />
              <span className="text-yellow-700 font-bold">気づいた人からスケジュール追加・編集を誠によろしくお願いします。</span><br />
              編集ボタンを押して、スケジュール一覧の、追加し時間帯のグリッドのセルをクリックすることで追加できます。
            </p>
          </div>
          <ScheduleGrid />
            {/* iOSアプリ化の案内 */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <h2 className="font-bold text-blue-700 mb-2">iOSでアプリ化する方法</h2>
              <ol className="list-decimal pl-5 text-sm text-gray-700">
                <li>Safariでこのサイトを開きます。</li>
                <li>画面下部の「共有」ボタン <FiShare className="inline-block align-middle text-lg" /> をタップします。</li>
                <li>「ホーム画面に追加」を選択します。</li>
                <li>名前を入力して「追加」を押すと、ホーム画面にアイコンが表示され、アプリのように使えます。</li>
              </ol>
              <p className="mt-2 text-xs text-gray-500">※iPadやiPhoneで利用できます。ホーム画面から起動すると、より快適に使えます。</p>
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