"use client";

import { useState } from 'react';
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

// サンプルデータ
type RosterData = {
  [subjectId: string]: {
    [className: string]: string[];
  };
};

const INITIAL_DATA: RosterData = {
  english: {
    '英語A': ['田中太郎', '佐藤花子', '山田次郎'],
    '英語B': ['鈴木一郎', '高橋美咲', '井上健太'],
    '英語C': ['渡辺明美', '中村和也']
  },
  japanese: {
    '国語A': ['田中太郎', '山田次郎', '高橋美咲'],
    '国語B': ['佐藤花子', '鈴木一郎', '渡辺明美']
  },
  math: {
    '数学A': ['田中太郎', '井上健太', '中村和也'],
    '数学B': ['佐藤花子', '山田次郎'],
    '数学C': ['鈴木一郎', '高橋美咲', '渡辺明美']
  },
  science: {
    '理科A': ['田中太郎', '佐藤花子', '山田次郎', '井上健太'],
    '理科B': ['鈴木一郎', '高橋美咲', '渡辺明美', '中村和也']
  },
  social: {
    '社会A': ['田中太郎', '山田次郎', '高橋美咲', '中村和也'],
    '社会B': ['佐藤花子', '鈴木一郎', '井上健太', '渡辺明美']
  },
  other: {
    'その他A': ['田中太郎', '佐藤花子']
  }
};

export default function StudentRoster() {
  const [data, setData] = useState<RosterData>(INITIAL_DATA);
  const [editingClass, setEditingClass] = useState<{ subject: string; className: string } | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [newClassName, setNewClassName] = useState('');

  const addStudent = (subject: string, className: string) => {
    if (newStudentName.trim()) {
      setData(prev => ({
        ...prev,
        [subject]: {
          ...prev[subject],
          [className]: [...(prev[subject]?.[className] || []), newStudentName.trim()]
        }
      }));
      setNewStudentName('');
    }
  };

  const removeStudent = (subject: string, className: string, studentName: string) => {
    setData(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [className]: prev[subject]?.[className]?.filter(name => name !== studentName) || []
      }
    }));
  };

  const addClass = (subject: string) => {
    if (newClassName.trim()) {
      setData(prev => ({
        ...prev,
        [subject]: {
          ...prev[subject],
          [newClassName.trim()]: []
        }
      }));
      setNewClassName('');
    }
  };

  const removeClass = (subject: string, className: string) => {
    setData(prev => {
      const newSubjectData = { ...prev[subject] };
      delete newSubjectData[className];
      return {
        ...prev,
        [subject]: newSubjectData
      };
    });
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