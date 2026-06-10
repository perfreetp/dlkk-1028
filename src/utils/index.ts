import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export { dayjs };

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const formatTime = (date: string | Date, format: string = 'HH:mm'): string => {
  return dayjs(date).format(format);
};

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const getRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const getBabyAge = (birthday: string): string => {
  const birth = dayjs(birthday);
  const now = dayjs();
  const days = now.diff(birth, 'day');
  const months = now.diff(birth, 'month');
  const years = Math.floor(months / 12);

  if (days < 30) return `${days}天`;
  if (months < 12) return `${months}个月`;
  const remainMonths = months % 12;
  return remainMonths > 0 ? `${years}岁${remainMonths}个月` : `${years}岁`;
};

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getRecordTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    breast: '母乳',
    formula: '配方奶',
    bottle: '瓶喂',
    food: '辅食',
    diaper: '尿布',
    sleep: '睡眠'
  };
  return map[type] || type;
};

export const getRecordTypeColor = (type: string): string => {
  const map: Record<string, string> = {
    breast: '#FFD93D',
    formula: '#F7B267',
    bottle: '#FF8BA7',
    food: '#A8D8EA',
    diaper: '#B5EAD7',
    sleep: '#C3AED6'
  };
  return map[type] || '#999';
};

export const roundTo = (num: number, decimals: number = 1): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

export const calcBMI = (weight: number, height: number): number => {
  if (!weight || !height) return 0;
  const heightM = height / 100;
  return roundTo(weight / (heightM * heightM), 1);
};

export const getBMICategory = (bmi: number, ageMonths: number): string => {
  if (bmi === 0) return '--';
  if (ageMonths < 24) {
    if (bmi < 14) return '偏瘦';
    if (bmi > 18) return '偏胖';
    return '正常';
  }
  if (bmi < 15) return '偏瘦';
  if (bmi > 20) return '偏胖';
  return '正常';
};
