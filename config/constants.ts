const SUBJECTS = [
  { id: 'english', name: '英語' },
  { id: 'japanese', name: '国語' },
  { id: 'math', name: '数学' },
  { id: 'science', name: '理科' },
  { id: 'social', name: '社会' },
  { id: 'other', name: 'その他' }
];



const SUBJECT_COLORS = {
  '数学': 'bg-blue-100 text-blue-800 border-blue-200',
  '英語': 'bg-green-100 text-green-800 border-green-200',
  '国語': 'bg-red-100 text-red-800 border-red-200',
  '理科': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '社会': 'bg-purple-100 text-purple-800 border-purple-200',
  'その他': 'bg-gray-100 text-gray-800 border-gray-200'
};


export { SUBJECTS, SUBJECT_COLORS };