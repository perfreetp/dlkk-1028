import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import { dayjs } from '@/utils';
import type { ReminderType } from '@/types';

const typeOptions = [
  { key: 'vaccine' as ReminderType, label: '疫苗', emoji: '💉', quickTitles: ['乙肝疫苗', '百白破', '脊灰疫苗', '麻腮风', '流脑疫苗', '乙脑疫苗'] },
  { key: 'checkup' as ReminderType, label: '体检', emoji: '🏥', quickTitles: ['满月体检', '3个月体检', '6个月体检', '周岁体检', '视力筛查', '听力筛查'] },
  { key: 'feeding' as ReminderType, label: '喂奶', emoji: '🍼', quickTitles: ['该喂奶啦', '该换尿布了', '该吃辅食了', '喂维生素D', '喂益生菌'] },
  { key: 'custom' as ReminderType, label: '自定义', emoji: '⏰', quickTitles: ['洗澡时间', '户外活动', '亲子阅读', '吃水果', '量体温', '吃药'] }
];

const repeatOptions = [
  { key: 'none' as const, label: '不重复' },
  { key: 'daily' as const, label: '每天' },
  { key: 'weekly' as const, label: '每周' },
  { key: 'monthly' as const, label: '每月' }
];

const ReminderEditPage: React.FC = () => {
  const addReminder = useBabyStore((s) => s.addReminder);

  const [type, setType] = useState<ReminderType>('feeding');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [time, setTime] = useState('08:00');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [enabled, setEnabled] = useState(true);
  const [note, setNote] = useState('');

  const currentType = typeOptions.find((t) => t.key === type)!;

  const handleSave = () => {
    try {
      if (!title.trim()) {
        Taro.showToast({ title: '请输入提醒标题', icon: 'none' });
        return;
      }

      const fullTime = type === 'feeding'
        ? time
        : dayjs(`${date} ${time}`).format('YYYY-MM-DD HH:mm');

      addReminder({
        type,
        title: title.trim(),
        time: fullTime,
        repeat,
        enabled,
        note: note || undefined
      });
      Taro.showToast({ title: '提醒已创建', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 800);
    } catch (e) {
      console.error('[ReminderEdit] 保存失败:', e);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  const presetDates = [
    { label: '今天', value: dayjs().format('YYYY-MM-DD') },
    { label: '明天', value: dayjs().add(1, 'd').format('YYYY-MM-DD') },
    { label: '后天', value: dayjs().add(2, 'd').format('YYYY-MM-DD') },
    { label: '下周', value: dayjs().add(7, 'd').format('YYYY-MM-DD') }
  ];

  const presetTimes = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <View className={styles.sectionTitle}>🎯 提醒类型</View>
        <View className={styles.typeGrid}>
          {typeOptions.map((opt) => (
            <View
              key={opt.key}
              className={classnames(styles.typeOption, type === opt.key && styles.selected)}
              onClick={() => setType(opt.key)}
            >
              <Text className={styles.typeEmoji}>{opt.emoji}</Text>
              <Text className={styles.typeLabel}>{opt.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📝 提醒内容</View>
        <Input
          className={styles.inputField}
          placeholder="如：该喂维生素D了"
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
        />
        <View className={styles.quickTitles}>
          {currentType.quickTitles.map((t) => (
            <View
              key={t}
              className={styles.quickTag}
              onClick={() => setTitle(t)}
            >
              {t}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>
          {type === 'feeding' ? '⏰ 提醒时间' : '📅 提醒日期时间'}
        </View>
        {type !== 'feeding' && (
          <View className={styles.timeRow} style={{ marginBottom: 24 }}>
            <View className={styles.timeField}>
              <Text className={styles.timeLabel}>日期</Text>
              <View
                className={styles.timeValue}
                onClick={() => {
                  Taro.showActionSheet({
                    itemList: presetDates.map((p) => p.label),
                    success: (res) => setDate(presetDates[res.tapIndex].value)
                  });
                }}
              >
                {date}
              </View>
            </View>
          </View>
        )}
        <View className={styles.timeRow}>
          <View className={styles.timeField}>
            <Text className={styles.timeLabel}>时间</Text>
            <View
              className={styles.timeValue}
              onClick={() => {
                Taro.showActionSheet({
                  itemList: presetTimes,
                  success: (res) => setTime(presetTimes[res.tapIndex])
                });
              }}
            >
              {time}
            </View>
          </View>
        </View>
        {type !== 'feeding' && (
          <View className={styles.quickTitles} style={{ marginTop: 16 }}>
            {presetDates.map((p) => (
              <View
                key={p.value}
                className={styles.quickTag}
                onClick={() => setDate(p.value)}
              >
                {p.label}
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>🔁 重复周期</View>
        <View className={styles.repeatGrid}>
          {repeatOptions.map((opt) => (
            <View
              key={opt.key}
              className={classnames(styles.repeatOption, repeat === opt.key && styles.selected)}
              onClick={() => setRepeat(opt.key)}
            >
              {opt.label}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>⚙️ 设置</View>
        <View className={styles.toggleRow}>
          <Text className={styles.toggleLabel}>启用提醒</Text>
          <View
            className={classnames(styles.toggle, enabled && styles.active)}
            onClick={() => setEnabled(!enabled)}
          >
            <View className={styles.thumb} />
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📝 备注</View>
        <Input
          className={styles.textarea}
          placeholder="地点、注意事项、携带物品等..."
          value={note}
          onInput={(e) => setNote(e.detail.value)}
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.cancelBtn} onClick={() => Taro.navigateBack()}>取消</View>
        <View className={styles.saveBtn} onClick={handleSave}>创建提醒</View>
      </View>
    </View>
  );
};

export default ReminderEditPage;
