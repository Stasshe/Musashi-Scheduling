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



export const SUBJECT_COLORS = {
  '数学': 'bg-blue-100 text-blue-800 border-blue-200',
  '英語': 'bg-green-100 text-green-800 border-green-200',
  '国語': 'bg-red-100 text-red-800 border-red-200',
  '理科': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '社会': 'bg-purple-100 text-purple-800 border-purple-200',
  'その他': 'bg-gray-100 text-gray-800 border-gray-200'
};
