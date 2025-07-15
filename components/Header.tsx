"use client";

import Link from 'next/link';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useState, useEffect, useRef } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import ScheduleIcon from './ui/schedule';
import RosterIcon from './ui/roster';
import { UserProfile } from '@/types/';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './ui/alert-dialog';

export default function Header({ active }: { active: string }) {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', { id: '', name: '', registeredClasses: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile && userProfile.name ? userProfile.name : '');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  // モーダルが閉じたタイミングでuserProfileを再取得
  // モーダルやアラートが閉じた瞬間だけuserProfileを再取得
  const prevModalOpen = useRef(isModalOpen);
  const prevAlertOpen = useRef(isAlertOpen);
  useEffect(() => {
    if ((prevModalOpen.current === true && isModalOpen === false) || (prevAlertOpen.current === true && isAlertOpen === false)) {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem('userProfile');
        if (item) {
          try {
            setUserProfile(JSON.parse(item));
          } catch {}
        }
      }
    }
    prevModalOpen.current = isModalOpen;
    prevAlertOpen.current = isAlertOpen;
  }, [isModalOpen, isAlertOpen]);
  
  // userProfile.nameが変化したらeditNameも同期
  useEffect(() => {
    setEditName(userProfile && userProfile.name ? userProfile.name : '');
  }, [userProfile]);

  // ローカルストレージ変更時に userProfile を更新
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'userProfile') {
        try {
          const newProfile = event.newValue ? JSON.parse(event.newValue) : undefined;
          setUserProfile(newProfile);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [setUserProfile]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左側: ロゴとナビゲーション */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>
                武蔵
              </h1>
            </Link>
            {/* PC: ナビゲーション */}
            <nav className="hidden sm:flex space-x-6 ml-8">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                スケジュール
              </Link>
              <Link 
                href="/register" 
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                名簿管理
              </Link>
            </nav>
            
            {/* activeに応じてアイコンボタン表示: スマホ（sm未満） */}
            <div className="sm:hidden">
              {active === 'root' ? (
                <Link href="/register" className="flex flex-col items-center ml-2 p-2 text-blue-600 hover:bg-blue-100 rounded" aria-label="名簿管理">
                  <RosterIcon size={28} />
                  <span className="text-xs mt-1 text-gray-700">名簿</span>
                </Link>
              ) : active === 'register' ? (
                <Link href="/" className="flex flex-col items-center ml-2 p-2 text-blue-600 hover:bg-blue-100 rounded" aria-label="スケジュール">
                  <ScheduleIcon size={28} />
                  <span className="text-xs mt-1 text-gray-700">ホーム</span>
                </Link>
              ) : null}
            </div>
          </div>
          {/* 右側: ユーザー情報とアクション */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium max-w-[100px] truncate" suppressHydrationWarning>
              {userProfile.name ? userProfile.name : '...'}
            </span>
            <button
              className="ml-1 p-2 text-gray-600 hover:bg-gray-100 rounded"
              onClick={() => {
                setEditName(userProfile && userProfile.name ? userProfile.name : '');
                setIsModalOpen(true);
              }}
              aria-label="名前編集"
            >
              <FiEdit2 size={18} />
            </button>
          </div>
        </div>
      </div>
      {/* 名前編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px]">
            <h2 className="text-lg font-bold mb-4">名前を編集</h2>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full mb-4"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setIsModalOpen(false)}
              >
                キャンセル
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setIsAlertOpen(true)}
              >
                保存
              </button>
      {/* 名前変更警告ダイアログ */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>安易に変えないでください</AlertDialogTitle>
            <AlertDialogDescription>
              問題が起きる可能性があります。それでも変えますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>いいえ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.clear();
                  setUserProfile({id: '', name: editName, registeredClasses: [] });
                  setIsModalOpen(false);
                  setIsAlertOpen(false);
                  // 保存後にリロード
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }
              }}
            >はい</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}