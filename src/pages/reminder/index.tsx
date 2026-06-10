import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import { dayjs } from '@/utils';
import type { ReminderType } from '@/types';

const typeTabs = [
  { key: 'all', label: '全部' },
  { key: 'vaccine', label: '疫苗', icon: '💉' },
  { key: 'checkup', label: '体检', icon: '🏥' },
  { key: 'feeding', label: '喂奶', icon: '🍼' },
  { key: 'custom', label: '自定义', icon: '📌' }
];

const vaccineSchedule = [
  { name: '乙肝疫苗', scheduled: dayjs().add(5, 'day'), status: 'pending' },
  { name: 'A群流脑多糖疫苗', scheduled: dayjs().add(30, 'day'), status: 'pending' },
  { name: '麻腮风疫苗', scheduled: dayjs().subtract(10, 'day'), status: 'overdue' },
  { name: '百白破疫苗', scheduled: dayjs().subtract(60, 'day'), status: 'done' },
  { name: '脊灰灭活疫苗', scheduled: dayjs().subtract(90, 'day'), status: 'done' }
];

const ReminderPage: React.FC = () => {
  const reminders = useBabyStore((s) => s.reminders);
  const toggleReminder = useBabyStore((s) => s.toggleReminder);
  const completeReminder = useBabyStore((s) => s.completeReminder);

  const [activeType, setActiveType] = useState<string>('all');

  const filteredReminders = useMemo(() => {
    let list = reminders;
    if (activeType !== 'all') {
      list = list.filter((r) => r.type === activeType);
    }
    return list.sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return a.time.localeCompare(b.time);
    });
  }, [reminders, activeType]);

  const repeatLabel: Record<string, string> = {
    none: '一次性',
    daily: '每天',
    weekly: '每周',
    monthly: '每月'
  };

  const typeIcon: Record<ReminderType, string> = {
    vaccine: '💉',
    checkup: '🏥',
    feeding: '🍼',
    custom: '📌'
  };

  const handleToggle = (id: string) => {
    toggleReminder(id);
  };

  const handleComplete = (id: string) => {
    completeReminder(id);
    Taro.showToast({ title: '已标记完成', icon: 'success' });
  };

  const handleAdd = () => {
    Taro.navigateTo({ url: '/pages/reminder-edit/index' });
  };

  const handleEdit = (id: string) => {
    Taro.showToast({ title: '编辑提醒', icon: 'none' });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.headerCard}>
        <View className={styles.headerInfo}>
          <View className={styles.title}>提醒中心</View>
          <View className={styles.desc}>今日有 {reminders.filter(r => !r.completed && r.enabled).length} 条待办提醒</View>
        </View>
        <View className={styles.headerIcon}>🔔</View>
      </View>

      <View className={styles.typeTabs}>
        {typeTabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.typeTab, activeType === tab.key && styles.active)}
            onClick={() => setActiveType(tab.key)}
          >
            {tab.icon && <Text style={{ marginRight: 8 }}>{tab.icon}</Text>}
            {tab.label}
          </View>
        ))}
      </View>

      <View className={styles.sectionTitle}>
        <Text>我的提醒</Text>
        <Text className={styles.count}>共 {filteredReminders.length} 条</Text>
        <Text className={styles.addBtn} onClick={handleAdd}>＋ 新增</Text>
      </View>

      {filteredReminders.length === 0 ? (
        <View className={styles.emptyCard}>
          <Text className={styles.emptyIcon}>⏰</Text>
          <Text className={styles.emptyText}>暂无提醒，点击右上角+号添加</Text>
        </View>
      ) : (
        filteredReminders.map((reminder) => (
          <View
            key={reminder.id}
            className={classnames(styles.reminderCard, reminder.completed && styles.completed)}
          >
            <View className={classnames(styles.reminderIcon, reminder.type)}>
              {typeIcon[reminder.type]}
            </View>
            <View className={styles.reminderContent}>
              <View className={styles.reminderHeader}>
                <Text className={styles.reminderTitle}>{reminder.title}</Text>
                <View
                  className={classnames(styles.reminderSwitch, reminder.enabled && styles.active)}
                  onClick={() => handleToggle(reminder.id)}
                />
              </View>
              <View className={styles.reminderTime}>
                <Text className={styles.timeValue}>{reminder.time}</Text>
                <Text className={styles.repeatTag}>{repeatLabel[reminder.repeat]}</Text>
              </View>
              {reminder.note && (
                <Text className={styles.reminderNote}>📍 {reminder.note}</Text>
              )}
              <View className={styles.reminderActions}>
                {!reminder.completed && (
                  <View className={classnames(styles.actionBtn, styles.done)} onClick={() => handleComplete(reminder.id)}>
                    ✓ 标记完成
                  </View>
                )}
                <View className={classnames(styles.actionBtn, styles.edit)} onClick={() => handleEdit(reminder.id)}>
                  编辑
                </View>
              </View>
            </View>
          </View>
        ))
      )}

      <View className={styles.sectionTitle} style={{ marginTop: 16 }}>
        <Text>💉 疫苗接种计划</Text>
      </View>

      {vaccineSchedule.map((v, idx) => (
        <View key={idx} className={styles.vaccineCard}>
          <View className={styles.vaccineHeader}>
            <Text className={styles.vaccineName}>{v.name}</Text>
            <View className={classnames(styles.vaccineStatus, v.status)}>
              {v.status === 'done' ? '✓ 已接种' : v.status === 'pending' ? '待接种' : '⚠ 已逾期'}
            </View>
          </View>
          <View className={styles.vaccineDate}>
            <Text className={styles.label}>预约日期：</Text>
            <Text>{dayjs(v.scheduled).format('YYYY年MM月DD日')}</Text>
            <Text style={{ marginLeft: 16, color: v.status === 'pending' ? '#FAAD14' : v.status === 'overdue' ? '#FF4D4F' : '#52C41A' }}>
              ({dayjs(v.scheduled).fromNow()})
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default ReminderPage;
