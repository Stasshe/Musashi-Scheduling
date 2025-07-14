"use client";

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
}

export default function InitialSetupModal({ isOpen, onClose }: InitialSetupModalProps) {
  const [name, setName] = useState('');
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', { id: '', name: '', registeredClasses: [] });
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [roster, setRoster] = useState<{ [subjectId: string]: { [className: string]: string[] } }>({});

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
    setSelectedClasses(userProfile?.registeredClasses || []);
  }, [userProfile?.registeredClasses]);

  const handleClassToggle = (className: string) => {
    setSelectedClasses(prev => {
      let updated;
      if (prev.includes(className)) {
        updated = prev.filter(c => c !== className);
      } else {
        updated = [...prev, className];
      }

      // rosterデータとnameが揃っている場合のみfirebaseへ反映
      if (name.trim()) {
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
      return updated;
    });
  };

  const handleSave = () => {
    if (name.trim()) {
      setUserProfile({
        id: userProfile?.id || '',
        name: name.trim(),
        registeredClasses: selectedClasses
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            塾「武蔵」へようこそ
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
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
              disabled={!name.trim()}
              className="px-8 py-2"
            >
              保存して始める
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}