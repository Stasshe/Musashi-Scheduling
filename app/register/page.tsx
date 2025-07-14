"use client";

import Header from '@/components/Header';
import StudentRoster from '@/components/StudentRoster';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header active="register"/>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentRoster />
      </main>
    </div>
  );
}