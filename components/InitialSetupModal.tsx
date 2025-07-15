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
  // 名前入力時に全角・半角スペースを除去する
  const sanitizeName = (input: string) => input.replace(/[\s　]+/g, '');
  const [name, setNameRaw] = editMode ? [propName ?? '', propSetName ?? (() => {})] : useState('');
  const setName = (val: string) => {
    const sanitized = sanitizeName(val);
    if (editMode && propSetName) {
      propSetName(sanitized);
    } else {
      setNameRaw(sanitized);
    }
  };
  const [selectedClasses, setSelectedClasses] = useState<string[]>(registeredClasses ?? []);
  const [roster, setRoster] = useState<{ [subjectId: string]: { [className: string]: string[] } }>({});
  // 新規登録時用のローカルストレージsetter（userProfileとして保存）
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', { id: '', name: '', registeredClasses: [] });

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
      // userProfileとしてローカルストレージに保存
      setUserProfile({
        ...userProfile,
        name: name.trim(),
        registeredClasses: selectedClasses
      });
      onClose();
    }
  }

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
      <Dialog
        open={isOpen}
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          showCloseButton={!!editMode} // バツボタンをeditMode以外で非表示に
        >
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
                  先に、名前を入力してください
                </Label>
                <p className="text-sm text-gray-600 font-semibold bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <span className="text-yellow-700">※重要：</span>
                  すでに名簿に登録されている場合はチェックボックスに自動でチェックが入ります。
                  <br />
                  <span className="text-red-600 font-bold">必ず完全なフルネームで入力してください。登録名簿と完全一致する必要があります。</span>
                  <br />
                  <span className="text-gray-800">例: 松下 → 松下彰忠</span>
                </p>
                <Input
                  id="name"
                  type="text"
                  placeholder="フルネームを入力"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg"
                />
                <div className="mt-4 text-center">
                  <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold text-base">
                    下の「保存して始める」ボタンを押してください
                    <br />
                    <span className="text-sm text-gray-500">
                      「名簿」ページから、後からいつでも簡単に変更できます。
                    </span>
                  </span>
                </div>
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
            <div className="flex flex-col items-center space-y-2 mt-6">
              <Button 
                onClick={handleSave} 
                disabled={!name || !name.trim()}
                className="px-8 py-2 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editMode ? '保存' : '保存して始める'}
              </Button>
              {!editMode && (
                <span className="text-sm text-gray-500">※登録が完了するまでこの画面は閉じられません</span>
              )}
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
              フルネームを入力し、所属クラスを選択して「保存して始める」を押してください。
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