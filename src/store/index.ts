import { create } from 'zustand';
import type {
  Baby,
  AllRecord,
  GrowthRecord,
  Reminder,
  FamilyMember,
  DailyStats,
  HistoryStack
} from '@/types';
import { generateId, dayjs } from '@/utils';

interface BabyStore {
  currentBabyId: string;
  babies: Baby[];
  records: AllRecord[];
  growthRecords: GrowthRecord[];
  reminders: Reminder[];
  familyMembers: FamilyMember[];
  currentUserId: string;
  historyStack: HistoryStack;

  addRecord: (record: Omit<AllRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateRecord: (id: string, updates: Partial<AllRecord>) => void;
  deleteRecord: (id: string) => void;
  undoRecord: () => boolean;
  redoRecord: () => boolean;

  addGrowthRecord: (record: Omit<GrowthRecord, 'id' | 'createdAt'>) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  toggleReminder: (id: string) => void;
  completeReminder: (id: string) => void;

  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  removeFamilyMember: (id: string) => void;

  getRecordsByDate: (date: string) => AllRecord[];
  getRecordsByType: (type: string) => AllRecord[];
  getDailyStats: (date: string) => DailyStats;
  getWeeklyStats: (startDate: string) => DailyStats[];
  getMemberById: (id: string) => FamilyMember | undefined;
  getCurrentBaby: () => Baby | undefined;
}

const mockBaby: Baby = {
  id: 'baby_1',
  name: '小糯米',
  gender: 'girl',
  birthday: dayjs().subtract(6, 'month').subtract(15, 'day').format('YYYY-MM-DD'),
  height: 68,
  weight: 8.2,
  headCircumference: 43.5
};

const mockMembers: FamilyMember[] = [
  { id: 'user_1', name: '妈妈', role: 'mom', roleName: '妈妈', canEdit: true },
  { id: 'user_2', name: '爸爸', role: 'dad', roleName: '爸爸', canEdit: true },
  { id: 'user_3', name: '李阿姨', role: 'nanny', roleName: '月嫂', canEdit: true }
];

const now = dayjs();
const mockRecords: AllRecord[] = [
  {
    id: generateId(),
    type: 'breast',
    side: 'both',
    leftDuration: 12,
    rightDuration: 10,
    totalDuration: 22,
    time: now.subtract(1, 'hour').toISOString(),
    note: '吃得很认真',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: 'user_1'
  } as any,
  {
    id: generateId(),
    type: 'diaper',
    diaperType: 'pee',
    color: 'yellow',
    texture: 'normal',
    amount: 'medium',
    time: now.subtract(2, 'hour').toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: 'user_1'
  } as any,
  {
    id: generateId(),
    type: 'sleep',
    startTime: now.subtract(3, 'hour').toISOString(),
    endTime: now.subtract(1, 'hour').add(30, 'minute').toISOString(),
    duration: 90,
    quality: 'good',
    time: now.subtract(3, 'hour').toISOString(),
    environment: '安静，小夜灯',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: 'user_3'
  } as any,
  {
    id: generateId(),
    type: 'formula',
    powderAmount: 4,
    waterAmount: 120,
    waterTemp: 45,
    brand: '爱他美',
    time: now.subtract(4, 'hour').toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: 'user_3'
  } as any,
  {
    id: generateId(),
    type: 'food',
    foodName: '苹果泥米糊',
    ingredients: ['苹果', '米粉'],
    amount: 60,
    unit: 'g',
    allergyReaction: 'none',
    time: now.subtract(6, 'hour').toISOString(),
    note: '第一次吃，很喜欢',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: 'user_1'
  } as any
];

const mockGrowth: GrowthRecord[] = [
  { id: generateId(), date: now.subtract(180, 'day').format('YYYY-MM-DD'), weight: 3.4, height: 50, headCircumference: 34, createdAt: now.toISOString() },
  { id: generateId(), date: now.subtract(150, 'day').format('YYYY-MM-DD'), weight: 4.8, height: 55, headCircumference: 37, createdAt: now.toISOString() },
  { id: generateId(), date: now.subtract(120, 'day').format('YYYY-MM-DD'), weight: 6.1, height: 60, headCircumference: 39.5, createdAt: now.toISOString() },
  { id: generateId(), date: now.subtract(90, 'day').format('YYYY-MM-DD'), weight: 7.0, height: 63.5, headCircumference: 41, createdAt: now.toISOString() },
  { id: generateId(), date: now.subtract(60, 'day').format('YYYY-MM-DD'), weight: 7.6, height: 65.5, headCircumference: 42, createdAt: now.toISOString() },
  { id: generateId(), date: now.subtract(30, 'day').format('YYYY-MM-DD'), weight: 8.0, height: 67, headCircumference: 43, createdAt: now.toISOString() },
  { id: generateId(), date: now.format('YYYY-MM-DD'), weight: 8.2, height: 68, headCircumference: 43.5, createdAt: now.toISOString() }
];

const mockReminders: Reminder[] = [
  { id: generateId(), type: 'feeding', title: '该喂奶啦', time: '08:00', repeat: 'daily', enabled: true, createdAt: now.toISOString() },
  { id: generateId(), type: 'feeding', title: '该喂奶啦', time: '12:00', repeat: 'daily', enabled: true, createdAt: now.toISOString() },
  { id: generateId(), type: 'feeding', title: '该喂奶啦', time: '16:00', repeat: 'daily', enabled: true, createdAt: now.toISOString() },
  { id: generateId(), type: 'vaccine', title: '乙肝疫苗第三针', time: now.add(5, 'day').format('YYYY-MM-DD 09:00'), repeat: 'none', enabled: true, note: '社区卫生服务中心', createdAt: now.toISOString() },
  { id: generateId(), type: 'checkup', title: '6个月体检', time: now.add(15, 'day').format('YYYY-MM-DD 09:30'), repeat: 'none', enabled: true, note: '儿保科', createdAt: now.toISOString() }
];

export const useBabyStore = create<BabyStore>((set, get) => ({
  currentBabyId: 'baby_1',
  babies: [mockBaby],
  records: mockRecords,
  growthRecords: mockGrowth,
  reminders: mockReminders,
  familyMembers: mockMembers,
  currentUserId: 'user_1',
  historyStack: { records: [], cursor: -1 },

  addRecord: (recordData) => {
    const newRecord = {
      ...recordData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: get().currentUserId
    } as AllRecord;

    set((state) => {
      const newRecords = [...state.records, newRecord];
      const stack = state.historyStack.records.slice(0, state.historyStack.cursor + 1);
      return {
        records: newRecords,
        historyStack: {
          records: [...stack, newRecord],
          cursor: stack.length
        }
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      )
    }));
  },

  deleteRecord: (id) => {
    set((state) => ({
      records: state.records.filter((r) => r.id !== id)
    }));
  },

  undoRecord: () => {
    const { historyStack, records } = get();
    if (historyStack.cursor < 0) return false;
    const recordToUndo = historyStack.records[historyStack.cursor];
    set((state) => ({
      records: state.records.filter((r) => r.id !== recordToUndo.id),
      historyStack: {
        ...state.historyStack,
        cursor: state.historyStack.cursor - 1
      }
    }));
    return true;
  },

  redoRecord: () => {
    const { historyStack } = get();
    if (historyStack.cursor >= historyStack.records.length - 1) return false;
    const nextCursor = historyStack.cursor + 1;
    const recordToRedo = historyStack.records[nextCursor];
    set((state) => ({
      records: [...state.records, recordToRedo],
      historyStack: {
        ...state.historyStack,
        cursor: nextCursor
      }
    }));
    return true;
  },

  addGrowthRecord: (recordData) => {
    const newRecord = {
      ...recordData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    set((state) => ({
      growthRecords: [...state.growthRecords, newRecord]
    }));
  },

  addReminder: (reminderData) => {
    const newReminder = {
      ...reminderData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    set((state) => ({
      reminders: [...state.reminders, newReminder]
    }));
  },

  updateReminder: (id, updates) => {
    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r))
    }));
  },

  toggleReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    }));
  },

  completeReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, completed: true, completedAt: new Date().toISOString() } : r
      )
    }));
  },

  addFamilyMember: (memberData) => {
    const newMember = {
      ...memberData,
      id: generateId()
    };
    set((state) => ({
      familyMembers: [...state.familyMembers, newMember]
    }));
  },

  updateFamilyMember: (id, updates) => {
    set((state) => ({
      familyMembers: state.familyMembers.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      )
    }));
  },

  removeFamilyMember: (id) => {
    set((state) => ({
      familyMembers: state.familyMembers.filter((m) => m.id !== id)
    }));
  },

  getRecordsByDate: (date) => {
    const targetDate = dayjs(date).format('YYYY-MM-DD');
    return get()
      .records.filter((r) => dayjs(r.time).format('YYYY-MM-DD') === targetDate)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  },

  getRecordsByType: (type) => {
    return get()
      .records.filter((r) => r.type === type)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  },

  getDailyStats: (date) => {
    const dayRecords = get().getRecordsByDate(date);
    const feedingRecords = dayRecords.filter((r) => ['breast', 'formula', 'bottle'].includes(r.type));
    const breastRecords = dayRecords.filter((r) => r.type === 'breast') as any[];
    const foodRecords = dayRecords.filter((r) => r.type === 'food');
    const diaperRecords = dayRecords.filter((r) => r.type === 'diaper');
    const sleepRecords = dayRecords.filter((r) => r.type === 'sleep') as any[];

    let totalAmount = 0;
    feedingRecords.forEach((r) => {
      if (r.type === 'formula') totalAmount += (r as any).waterAmount || 0;
      if (r.type === 'bottle') totalAmount += (r as any).amount || 0;
    });

    return {
      date,
      feedingCount: feedingRecords.length,
      feedingTotalAmount: totalAmount,
      breastTotalDuration: breastRecords.reduce((sum, r) => sum + (r.totalDuration || 0), 0),
      foodCount: foodRecords.length,
      diaperCount: diaperRecords.length,
      sleepTotalDuration: sleepRecords.reduce((sum, r) => sum + (r.duration || 0), 0),
      sleepCount: sleepRecords.length
    };
  },

  getWeeklyStats: (startDate) => {
    const stats: DailyStats[] = [];
    for (let i = 0; i < 7; i++) {
      const date = dayjs(startDate).add(i, 'day').format('YYYY-MM-DD');
      stats.push(get().getDailyStats(date));
    }
    return stats;
  },

  getMemberById: (id) => {
    return get().familyMembers.find((m) => m.id === id);
  },

  getCurrentBaby: () => {
    return get().babies.find((b) => b.id === get().currentBabyId);
  }
}));
