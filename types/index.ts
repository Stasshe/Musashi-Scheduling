export interface Student {
  id: string;
  name: string;
  classes: string[];
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  students: string[];
}

export interface Schedule {
  id: string;
  classId: string;
  className: string;
  subject: string;
  teacher: string;
  date: string;
  startTime: string;
  endTime: string;
  column: number; // 0-5の列番号
  description?: string; // オプションの説明フィールド
}

export interface Subject {
  id: string;
  name: string;
  classes: Class[];
}

export interface UserProfile {
  id: string;
  name: string;
  registeredClasses: string[];
}