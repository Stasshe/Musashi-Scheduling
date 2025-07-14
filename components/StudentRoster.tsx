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

  // 全教科の全クラス名リスト
  const allClassNames = Object.values(data).flatMap(subjectObj => Object.keys(subjectObj));

  // クラス追加
  const addClass = async (subject: string) => {
    const trimmedName = newClassName.trim();
    if (!trimmedName) return;
    if (allClassNames.includes(trimmedName)) {
      setError(`クラス名「${trimmedName}」は既に存在します。別の名前を入力してください。`);
      return;
    }
    setIsSaving(true);
    const subjectRef = ref(database, `roster/${subject}`);
    const snapshot = await import('firebase/database').then(({ get }) => get(subjectRef));
    const initialStudents = ['nobody'];
    if (snapshot.exists()) {
      await update(subjectRef, {
        [trimmedName]: initialStudents
      });
    } else {
      await set(subjectRef, {
        [trimmedName]: initialStudents
      });
    }
    setNewClassName('');
    setIsSaving(false);
    setError(null);
    toast({ title: '保存しました', description: `${trimmedName} クラスを追加しました。` });
  };

  // クラス名編集（名簿編集と一括保存）
  const saveClassEdit = async (subject: string, oldName: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    // クラス名が変更された場合、重複チェック
    if (trimmedName !== oldName && allClassNames.includes(trimmedName)) {
      setError(`クラス名「${trimmedName}」は既に存在します。別の名前を入力してください。`);
      return;
    }
    setIsSaving(true);
    const subjectRef = ref(database, `roster/${subject}`);
    if (trimmedName !== oldName) {
      await update(subjectRef, {
        [trimmedName]: editStudents
      });
      await remove(ref(database, `roster/${subject}/${oldName}`));
      toast({ title: '保存しました', description: `クラス名を ${trimmedName} に変更しました。` });
    } else {
      await set(ref(database, `roster/${subject}/${oldName}`), editStudents);
      toast({ title: '保存しました', description: `名簿を更新しました。` });
    }
    setEditingClass(null);
    setEditStudents([]);
    setIsSaving(false);
    setError(null);
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

  // エラー自動消去タイマー
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // エラー表示（画面上部に×ボタン付きで表示）
  return (
    <div className="space-y-2 p-1 sm:p-2">
      {error && (
        <div className="relative text-red-500 p-2 mb-1 border border-red-300 bg-red-50 rounded flex items-center">
          <span className="flex-1 text-xs sm:text-sm">エラー: {error}</span>
          <button
            className="ml-2 text-red-400 hover:text-red-600 font-bold text-sm px-1 py-0 rounded focus:outline-none"
            onClick={() => setError(null)}
            aria-label="エラーを閉じる"
            type="button"
          >×</button>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 sm:p-2">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">生徒名簿管理</h1>
        <Tabs defaultValue="english" className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-7 sm:h-8">
            {SUBJECTS.map(subject => (
              <TabsTrigger key={subject.id} value={subject.id} className="text-xs px-1">
                {subject.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {SUBJECTS.map(subject => (
            <TabsContent key={subject.id} value={subject.id} className="space-y-2 sm:space-y-3">
              {/* 新しいクラス追加 */}
              <Card>
                <CardContent className="p-2">
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex flex-row gap-1 w-full">
                      <Input
                        placeholder={`新しい${subject.name}クラス名 例: 二次対策Ⅱ`}
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addClass(subject.id);
                          }
                        }}
                        className="text-xs h-6 sm:h-7 flex-1 min-w-0"
                      />
                      <Button onClick={() => addClass(subject.id)} size="sm" className="h-6 sm:h-7 text-xs px-2 whitespace-nowrap">
                        <Plus className="w-3 h-3 mr-1" />
                        追加
                      </Button>
                    </div>
                    <div className="flex flex-row flex-wrap gap-1 justify-center">
                      {["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "二次"].map((roman, idx) => (
                        <Button
                          key={roman}
                          size="sm"
                          variant="outline"
                          className="h-5 sm:h-6 px-1 text-xs"
                          onClick={() => setNewClassName(newClassName + roman)}
                          type="button"
                        >
                          {roman}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs font-semibold mt-1">
                    クラスを追加すると、初期生徒として「nobody」が登録されます。<br />
                    <span className="underline">クラスの名前に教科名をつける必要はありません。</span>
                  </p>
                </CardContent>
              </Card>
              {/* クラス一覧 */}
              <div className="grid gap-1 sm:gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {Object.entries(data[subject.id as keyof typeof data] || {}).map(([className, students]) => {
                  const safeStudents = Array.isArray(students) ? students : [];
                  // nobodyを除外したリスト
                  const displayStudents = safeStudents.filter(s => s !== 'nobody');
                  const isEditing = editingClass?.subject === subject.id && editingClass?.className === className;
                  const editClassNameValue = isEditing ? editingClass.newClassName : className;
                  // 編集時はeditStudentsからnobodyを除外
                  const editingDisplayStudents = editStudents.filter(s => s !== 'nobody');
                  return (
                    <Card key={className} className={`${isEditing ? 'border-2 border-blue-500 bg-blue-50' : ''} min-h-0`}>
                      <CardHeader className="pb-1 p-1 sm:p-2">
                        <div className="flex items-center justify-between">
                          {isEditing ? (
                            <div className="flex items-center space-x-1 flex-1">
                              <Input
                                value={editClassNameValue}
                                onChange={(e) => setEditingClass(editingClass ? { ...editingClass, newClassName: e.target.value } : null)}
                                className="text-xs h-5 sm:h-6 px-1"
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
                                className="h-5 sm:h-6 w-5 sm:w-6 p-0"
                                disabled={isSaving}
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setEditingClass(null); setEditStudents([]); }}
                                className="h-5 sm:h-6 w-5 sm:w-6 p-0"
                                disabled={isSaving}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <CardTitle className="text-xs sm:text-sm truncate pr-1 leading-tight">{className}</CardTitle>
                              <div className="flex space-x-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingClass({ subject: subject.id, className, newClassName: className })}
                                  className="h-5 sm:h-6 w-5 sm:w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteTarget({ subject: subject.id, className })}
                                      className="text-red-600 hover:text-red-700 h-5 sm:h-6 w-5 sm:w-6 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
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
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs h-4 px-1">
                            {(isEditing ? editingDisplayStudents.length : displayStudents.length)}名
                          </Badge>
                          {isEditing && (
                            <Badge variant="outline" className="text-blue-600 border-blue-400 text-xs h-4 px-1">編集中</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1 p-1 sm:p-2 pt-0">
                        {/* 生徒リスト */}
                        <div className="grid grid-cols-2 gap-1">
                          {(isEditing ? editingDisplayStudents : displayStudents).map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                              <span className="truncate pr-1">{student}</span>
                              {isEditing && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditStudents(editStudents.filter(s => s !== student))}
                                  className="text-red-600 hover:text-red-700 h-4 w-4 p-0 flex-shrink-0"
                                >
                                  <Trash2 className="w-2 h-2" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* 生徒追加 */}
                        {isEditing && (
                          <div className="space-y-1">
                            <div className="flex space-x-1 items-center">
                              <Input
                                placeholder="生徒名"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                className="text-xs h-5 sm:h-6"
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
                                className="h-5 sm:h-6 w-5 sm:w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
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