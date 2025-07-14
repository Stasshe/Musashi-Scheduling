"use client";

import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, Save } from 'lucide-react';

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
  const [isSaving, setIsSaving] = useState(false);


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
      setIsSaving(true);
      let students = data[subject]?.[className] || [];
      students = students.filter(name => name !== 'nobody');
      const newList = [...students, newStudentName.trim()];
      await set(ref(database, `roster/${subject}/${className}`), newList);
      setNewStudentName('');
      setIsSaving(false);
      toast({ title: '保存しました', description: `${newStudentName} を追加しました。` });
    }
  };


  // 生徒削除
  const removeStudent = async (subject: string, className: string, studentName: string) => {
    setIsSaving(true);
    const students = data[subject]?.[className] || [];
    const newList = students.filter(name => name !== studentName);
    await set(ref(database, `roster/${subject}/${className}`), newList);
    setIsSaving(false);
    toast({ title: '保存しました', description: `${studentName} を削除しました。` });
  };


  // クラス追加
  const addClass = async (subject: string) => {
    if (newClassName.trim()) {
      setIsSaving(true);
      const subjectRef = ref(database, `roster/${subject}`);
      const snapshot = await import('firebase/database').then(({ get }) => get(subjectRef));
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
      setIsSaving(false);
      toast({ title: '保存しました', description: `${newClassName} クラスを追加しました。` });
    }
  }


  // クラス削除
  const removeClass = async (subject: string, className: string) => {
    setIsSaving(true);
    await remove(ref(database, `roster/${subject}/${className}`));
    setIsSaving(false);
    toast({ title: '保存しました', description: `${className} クラスを削除しました。` });
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
                  <Card key={className} className={editingClass?.subject === subject.id && editingClass?.className === className ? 'border-2 border-blue-500 bg-blue-50' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{className}</CardTitle>
                        <div className="flex space-x-1">
                          {editingClass?.subject === subject.id && editingClass?.className === className ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingClass(null)}
                              disabled={isSaving}
                            >
                              <Save className="w-4 h-4 text-blue-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingClass({ subject: subject.id, className })}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
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
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-fit">
                          {students.length}名
                        </Badge>
                        {editingClass?.subject === subject.id && editingClass?.className === className && (
                          <Badge variant="outline" className="text-blue-600 border-blue-400">編集中</Badge>
                        )}
                      </div>
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
                        <>
                          <div className="flex space-x-2 items-center">
                            <Input
                              placeholder="生徒名"
                              value={newStudentName}
                              onChange={(e) => setNewStudentName(e.target.value)}
                              className="text-sm"
                              disabled={isSaving}
                            />
                            <Button
                              size="sm"
                              onClick={() => addStudent(subject.id, className)}
                              disabled={isSaving}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            {isSaving && <span className="text-xs text-blue-600 ml-2">保存中...</span>}
                          </div>
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingClass(null)}
                              disabled={isSaving}
                            >キャンセル</Button>
                          </div>
                        </>
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