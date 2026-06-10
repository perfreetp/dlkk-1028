export type RecordType = 'breast' | 'formula' | 'bottle' | 'food' | 'diaper' | 'sleep';

export type BreastSide = 'left' | 'right' | 'both';

export type DiaperType = 'pee' | 'poop' | 'both';
export type DiaperColor = 'yellow' | 'green' | 'brown' | 'black' | 'red' | 'other';
export type DiaperTexture = 'normal' | 'loose' | 'hard' | 'watery' | 'mucus' | 'other';

export type SleepQuality = 'good' | 'normal' | 'poor';

export type ReminderType = 'vaccine' | 'checkup' | 'feeding' | 'custom';

export interface Baby {
  id: string;
  name: string;
  avatar?: string;
  gender: 'boy' | 'girl';
  birthday: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'mom' | 'dad' | 'grandma' | 'grandpa' | 'nanny' | 'other';
  roleName: string;
  canEdit: boolean;
}

export interface BaseRecord {
  id: string;
  type: RecordType;
  time: string;
  note?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export type ActivityAction = 'add' | 'update' | 'delete' | 'complete' | 'toggle' | 'join_family' | 'switch_user' | 'change_permission';
export type ActivityTarget = 'record' | 'growth' | 'reminder' | 'family' | 'permission';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  target: ActivityTarget;
  targetId?: string;
  targetType?: string;
  summary?: string;
  userId: string;
  userName?: string;
  createdAt: string;
}

export interface BreastFeedingRecord extends BaseRecord {
  type: 'breast';
  side: BreastSide;
  leftDuration?: number;
  rightDuration?: number;
  totalDuration: number;
}

export interface FormulaFeedingRecord extends BaseRecord {
  type: 'formula';
  powderAmount: number;
  waterAmount: number;
  waterTemp?: number;
  brand?: string;
}

export interface BottleFeedingRecord extends BaseRecord {
  type: 'bottle';
  milkType: 'breast' | 'formula' | 'mixed';
  amount: number;
  duration?: number;
}

export interface FoodRecord extends BaseRecord {
  type: 'food';
  foodName: string;
  ingredients: string[];
  amount: number;
  unit: string;
  allergyReaction?: 'none' | 'rash' | 'vomit' | 'diarrhea' | 'other';
  reactionDetail?: string;
}

export interface DiaperRecord extends BaseRecord {
  type: 'diaper';
  diaperType: DiaperType;
  color: DiaperColor;
  texture: DiaperTexture;
  amount?: 'little' | 'medium' | 'large';
}

export interface SleepRecord extends BaseRecord {
  type: 'sleep';
  startTime: string;
  endTime?: string;
  duration: number;
  quality: SleepQuality;
  environment?: string;
}

export type FeedingRecord = BreastFeedingRecord | FormulaFeedingRecord | BottleFeedingRecord;
export type AllRecord = FeedingRecord | FoodRecord | DiaperRecord | SleepRecord;

export interface GrowthRecord {
  id: string;
  date: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
  note?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  time: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  note?: string;
  completed?: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface Vaccination {
  id: string;
  name: string;
  scheduledDate: string;
  completed: boolean;
  completedDate?: string;
  note?: string;
}

export interface DailyStats {
  date: string;
  feedingCount: number;
  feedingTotalAmount: number;
  breastTotalDuration: number;
  foodCount: number;
  diaperCount: number;
  sleepTotalDuration: number;
  sleepCount: number;
}

export interface HistoryStack {
  records: AllRecord[];
  cursor: number;
}
