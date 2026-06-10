import { create } from 'zustand';
import Taro from '@tarojs/taro';
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

const STORAGE_KEY = 'baby_record_store_v1';

interface PeriodSummary extends DailyStats {
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  dayCount: number;
}

interface BabyStore {
  currentBabyId: string;
  babies: Baby[];
  records: AllRecord[];
  growthRecords: GrowthRecord[];
  reminders: Reminder[];
  familyMembers: FamilyMember[];
  currentUserId: string;
  historyStack: HistoryStack;
  inviteCode: string;

  addRecord: (record: Omit<AllRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => boolean;
  updateRecord: (id: string, updates: Partial<AllRecord>) => boolean;
  deleteRecord: (id: string) => boolean;
  undoRecord: () => boolean;
  redoRecord: () => boolean;

  addGrowthRecord: (record: Omit<GrowthRecord, 'id' | 'createdAt'>) => boolean;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => boolean;
  updateReminder: (id: string, updates: Partial<Reminder>) => boolean;
  toggleReminder: (id: string) => void;
  completeReminder: (id: string) => void;

  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  removeFamilyMember: (id: string) => void;
  generateInviteCode: () => string;
  acceptInviteCode: (code: string, name: string) => FamilyMember | null;
  canEdit: () => boolean;
  canCurrentUser: (action: 'add' | 'edit' | 'delete') => boolean;

  getRecordsByDate: (date: string) => AllRecord[];
  getRecordsByDateRange: (startDate: string, endDate: string) => AllRecord[];
  getRecordsByType: (type: string) => AllRecord[];
  getDailyStats: (date: string) => DailyStats;
  getWeeklyStats: (startDate: string) => DailyStats[];
  getPeriodSummary: (type: 'week' | 'month' | 'day', date?: string) => PeriodSummary;
  getMemberById: (id: string) => FamilyMember | undefined;
  getCurrentBaby: () => Baby | undefined;
  resetAll: () => void;
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
  { id: generateId(), type: 'breast', side: 'both', leftDuration: 12, rightDuration: 10, totalDuration: 22, time: now.subtract(1, 'hour').toISOString(), note: '吃得很认真', createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_1' } as any,
  { id: generateId(), type: 'diaper', diaperType: 'pee', color: 'yellow', texture: 'normal', amount: 'medium', time: now.subtract(2, 'hour').toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_1' } as any,
  { id: generateId(), type: 'sleep', startTime: now.subtract(3, 'hour').toISOString(), endTime: now.subtract(1, 'hour').add(30, 'minute').toISOString(), duration: 90, quality: 'good', time: now.subtract(3, 'hour').toISOString(), environment: '安静，小夜灯', createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_3' } as any,
  { id: generateId(), type: 'formula', powderAmount: 4, waterAmount: 120, waterTemp: 45, brand: '爱他美', time: now.subtract(4, 'hour').toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_3' } as any,
  { id: generateId(), type: 'food', foodName: '苹果泥米糊', ingredients: ['苹果', '米粉'], amount: 60, unit: 'g', allergyReaction: 'none', time: now.subtract(6, 'hour').toISOString(), note: '第一次吃，很喜欢', createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_1' } as any,
  { id: generateId(), type: 'breast', side: 'left', leftDuration: 15, totalDuration: 15, time: now.subtract(8, 'hour').toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_2' } as any,
  { id: generateId(), type: 'diaper', diaperType: 'poop', color: 'yellow', texture: 'normal', amount: 'large', time: now.subtract(10, 'hour').toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_2' } as any,
  { id: generateId(), type: 'sleep', startTime: now.subtract(12, 'hour').toISOString(), endTime: now.subtract(10, 'hour').toISOString(), duration: 120, quality: 'normal', time: now.subtract(12, 'hour').toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_1' } as any
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

const defaults = {
  currentBabyId: 'baby_1',
  babies: [mockBaby],
  records: mockRecords,
  growthRecords: mockGrowth,
  reminders: mockReminders,
  familyMembers: mockMembers,
  currentUserId: 'user_1',
  historyStack: { records: [], cursor: -1 } as HistoryStack,
  inviteCode: ''
};

type PersistState = Omit<BabyStore,
  'addRecord' | 'updateRecord' | 'deleteRecord' | 'undoRecord' | 'redoRecord' |
  'addGrowthRecord' | 'addReminder' | 'updateReminder' | 'toggleReminder' | 'completeReminder' |
  'addFamilyMember' | 'updateFamilyMember' | 'removeFamilyMember' | 'generateInviteCode' | 'acceptInviteCode' | 'canEdit' | 'canCurrentUser' |
  'getRecordsByDate' | 'getRecordsByDateRange' | 'getRecordsByType' | 'getDailyStats' | 'getWeeklyStats' | 'getPeriodSummary' | 'getMemberById' | 'getCurrentBaby' | 'resetAll'
>;

const loadFromStorage = (): PersistState | null => {
  try {
    const raw =
      (typeof Taro !== 'undefined' && Taro.getStorageSync && Taro.getStorageSync(STORAGE_KEY)) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY));
    if (!raw) return null;
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return data as PersistState;
  } catch (e) {
    console.warn('[Store] 读取持久化数据失败', e);
    return null;
  }
};

const saveToStorage = (state: PersistState) => {
  try {
    const data: PersistState = {
      currentBabyId: state.currentBabyId,
      babies: state.babies,
      records: state.records,
      growthRecords: state.growthRecords,
      reminders: state.reminders,
      familyMembers: state.familyMembers,
      currentUserId: state.currentUserId,
      historyStack: state.historyStack,
      inviteCode: state.inviteCode
    };
    const str = JSON.stringify(data);
    if (typeof Taro !== 'undefined' && Taro.setStorageSync) {
      Taro.setStorageSync(STORAGE_KEY, str);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, str);
    }
  } catch (e) {
    console.warn('[Store] 保存持久化数据失败', e);
  }
};

const initial = loadFromStorage() || defaults;

const calcDailyStatsFromRecords = (date: string, dayRecords: AllRecord[]): DailyStats => {
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
};

const summarizeStats = (stats: DailyStats[], period: 'day' | 'week' | 'month', startDate: string, endDate: string): PeriodSummary => {
  const sum = stats.reduce(
    (acc, s) => ({
      feedingCount: acc.feedingCount + s.feedingCount,
      feedingTotalAmount: acc.feedingTotalAmount + s.feedingTotalAmount,
      breastTotalDuration: acc.breastTotalDuration + s.breastTotalDuration,
      foodCount: acc.foodCount + s.foodCount,
      diaperCount: acc.diaperCount + s.diaperCount,
      sleepTotalDuration: acc.sleepTotalDuration + s.sleepTotalDuration,
      sleepCount: acc.sleepCount + s.sleepCount
    }),
    { feedingCount: 0, feedingTotalAmount: 0, breastTotalDuration: 0, foodCount: 0, diaperCount: 0, sleepTotalDuration: 0, sleepCount: 0 }
  );
  return {
    ...sum,
    date: endDate,
    period,
    startDate,
    endDate,
    dayCount: stats.length
  };
};

export const useBabyStore = create<BabyStore>((set, get) => ({
  ...initial,

  canEdit: () => {
    const { currentUserId, familyMembers } = get();
    const member = familyMembers.find((m) => m.id === currentUserId);
    return !!member?.canEdit;
  },

  canCurrentUser: (action: 'add' | 'edit' | 'delete') => {
    const canEdit = get().canEdit();
    if (!canEdit) return false;
    if (action === 'add' || action === 'edit') return true;
    return action === 'delete' ? canEdit : false;
  },

  addRecord: (recordData) => {
    if (!get().canCurrentUser('add')) {
      typeof Taro !== 'undefined' && Taro.showToast && Taro.showToast({ title: '无新增权限', icon: 'none' });
      return false;
    }
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
      const next = {
        records: newRecords,
        historyStack: { records: [...stack, newRecord], cursor: stack.length }
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  updateRecord: (id, updates) => {
    if (!get().canCurrentUser('edit')) {
      Taro.showToast({ title: '无修改权限', icon: 'none' });
      return false;
    }
    set((state) => {
      const next = {
        records: state.records.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
        )
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  deleteRecord: (id) => {
    if (!get().canCurrentUser('delete')) {
      Taro.showToast({ title: '无删除权限', icon: 'none' });
      return false;
    }
    set((state) => {
      const next = { records: state.records.filter((r) => r.id !== id) };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  undoRecord: () => {
    const { historyStack } = get();
    if (historyStack.cursor < 0) return false;
    const recordToUndo = historyStack.records[historyStack.cursor];
    set((state) => {
      const next = {
        records: state.records.filter((r) => r.id !== recordToUndo.id),
        historyStack: { ...state.historyStack, cursor: state.historyStack.cursor - 1 }
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  redoRecord: () => {
    const { historyStack } = get();
    if (historyStack.cursor >= historyStack.records.length - 1) return false;
    const nextCursor = historyStack.cursor + 1;
    const recordToRedo = historyStack.records[nextCursor];
    set((state) => {
      const next = {
        records: [...state.records, recordToRedo],
        historyStack: { ...state.historyStack, cursor: nextCursor }
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  addGrowthRecord: (recordData) => {
    if (!get().canCurrentUser('add')) {
      Taro.showToast({ title: '无新增权限', icon: 'none' });
      return false;
    }
    const newRecord = { ...recordData, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => {
      const next = { growthRecords: [...state.growthRecords, newRecord] };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  addReminder: (reminderData) => {
    if (!get().canCurrentUser('add')) {
      Taro.showToast({ title: '无新增权限', icon: 'none' });
      return false;
    }
    const newReminder = { ...reminderData, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => {
      const next = { reminders: [...state.reminders, newReminder] };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  updateReminder: (id, updates) => {
    if (!get().canCurrentUser('edit')) {
      Taro.showToast({ title: '无修改权限', icon: 'none' });
      return false;
    }
    set((state) => {
      const next = { reminders: state.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r)) };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  toggleReminder: (id) => {
    set((state) => {
      const next = { reminders: state.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) };
      saveToStorage({ ...state, ...next });
      return next;
    });
  },

  completeReminder: (id) => {
    set((state) => {
      const next = {
        reminders: state.reminders.map((r) =>
          r.id === id ? { ...r, completed: true, completedAt: new Date().toISOString() } : r
        )
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
  },

  addFamilyMember: (memberData) => {
    const newMember = { ...memberData, id: generateId() };
    set((state) => {
      const next = { familyMembers: [...state.familyMembers, newMember] };
      saveToStorage({ ...state, ...next });
      return next;
    });
  },

  updateFamilyMember: (id, updates) => {
    set((state) => {
      const next = {
        familyMembers: state.familyMembers.map((m) => (m.id === id ? { ...m, ...updates } : m))
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
  },

  removeFamilyMember: (id) => {
    set((state) => {
      const next = { familyMembers: state.familyMembers.filter((m) => m.id !== id) };
      saveToStorage({ ...state, ...next });
      return next;
    });
  },

  generateInviteCode: () => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    set((state) => {
      const next = { inviteCode: code };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return code;
  },

  acceptInviteCode: (code, name) => {
    const { inviteCode, familyMembers, addFamilyMember } = get();
    if (!code || code.length < 4) {
      Taro.showToast({ title: '邀请码无效', icon: 'none' });
      return null;
    }
    if (inviteCode && inviteCode.toUpperCase() === code.toUpperCase()) {
      const newMember: Omit<FamilyMember, 'id'> = {
        name: name.trim() || '新成员',
        role: 'other',
        roleName: '家人',
        canEdit: true
      };
      addFamilyMember(newMember);
      const latest = get().familyMembers[get().familyMembers.length - 1];
      Taro.showToast({ title: '加入家庭成功', icon: 'success' });
      return latest;
    }
    Taro.showToast({ title: '邀请码错误', icon: 'none' });
    return null;
  },

  getRecordsByDate: (date) => {
    const targetDate = dayjs(date).format('YYYY-MM-DD');
    return get()
      .records.filter((r) => dayjs(r.time).format('YYYY-MM-DD') === targetDate)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  },

  getRecordsByDateRange: (startDate, endDate) => {
    const s = dayjs(startDate).startOf('day');
    const e = dayjs(endDate).endOf('day');
    return get()
      .records.filter((r) => {
        const t = dayjs(r.time);
        return (t.isSame(s) || t.isAfter(s)) && (t.isSame(e) || t.isBefore(e));
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  },

  getRecordsByType: (type) => {
    return get()
      .records.filter((r) => r.type === type)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  },

  getDailyStats: (date) => {
    const dayRecords = get().getRecordsByDate(date);
    return calcDailyStatsFromRecords(date, dayRecords);
  },

  getWeeklyStats: (startDate) => {
    const stats: DailyStats[] = [];
    for (let i = 0; i < 7; i++) {
      const d = dayjs(startDate).add(i, 'day').format('YYYY-MM-DD');
      stats.push(get().getDailyStats(d));
    }
    return stats;
  },

  getPeriodSummary: (type, date) => {
    const target = date ? dayjs(date) : dayjs();
    if (type === 'day') {
      const d = target.format('YYYY-MM-DD');
      const s = get().getDailyStats(d);
      return { ...s, period: 'day', startDate: d, endDate: d, dayCount: 1 };
    }
    if (type === 'week') {
      const s = target.startOf('week');
      const e = target.endOf('week');
      const days: DailyStats[] = [];
      for (let i = 0; i < 7; i++) {
        const d = s.add(i, 'day').format('YYYY-MM-DD');
        days.push(get().getDailyStats(d));
      }
      return summarizeStats(days, 'week', s.format('YYYY-MM-DD'), e.format('YYYY-MM-DD'));
    }
    const s = target.startOf('month');
    const e = target.endOf('month');
    const dayCount = e.diff(s, 'day') + 1;
    const days: DailyStats[] = [];
    for (let i = 0; i < dayCount; i++) {
      const d = s.clone().add(i, 'day').format('YYYY-MM-DD');
      days.push(get().getDailyStats(d));
    }
    return summarizeStats(days, 'month', s.format('YYYY-MM-DD'), e.format('YYYY-MM-DD'));
  },

  getMemberById: (id) => get().familyMembers.find((m) => m.id === id),

  getCurrentBaby: () => get().babies.find((b) => b.id === get().currentBabyId),

  resetAll: () => {
    set({ ...defaults });
    saveToStorage(defaults);
  }
}));
