import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  Baby,
  AllRecord,
  GrowthRecord,
  Reminder,
  FamilyMember,
  DailyStats,
  HistoryStack,
  ActivityLog,
  ActivityAction,
  ActivityTarget
} from '@/types';
import { generateId, dayjs } from '@/utils';

const STORAGE_KEY = 'baby_record_store_v2';

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
  activityLogs: ActivityLog[];

  addRecord: (record: Omit<AllRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => boolean;
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
  setCurrentUser: (userId: string) => boolean;

  getRecordsByDate: (date: string) => AllRecord[];
  getRecordsByDateRange: (startDate: string, endDate: string) => AllRecord[];
  getRecordsByType: (type: string) => AllRecord[];
  getDailyStats: (date: string) => DailyStats;
  getWeeklyStats: (startDate: string) => DailyStats[];
  getPeriodSummary: (type: 'week' | 'month' | 'day', date?: string) => PeriodSummary;
  getMemberById: (id: string) => FamilyMember | undefined;
  getCurrentBaby: () => Baby | undefined;
  getRecentActivity: (limit?: number) => ActivityLog[];
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
  { id: generateId(), type: 'breast', side: 'both', leftDuration: 12, rightDuration: 10, totalDuration: 22, time: now.subtract(1, 'hour').toISOString(), note: '吃得很认真', createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_1', updatedBy: 'user_1' } as any,
  { id: generateId(), type: 'diaper', diaperType: 'pee', color: 'yellow', texture: 'normal', amount: 'medium', time: now.subtract(2, 'hour').toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_1', updatedBy: 'user_1' } as any,
  { id: generateId(), type: 'sleep', startTime: now.subtract(3, 'hour').toISOString(), endTime: now.subtract(1, 'hour').add(30, 'minute').toISOString(), duration: 90, quality: 'good', time: now.subtract(3, 'hour').toISOString(), environment: '安静，小夜灯', createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_3', updatedBy: 'user_3' } as any,
  { id: generateId(), type: 'formula', powderAmount: 4, waterAmount: 120, waterTemp: 45, brand: '爱他美', time: now.subtract(4, 'hour').toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_3', updatedBy: 'user_3' } as any,
  { id: generateId(), type: 'food', foodName: '苹果泥米糊', ingredients: ['苹果', '米粉'], amount: 60, unit: 'g', allergyReaction: 'none', time: now.subtract(6, 'hour').toISOString(), note: '第一次吃，很喜欢', createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_1', updatedBy: 'user_1' } as any,
  { id: generateId(), type: 'breast', side: 'left', leftDuration: 15, totalDuration: 15, time: now.subtract(8, 'hour').toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_2', updatedBy: 'user_2' } as any,
  { id: generateId(), type: 'diaper', diaperType: 'poop', color: 'yellow', texture: 'normal', amount: 'large', time: now.subtract(10, 'hour').toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_2', updatedBy: 'user_2' } as any,
  { id: generateId(), type: 'sleep', startTime: now.subtract(12, 'hour').toISOString(), endTime: now.subtract(10, 'hour').toISOString(), duration: 120, quality: 'normal', time: now.subtract(12, 'hour').toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(), createdBy: 'user_1', updatedBy: 'user_1' } as any
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

const mockActivity: ActivityLog[] = [
  { id: generateId(), action: 'add', target: 'record', targetType: 'breast', summary: '记录母乳22分钟', userId: 'user_1', userName: '妈妈', createdAt: now.subtract(1, 'hour').toISOString() },
  { id: generateId(), action: 'add', target: 'record', targetType: 'diaper', summary: '记录小便', userId: 'user_1', userName: '妈妈', createdAt: now.subtract(2, 'hour').toISOString() },
  { id: generateId(), action: 'add', target: 'record', targetType: 'sleep', summary: '记录睡眠90分钟', userId: 'user_3', userName: '李阿姨', createdAt: now.subtract(1, 'hour').add(30, 'minute').toISOString() },
  { id: generateId(), action: 'add', target: 'record', targetType: 'formula', summary: '记录配方奶120ml', userId: 'user_3', userName: '李阿姨', createdAt: now.subtract(4, 'hour').toISOString() },
  { id: generateId(), action: 'add', target: 'record', targetType: 'food', summary: '添加辅食苹果泥米糊', userId: 'user_1', userName: '妈妈', createdAt: now.subtract(6, 'hour').toISOString() },
  { id: generateId(), action: 'add', target: 'record', targetType: 'breast', summary: '记录母乳15分钟', userId: 'user_2', userName: '爸爸', createdAt: now.subtract(8, 'hour').toISOString() },
  { id: generateId(), action: 'add', target: 'record', targetType: 'diaper', summary: '记录大便', userId: 'user_2', userName: '爸爸', createdAt: now.subtract(10, 'hour').toISOString() },
  { id: generateId(), action: 'add', target: 'record', targetType: 'sleep', summary: '记录睡眠2小时', userId: 'user_1', userName: '妈妈', createdAt: now.subtract(10, 'hour').toISOString() },
  { id: generateId(), action: 'add', target: 'growth', summary: '录入成长数据', userId: 'user_1', userName: '妈妈', createdAt: now.subtract(2, 'day').toISOString() },
  { id: generateId(), action: 'change_permission', target: 'permission', summary: '为李阿姨开启编辑权限', userId: 'user_1', userName: '妈妈', createdAt: now.subtract(3, 'day').toISOString() },
  { id: generateId(), action: 'add', target: 'family', summary: '添加家庭成员李阿姨', userId: 'user_1', userName: '妈妈', createdAt: now.subtract(7, 'day').toISOString() }
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
  inviteCode: '',
  activityLogs: mockActivity
};

type PersistState = Omit<BabyStore,
  'addRecord' | 'updateRecord' | 'deleteRecord' | 'undoRecord' | 'redoRecord' |
  'addGrowthRecord' | 'addReminder' | 'updateReminder' | 'toggleReminder' | 'completeReminder' |
  'addFamilyMember' | 'updateFamilyMember' | 'removeFamilyMember' | 'generateInviteCode' | 'acceptInviteCode' | 'canEdit' | 'canCurrentUser' | 'setCurrentUser' |
  'getRecordsByDate' | 'getRecordsByDateRange' | 'getRecordsByType' | 'getDailyStats' | 'getWeeklyStats' | 'getPeriodSummary' | 'getMemberById' | 'getCurrentBaby' | 'getRecentActivity' | 'resetAll'
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
      inviteCode: state.inviteCode,
      activityLogs: state.activityLogs
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

const typeMap4Summary: Record<string, string> = {
  breast: '母乳', formula: '配方奶', bottle: '瓶喂', food: '辅食', diaper: '尿布', sleep: '睡眠'
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

  setCurrentUser: (userId) => {
    const { familyMembers, currentUserId } = get();
    if (userId === currentUserId) return false;
    const target = familyMembers.find((m) => m.id === userId);
    if (!target) {
      Taro.showToast({ title: '成员不存在', icon: 'none' });
      return false;
    }
    const member = get().familyMembers.find((m) => m.id === currentUserId);
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'switch_user',
      target: 'family',
      summary: `切换身份为「${target.name}」${target.canEdit ? '（可编辑）' : '（仅查看）'}`,
      userId,
      userName: target.name,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const next = {
        currentUserId: userId,
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
    Taro.showToast({
      title: target.canEdit ? `已切换为「${target.name}」` : `「${target.name}」仅可查看`,
      icon: 'none'
    });
    void member;
    return true;
  },

  addRecord: (recordData) => {
    if (!get().canCurrentUser('add')) {
      typeof Taro !== 'undefined' && Taro.showToast && Taro.showToast({ title: '当前身份无新增权限', icon: 'none' });
      return false;
    }
    const now2 = new Date().toISOString();
    const uid = get().currentUserId;
    const member = get().familyMembers.find((m) => m.id === uid);
    const newRecord = {
      ...recordData,
      id: generateId(),
      createdAt: now2,
      updatedAt: now2,
      createdBy: uid,
      updatedBy: uid
    } as AllRecord;
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'add',
      target: 'record',
      targetId: newRecord.id,
      targetType: newRecord.type,
      summary: `新增${typeMap4Summary[newRecord.type] || '记录'}${newRecord.note ? '（含备注）' : ''}`,
      userId: uid,
      userName: member?.name,
      createdAt: now2
    };
    set((state) => {
      const newRecords = [...state.records, newRecord];
      const stack = state.historyStack.records.slice(0, state.historyStack.cursor + 1);
      const next = {
        records: newRecords,
        historyStack: { records: [...stack, newRecord], cursor: stack.length },
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  updateRecord: (id, updates) => {
    if (!get().canCurrentUser('edit')) {
      Taro.showToast({ title: '当前身份无修改权限', icon: 'none' });
      return false;
    }
    const uid = get().currentUserId;
    const member = get().familyMembers.find((m) => m.id === uid);
    const original = get().records.find((r) => r.id === id);
    if (!original) return false;
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'update',
      target: 'record',
      targetId: id,
      targetType: original.type,
      summary: `修改${typeMap4Summary[original.type] || '记录'}`,
      userId: uid,
      userName: member?.name,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const next = {
        records: state.records.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString(), updatedBy: uid } : r
        ),
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  deleteRecord: (id) => {
    if (!get().canCurrentUser('delete')) {
      Taro.showToast({ title: '当前身份无删除权限', icon: 'none' });
      return false;
    }
    const uid = get().currentUserId;
    const member = get().familyMembers.find((m) => m.id === uid);
    const original = get().records.find((r) => r.id === id);
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'delete',
      target: 'record',
      targetId: id,
      targetType: original?.type,
      summary: `删除${typeMap4Summary[original?.type || ''] || '记录'}`,
      userId: uid,
      userName: member?.name,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const next = {
        records: state.records.filter((r) => r.id !== id),
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
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
      Taro.showToast({ title: '当前身份无新增权限', icon: 'none' });
      return false;
    }
    const uid = get().currentUserId;
    const member = get().familyMembers.find((m) => m.id === uid);
    const newRecord = { ...recordData, id: generateId(), createdAt: new Date().toISOString() };
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'add',
      target: 'growth',
      targetId: newRecord.id,
      summary: '录入成长数据（身高/体重/头围）',
      userId: uid,
      userName: member?.name,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const next = {
        growthRecords: [...state.growthRecords, newRecord],
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  addReminder: (reminderData) => {
    if (!get().canCurrentUser('add')) {
      Taro.showToast({ title: '当前身份无新增权限', icon: 'none' });
      return false;
    }
    const uid = get().currentUserId;
    const member = get().familyMembers.find((m) => m.id === uid);
    const newReminder = { ...reminderData, id: generateId(), createdAt: new Date().toISOString() };
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'add',
      target: 'reminder',
      targetId: newReminder.id,
      targetType: newReminder.type,
      summary: `新增提醒「${newReminder.title}」`,
      userId: uid,
      userName: member?.name,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const next = {
        reminders: [...state.reminders, newReminder],
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  updateReminder: (id, updates) => {
    if (!get().canCurrentUser('edit')) {
      Taro.showToast({ title: '当前身份无修改权限', icon: 'none' });
      return false;
    }
    const uid = get().currentUserId;
    const member = get().familyMembers.find((m) => m.id === uid);
    const original = get().reminders.find((r) => r.id === id);
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'update',
      target: 'reminder',
      targetId: id,
      targetType: original?.type,
      summary: `修改提醒${original?.title ? '「' + original.title + '」' : ''}`,
      userId: uid,
      userName: member?.name,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const next = {
        reminders: state.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
    return true;
  },

  toggleReminder: (id) => {
    const uid = get().currentUserId;
    const member = get().familyMembers.find((m) => m.id === uid);
    const original = get().reminders.find((r) => r.id === id);
    set((state) => {
      const after = state.reminders.find((r) => r.id === id);
      const activityLog: ActivityLog = {
        id: generateId(),
        action: 'toggle',
        target: 'reminder',
        targetId: id,
        targetType: original?.type,
        summary: `${after?.enabled ? '关闭' : '开启'}提醒「${original?.title || ''}」`,
        userId: uid,
        userName: member?.name,
        createdAt: new Date().toISOString()
      };
      const next = {
        reminders: state.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
  },

  completeReminder: (id) => {
    const uid = get().currentUserId;
    const member = get().familyMembers.find((m) => m.id === uid);
    const original = get().reminders.find((r) => r.id === id);
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'complete',
      target: 'reminder',
      targetId: id,
      targetType: original?.type,
      summary: `标记提醒已完成「${original?.title || ''}」`,
      userId: uid,
      userName: member?.name,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const next = {
        reminders: state.reminders.map((r) =>
          r.id === id ? { ...r, completed: true, completedAt: new Date().toISOString() } : r
        ),
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
  },

  addFamilyMember: (memberData) => {
    const newMember = { ...memberData, id: generateId() };
    const uid = get().currentUserId;
    const operator = get().familyMembers.find((m) => m.id === uid);
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'add',
      target: 'family',
      targetId: newMember.id,
      summary: `添加家庭成员「${newMember.name}」(${newMember.roleName}${newMember.canEdit ? '·可编辑' : '·只读'})`,
      userId: uid,
      userName: operator?.name,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const next = {
        familyMembers: [...state.familyMembers, newMember],
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
  },

  updateFamilyMember: (id, updates) => {
    const uid = get().currentUserId;
    const operator = get().familyMembers.find((m) => m.id === uid);
    const original = get().familyMembers.find((m) => m.id === id);
    let summary = `修改「${original?.name || ''}」资料`;
    if (updates.canEdit !== undefined && original && updates.canEdit !== original.canEdit) {
      summary = updates.canEdit
        ? `为「${original?.name}」开启编辑权限`
        : `将「${original?.name}」改为仅查看`;
    }
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'change_permission',
      target: updates.canEdit !== undefined ? 'permission' : 'family',
      targetId: id,
      summary,
      userId: uid,
      userName: operator?.name,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const next = {
        familyMembers: state.familyMembers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
      saveToStorage({ ...state, ...next });
      return next;
    });
  },

  removeFamilyMember: (id) => {
    const uid = get().currentUserId;
    const operator = get().familyMembers.find((m) => m.id === uid);
    const original = get().familyMembers.find((m) => m.id === id);
    const activityLog: ActivityLog = {
      id: generateId(),
      action: 'delete',
      target: 'family',
      targetId: id,
      summary: `移除家庭成员「${original?.name || ''}」`,
      userId: uid,
      userName: operator?.name,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const next = {
        familyMembers: state.familyMembers.filter((m) => m.id !== id),
        activityLogs: [activityLog, ...state.activityLogs].slice(0, 500)
      };
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

  getRecentActivity: (limit = 100) => {
    return [...get().activityLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  resetAll: () => {
    set({ ...defaults });
    saveToStorage(defaults);
  }
}));
