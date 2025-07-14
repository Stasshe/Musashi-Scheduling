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
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

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
  const [editingClass, setEditingClass] = useState<{ subject: string; className: string; newClassName: string } | null>(null);
  const [editStudents, setEditStudents] = useState<string[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 編集対象クラスが切り替わったら生徒リストをセット
  useEffect(() => {
    if (editingClass) {
      const students = data[editingClass.subject]?.[editingClass.className] || [];
      setEditStudents(students);
    } else {
      setEditStudents([]);
    }
  }, [editingClass, data]);

  // Firebaseからデータ取得
  useEffect(() => {
    const rosterRef = ref(database, 'roster');
    try {
      const unsubscribe = onValue(rosterRef, (snapshot) => {
        const val = snapshot.val() || {};
        setData(val);
      }, (err) => {
        setError('データ取得エラー: ' + err.message);
        console.error('Firebase roster error:', err);
      });
      return () => unsubscribe();
    } catch (e: any) {
      setError('初期化エラー: ' + (e.message || '不明なエラー'));
      console.error('StudentRoster useEffect error:', e);
    }
  }, []);

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
  };

  // クラス名編集（名簿編集と一括保存）
  const saveClassEdit = async (subject: string, oldName: string, newName: string) => {
    if (!newName.trim()) return;
    setIsSaving(true);
    const subjectRef = ref(database, `roster/${subject}`);
    // クラス名が変更された場合
    if (newName !== oldName) {
      await update(subjectRef, {
        [newName.trim()]: editStudents
      });
      await remove(ref(database, `roster/${subject}/${oldName}`));
      toast({ title: '保存しました', description: `クラス名を ${newName} に変更しました。` });
    } else {
      await set(ref(database, `roster/${subject}/${oldName}`), editStudents);
      toast({ title: '保存しました', description: `名簿を更新しました。` });
    }
    setEditingClass(null);
    setEditStudents([]);
    setIsSaving(false);
  };

  // クラス削除
  const removeClass = async (subject: string, className: string) => {
    setIsSaving(true);
    await remove(ref(database, `roster/${subject}/${className}`));
    setIsSaving(false);
    toast({ title: '保存しました', description: `${className} クラスを削除しました。` });
  };

  // 削除対象クラス管理
  const [deleteTarget, setDeleteTarget] = useState<{ subject: string; className: string } | null>(null);

  if (error) {
    return <div className="text-red-500 p-4">エラー: {error}</div>;
  }

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">生徒名簿管理</h1>
        <Tabs defaultValue="english" className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-8 sm:h-10">
            {SUBJECTS.map(subject => (
              <TabsTrigger key={subject.id} value={subject.id} className="text-xs sm:text-sm px-1 sm:px-3">
                {subject.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {SUBJECTS.map(subject => (
            <TabsContent key={subject.id} value={subject.id} className="space-y-3 sm:space-y-4">
              {/* 新しいクラス追加 */}
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-row gap-2 w-full">
                      <Input
                        placeholder={`新しい${subject.name}クラス名 例: 二次対策Ⅱ`}
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addClass(subject.id);
                          }
                        }}
                        className="text-xs sm:text-sm h-8 sm:h-10 flex-1 min-w-0"
                      />
                      <Button onClick={() => addClass(subject.id)} size="sm" className="h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        追加
                      </Button>
                    </div>
                    <div className="flex flex-row flex-wrap gap-1 mt-1 justify-center">
                      {["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ"].map((roman, idx) => (
                        <Button
                          key={roman}
                          size="sm"
                          variant="outline"
                          className="h-7 sm:h-8 px-2 text-xs"
                          onClick={() => setNewClassName(newClassName + roman)}
                          type="button"
                        >
                          {roman}
                        </Button>
                      ))}
                    </div>
                  </div>
                    <p className="text-xs sm:text-sm font-semibold mt-2">
                    クラスを追加すると、初期生徒として「nobody」が登録されます。<br />
                    <span className="underline">クラスの名前に教科名をつける必要はありません。</span>
                    </p>
                </CardContent>
              </Card>
              {/* クラス一覧 */}
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {Object.entries(data[subject.id as keyof typeof data] || {}).map(([className, students]) => {
                  const safeStudents = Array.isArray(students) ? students : [];
                  // nobodyを除外したリスト
                  const displayStudents = safeStudents.filter(s => s !== 'nobody');
                  const isEditing = editingClass?.subject === subject.id && editingClass?.className === className;
                  const editClassNameValue = isEditing ? editingClass.newClassName : className;
                  // 編集時はeditStudentsからnobodyを除外
                  const editingDisplayStudents = editStudents.filter(s => s !== 'nobody');
                  return (
                    <Card key={className} className={isEditing ? 'border-2 border-blue-500 bg-blue-50' : ''}>
                      <CardHeader className="pb-2 p-2 sm:p-3">
                        <div className="flex items-center justify-between">
                          {isEditing ? (
                            <div className="flex items-center space-x-1 flex-1">
                              <Input
                                value={editClassNameValue}
                                onChange={(e) => setEditingClass(editingClass ? { ...editingClass, newClassName: e.target.value } : null)}
                                className="text-xs sm:text-sm h-6 sm:h-8 px-2"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    saveClassEdit(subject.id, className, editClassNameValue);
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingClass(null);
                                    setEditStudents([]);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => saveClassEdit(subject.id, className, editClassNameValue)}
                                className="h-6 sm:h-8 w-6 sm:w-8 p-0"
                                disabled={isSaving}
                              >
                                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setEditingClass(null); setEditStudents([]); }}
                                className="h-6 sm:h-8 w-6 sm:w-8 p-0"
                                disabled={isSaving}
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <CardTitle className="text-sm sm:text-base truncate pr-2">{className}</CardTitle>
                              <div className="flex space-x-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingClass({ subject: subject.id, className, newClassName: className })}
                                  className="h-6 sm:h-8 w-6 sm:w-8 p-0"
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteTarget({ subject: subject.id, className })}
                                      className="text-red-600 hover:text-red-700 h-6 sm:h-8 w-6 sm:w-8 p-0"
                                    >
                                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>クラスを削除しますか？</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        「{className}」クラスを本当に削除しますか？この操作は元に戻せません。
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setDeleteTarget(null)}>キャンセル</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={async () => {
                                          await removeClass(subject.id, className);
                                          setDeleteTarget(null);
                                        }}
                                        disabled={isSaving}
                                      >削除する</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs h-5 px-2">
                            {(isEditing ? editingDisplayStudents.length : displayStudents.length)}名
                          </Badge>
                          {isEditing && (
                            <Badge variant="outline" className="text-blue-600 border-blue-400 text-xs h-5 px-2">編集中</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 p-2 sm:p-3 pt-0">
                        {/* 生徒リスト */}
                        <div className="grid grid-cols-2 gap-1">
                          {(isEditing ? editingDisplayStudents : displayStudents).map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-1 sm:p-2 bg-gray-50 rounded text-xs sm:text-sm">
                              <span className="truncate pr-2">{student}</span>
                              {isEditing && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditStudents(editStudents.filter(s => s !== student))}
                                  className="text-red-600 hover:text-red-700 h-5 w-5 p-0 flex-shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* 生徒追加 */}
                        {isEditing && (
                          <div className="space-y-2">
                            <div className="flex space-x-1 items-center">
                              <Input
                                placeholder="生徒名"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                className="text-xs sm:text-sm h-7 sm:h-8"
                                disabled={isSaving}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && newStudentName.trim()) {
                                    setEditStudents([...editStudents, newStudentName.trim()]);
                                    setNewStudentName('');
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (newStudentName.trim()) {
                                    setEditStudents([...editStudents, newStudentName.trim()]);
                                    setNewStudentName('');
                                  }
                                }}
                                disabled={isSaving}
                                className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                            {isSaving && <span className="text-xs text-blue-600">保存中...</span>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}