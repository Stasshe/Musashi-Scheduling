"use client";

import Link from 'next/link';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Header() {
  const [userProfile] = useLocalStorage('userProfile', { name: '', registeredClasses: [] });

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
          <div className="flex items-center">
            <span className="text-gray-700 font-medium">
              {userProfile.name || 'ゲスト'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}