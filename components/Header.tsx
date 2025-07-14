"use client";

import Link from 'next/link';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useState } from 'react';

export default function Header() {
  const [userProfile, setUserProfile] = useLocalStorage('userProfile', { name: '', registeredClasses: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile.name || '');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>
                武蔵
              </h1>
            </Link>
            <nav className="flex space-x-6">
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
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium" suppressHydrationWarning>
              {userProfile.name || ''}
            </span>
            <button
              className="ml-2 px-2 py-1 text-sm border rounded text-gray-600 hover:bg-gray-100"
              onClick={() => {
                setEditName(userProfile.name || '');
                setIsModalOpen(true);
              }}
            >
              編集
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
                onClick={() => {
                  setUserProfile({ ...userProfile, name: editName });
                  setIsModalOpen(false);
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}