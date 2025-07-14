"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const SUBJECTS = [
  { id: 'english', name: '英語' },
  { id: 'japanese', name: '国語' },
  { id: 'math', name: '数学' },
  { id: 'science', name: '理科' },
  { id: 'social', name: '社会' },
  { id: 'other', name: 'その他' }
];

const SAMPLE_CLASSES = {
  english: ['英語A', '英語B', '英語C'],
  japanese: ['国語A', '国語B'],
  math: ['数学A', '数学B', '数学C'],
  science: ['理科A', '理科B'],
  social: ['社会A', '社会B'],
  other: ['その他A']
};

interface InitialSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InitialSetupModal({ isOpen, onClose }: InitialSetupModalProps) {
  const [name, setName] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useLocalStorage('userProfile', { name: '', registeredClasses: [] });

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
                  {SAMPLE_CLASSES[subject.id as keyof typeof SAMPLE_CLASSES].map(className => (
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