"use client";

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { UserProfile } from '@/types/';
import { SUBJECTS } from '@/config/constants'; // SUBJECTSを定義したファイルをインポート

// SAMPLE_CLASSESは削除。Firebaseから取得する。

interface InitialSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  name?: string;
  setName?: (name: string) => void;
  registeredClasses?: string[];
  setRegisteredClasses?: (classes: string[]) => void;
  editMode?: boolean; // registerページ用
}

export default function InitialSetupModal({ isOpen, onClose, name: propName, setName: propSetName, registeredClasses, setRegisteredClasses, editMode }: InitialSetupModalProps) {
  // editMode=trueならpropsからname/registeredClassesを使う
  const [name, setName] = editMode ? [propName ?? '', propSetName ?? (() => {})] : useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(registeredClasses ?? []);
  const [roster, setRoster] = useState<{ [subjectId: string]: { [className: string]: string[] } }>({});
  // 新規登録時用のローカルストレージsetter
  const [localName, setLocalName] = useLocalStorage<string>('name', '');
  const [localClasses, setLocalClasses] = useLocalStorage<string[]>('registeredClasses', []);

  // Firebaseからrosterデータ取得
  useEffect(() => {
    const rosterRef = ref(database, 'roster');
    const unsubscribe = onValue(rosterRef, (snapshot) => {
      const val = snapshot.val() || {};
      setRoster(val);
    });
    return () => unsubscribe();
  }, []);

  // rosterデータとnameが変化したら、selectedClassesを更新
  useEffect(() => {
    if (!name.trim() || !roster) return;
    const selected: string[] = [];
    Object.entries(roster).forEach(([subjectId, classes]) => {
      Object.entries(classes).forEach(([className, students]) => {
        if (Array.isArray(students) && students.includes(name.trim())) {
          selected.push(className);
        }
      });
    });
    setSelectedClasses(selected);
  }, [roster, name]);

  // userProfile.registeredClassesが変化したらselectedClassesも更新
  useEffect(() => {
    if (editMode && registeredClasses) {
      setSelectedClasses(registeredClasses);
    }
  }, [registeredClasses, editMode]);

  const handleClassToggle = (className: string) => {
    setSelectedClasses(prev => {
      let updated;
      if (prev.includes(className)) {
        updated = prev.filter(c => c !== className);
      } else {
        updated = [...prev, className];
      }

      // rosterデータとnameが揃っている場合のみfirebaseへ反映
      if (name && name.trim()) {
        // どのsubjectか特定
        let subjectId: string | null = null;
        Object.entries(roster).forEach(([subId, classes]) => {
          if (classes[className]) subjectId = subId;
        });
        if (subjectId !== null) {
          const students = roster[subjectId][className] || [];
          let newStudents;
          if (updated.includes(className)) {
            // 追加
            if (!students.includes(name.trim())) {
              newStudents = [...students, name.trim()];
            } else {
              newStudents = students;
            }
          } else {
            // 削除
            newStudents = students.filter(s => s !== name.trim());
          }
          // Firebaseへ反映
          import('firebase/database').then(({ set, ref }) => {
            set(ref(database, `roster/${subjectId}/${className}`), newStudents);
          });
        }
      }
      // editMode時はlocalStorageも更新
      if (editMode && setRegisteredClasses) {
        setRegisteredClasses(updated);
      }
      return updated;
    });
  };

  const handleSave = () => {
    if (name && name.trim()) {
      if (editMode && propSetName) {
        propSetName(name.trim());
      }
      if (editMode && setRegisteredClasses) {
        setRegisteredClasses(selectedClasses);
      }
      // ローカルストレージに保存
      setLocalName(name.trim());
      setLocalClasses(selectedClasses);
      onClose();
    }
  };

  // バツボタンで閉じようとした時の警告表示用
  const [showAlert, setShowAlert] = useState(false);

  // DialogのonOpenChangeで閉じようとした時の挙動
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // 初回セットアップかつ名前未入力なら警告
      if (!editMode && (!name || !name.trim())) {
        setShowAlert(true);
        return;
      }
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {editMode ? '所属クラスの編集' : '「武蔵」スケジューリングシステムへようこそ'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 名前入力欄は初期セットアップ時のみ表示 */}
            {!editMode && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-lg font-medium">
                  先に、苗字を入力してください
                </Label>
                <p className="text-sm text-gray-600">
                  すでに名簿に登録されている場合はチェックボックスに自動でチェックが入ります。
                  <br />
                  例: 苗字が同じ人がいる場合は名前を1文字追加してください。
                  <br />
                  例: 松下 → 松下彰
                </p>
                <Input
                  id="name"
                  type="text"
                  placeholder="苗字を入力"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg"
                />
              </div>
            )}
            <div className="space-y-4">
              <Label className="text-lg font-medium">
                所属クラスを選択してください（複数選択可）
              </Label>
              {SUBJECTS.map(subject => (
                <div key={subject.id} className="space-y-2">
                  <h3 className="font-medium text-gray-700">{subject.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(roster[subject.id] ? Object.keys(roster[subject.id]) : []).map(className => (
                      <div key={className} className="flex items-center space-x-2">
                        <Checkbox
                          id={className}
                          checked={selectedClasses.includes(className)}
                          onCheckedChange={() => handleClassToggle(className)}
                        />
                        <Label htmlFor={className} className="text-sm">
                          {className}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3">
              <Button 
                onClick={handleSave} 
                disabled={!name || !name.trim()}
                className="px-8 py-2"
              >
                {editMode ? '保存' : '保存して始める'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* 警告ダイアログ */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>登録が必要です</AlertDialogTitle>
            <AlertDialogDescription>
              苗字を入力し、所属クラスを選択して「保存して始める」を押してください。
              <br />
              登録が完了するまでこの画面は閉じられません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}