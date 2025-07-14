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
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', { id: '', name: '', registeredClasses: [] });
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

  const handleClassToggle = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
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
              お名前を入力してください
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="山田太郎"
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