"use client";


import Header from '@/components/Header';
import InitialSetupModal from '@/components/InitialSetupModal';
import StudentRoster from '@/components/StudentRoster';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useState } from 'react';
import { UserProfile } from '@/types/';

export default function RegisterPage() {
  // localStorageからユーザー情報取得
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', { id: '', name: '', registeredClasses: [] });
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header active="register" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="text-lg text-gray-700">
            現在の所属クラス: <span className="font-bold">{userProfile.registeredClasses.length > 0 ? userProfile.registeredClasses.join(', ') : '未登録'}</span>
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
            onClick={() => setModalOpen(true)}
          >
            所属クラスを編集
          </button>
        </div>
        <InitialSetupModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          name={userProfile.name}
          setName={(newName: string) => setUserProfile({ ...userProfile, name: newName })}
          registeredClasses={userProfile.registeredClasses}
          setRegisteredClasses={(classes: string[]) => setUserProfile({ ...userProfile, registeredClasses: classes })}
          editMode={true}
        />
        {/* 編集後は何か案内を表示してもよい */}
        {/* {!modalOpen && (
          <div className="mt-8 text-center text-lg text-gray-700">
            所属クラスの編集が完了しました。
          </div>
        )} */}
      </main>
      <StudentRoster />
    </div>
  );
}