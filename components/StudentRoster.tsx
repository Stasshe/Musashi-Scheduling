"use client";

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit } from 'lucide-react';

const SUBJECTS = [
  { id: 'english', name: '英語' },
  { id: 'japanese', name: '国語' },
  { id: 'math', name: '数学' },
  { id: 'science', name: '理科' },
  { id: 'social', name: '社会' },
  { id: 'other', name: 'その他' }
];


type RosterData = {
  [subjectId: string]: {
    [className: string]: string[];
  };
};

export default function StudentRoster() {
  const [data, setData] = useState<RosterData>({});
  const [editingClass, setEditingClass] = useState<{ subject: string; className: string } | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [newClassName, setNewClassName] = useState('');


  // Firebaseからデータ取得
  useEffect(() => {
    const rosterRef = ref(database, 'roster');
    const unsubscribe = onValue(rosterRef, (snapshot) => {
      const val = snapshot.val() || {};
      setData(val);
    });
    return () => unsubscribe();
  }, []);

  // 生徒追加
  const addStudent = async (subject: string, className: string) => {
    if (newStudentName.trim()) {
      const students = data[subject]?.[className] || [];
      const newList = [...students, newStudentName.trim()];
      await set(ref(database, `roster/${subject}/${className}`), newList);
      setNewStudentName('');
    }
  };


  // 生徒削除
  const removeStudent = async (subject: string, className: string, studentName: string) => {
    const students = data[subject]?.[className] || [];
    const newList = students.filter(name => name !== studentName);
    await set(ref(database, `roster/${subject}/${className}`), newList);
  };


  // クラス追加
  const addClass = async (subject: string) => {
    if (newClassName.trim()) {
      const subjectRef = ref(database, `roster/${subject}`);
      const snapshot = await import('firebase/database').then(({ get }) => get(subjectRef));
      // 生徒が最低1人必要な場合は'nobody'を追加
      const initialStudents = ['nobody'];
      if (snapshot.exists()) {
        await update(subjectRef, {
          [newClassName.trim()]: initialStudents
        });
      } else {
        await set(subjectRef, {
          [newClassName.trim()]: initialStudents
        });
      }
      setNewClassName('');
    }
  }


  // クラス削除
  const removeClass = async (subject: string, className: string) => {
    await remove(ref(database, `roster/${subject}/${className}`));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">生徒名簿管理</h1>
        
        <Tabs defaultValue="english" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {SUBJECTS.map(subject => (
              <TabsTrigger key={subject.id} value={subject.id} className="text-sm">
                {subject.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {SUBJECTS.map(subject => (
            <TabsContent key={subject.id} value={subject.id} className="space-y-4">
              {/* 新しいクラス追加 */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder={`新しい${subject.name}クラス名`}
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addClass(subject.id);
                        }
                      }}
                    />
                    <Button onClick={() => addClass(subject.id)} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      クラス追加
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* クラス一覧 */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(data[subject.id as keyof typeof data] || {}).map(([className, students]) => (
                  <Card key={className}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{className}</CardTitle>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingClass(
                              editingClass?.subject === subject.id && editingClass?.className === className
                                ? null
                                : { subject: subject.id, className }
                            )}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeClass(subject.id, className)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        {students.length}名
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* 生徒リスト */}
                      <div className="space-y-2">
                        {students.map((student, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{student}</span>
                            {editingClass?.subject === subject.id && editingClass?.className === className && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStudent(subject.id, className, student)}
                                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 生徒追加 */}
                      {editingClass?.subject === subject.id && editingClass?.className === className && (
                        <div className="flex space-x-2">
                          <Input
                            placeholder="生徒名"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addStudent(subject.id, className);
                              }
                            }}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => addStudent(subject.id, className)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}