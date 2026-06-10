import React, { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import { dayjs } from '@/utils';
import type { SleepQuality } from '@/types';

const qualityOptions = [
  { key: 'good' as SleepQuality, label: '很好', emoji: '😴', desc: '一觉到天亮' },
  { key: 'normal' as SleepQuality, label: '一般', emoji: '😐', desc: '偶尔醒来' },
  { key: 'poor' as SleepQuality, label: '较差', emoji: '😟', desc: '频繁夜醒' }
];

const envTags = ['安静', '小夜灯', '白噪音', '有安抚', '开空调', '开窗', '抱睡', '奶睡'];

const SleepEditPage: React.FC = () => {
  const addRecord = useBabyStore((s) => s.addRecord);

  const [startTime, setStartTime] = useState(dayjs().toISOString());
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [quality, setQuality] = useState<SleepQuality>('normal');
  const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (isRunning) {
      timer = setInterval(() => {
        setLiveSeconds((s) => s + 60);
      }, 60000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning]);

  useEffect(() => {
    const totalMin = hours * 60 + minutes;
    setDuration(totalMin);
  }, [hours, minutes]);

  useEffect(() => {
    if (liveSeconds > 0) {
      const h = Math.floor(liveSeconds / 3600);
      const m = Math.floor((liveSeconds % 3600) / 60);
      setHours(h);
      setMinutes(m);
    }
  }, [liveSeconds]);

  const handleStart = () => {
    setStartTime(dayjs().toISOString());
    setEndTime('');
    setIsRunning(true);
    setLiveSeconds(0);
    Taro.showToast({ title: '已开始计时', icon: 'none' });
  };

  const handleEnd = () => {
    if (!isRunning) {
      Taro.showToast({ title: '尚未开始睡眠', icon: 'none' });
      return;
    }
    const end = dayjs();
    setEndTime(end.toISOString());
    const diff = Math.max(1, end.diff(dayjs(startTime), 'minute'));
    setHours(Math.floor(diff / 60));
    setMinutes(diff % 60);
    setIsRunning(false);
    Taro.showToast({ title: '已结束计时', icon: 'none' });
  };

  const toggleEnv = (tag: string) => {
    setSelectedEnvs((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    try {
      const finalDuration = duration > 0 ? duration : Math.max(1, hours * 60 + minutes);
      const finalEndTime = endTime || dayjs(startTime).add(finalDuration, 'minute').toISOString();
      const envText = selectedEnvs.length > 0 ? selectedEnvs.join('、') + (note ? '；' + note : '') : note;

      addRecord({
        type: 'sleep',
        startTime,
        endTime: finalEndTime,
        duration: finalDuration,
        quality,
        environment: envText || undefined,
        time: startTime,
        note: note || undefined
      } as any);
      Taro.showToast({ title: '记录成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 800);
    } catch (e) {
      console.error('[SleepEdit] 保存失败:', e);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  const formatDisplayDuration = () => {
    if (isRunning) {
      const h = Math.floor(liveSeconds / 3600);
      const m = Math.floor((liveSeconds % 3600) / 60);
      return { h, m, show: true };
    }
    return { h: hours, m: minutes, show: true };
  };

  const display = formatDisplayDuration();

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <View className={styles.quickActionRow}>
          <View className={styles.quickBtn} onClick={handleStart}>
            <Text className={styles.quickEmoji}>🌙</Text>
            <Text className={styles.quickLabel}>{isRunning ? '睡眠中...' : '开始睡眠'}</Text>
          </View>
          <View className={classnames(styles.quickBtn, styles.end)} onClick={handleEnd}>
            <Text className={styles.quickEmoji}>☀️</Text>
            <Text className={styles.quickLabel}>结束睡眠</Text>
          </View>
        </View>

        <View className={styles.timeRow}>
          <View className={styles.timeField}>
            <Text className={styles.timeLabel}>开始时间</Text>
            <View
              className={styles.timeValue}
              onClick={() => {
                const d = dayjs(startTime);
                Taro.showActionSheet({
                  itemList: ['现在', '30分钟前', '1小时前', '2小时前', '自定义...'],
                  success: (res) => {
                    if (res.tapIndex === 0) setStartTime(dayjs().toISOString());
                    else if (res.tapIndex === 1) setStartTime(dayjs().subtract(30, 'm').toISOString());
                    else if (res.tapIndex === 2) setStartTime(dayjs().subtract(1, 'h').toISOString());
                    else if (res.tapIndex === 3) setStartTime(dayjs().subtract(2, 'h').toISOString());
                  }
                });
              }}
            >
              {dayjs(startTime).format('MM-DD HH:mm')}
            </View>
          </View>
          <View className={styles.timeField}>
            <Text className={styles.timeLabel}>结束时间</Text>
            <View
              className={styles.timeValue}
              onClick={() => {
                const d = endTime || dayjs().toISOString();
                Taro.showActionSheet({
                  itemList: ['现在', '30分钟后', '1小时后', '2小时后', '自定义...'],
                  success: (res) => {
                    if (res.tapIndex === 0) setEndTime(dayjs().toISOString());
                    else if (res.tapIndex === 1) setEndTime(dayjs().add(30, 'm').toISOString());
                    else if (res.tapIndex === 2) setEndTime(dayjs().add(1, 'h').toISOString());
                    else if (res.tapIndex === 3) setEndTime(dayjs().add(2, 'h').toISOString());
                  }
                });
              }}
            >
              {endTime ? dayjs(endTime).format('MM-DD HH:mm') : '未结束'}
            </View>
          </View>
        </View>

        <View className={styles.durationCard}>
          {display.show && (
            <>
              <View>
                <Text className={styles.durationValue}>
                  {display.h}
                  <Text className={styles.durationUnit}>小时</Text>
                  {display.m > 0 && (
                    <>
                      {' '}{display.m}
                      <Text className={styles.durationUnit}>分钟</Text>
                    </>
                  )}
                </Text>
              </View>
              <Text className={styles.durationHint}>
                {isRunning ? '⏱️ 正在计时中，点击结束完成记录' : '也可以用下方加减器手动调整'}
              </Text>
            </>
          )}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>⏱️ 手动调整时长</View>
        <View className={styles.stepperRow}>
          <Text className={styles.stepperLabel}>小时</Text>
          <View className={styles.stepper}>
            <View className={styles.stepBtn} onClick={() => setHours(Math.max(0, hours - 1))}>－</View>
            <View className={styles.stepValue}>
              {hours}
              <Text className={styles.unit}>h</Text>
            </View>
            <View className={styles.stepBtn} onClick={() => setHours(hours + 1)}>＋</View>
          </View>
        </View>
        <View className={styles.stepperRow}>
          <Text className={styles.stepperLabel}>分钟</Text>
          <View className={styles.stepper}>
            <View className={styles.stepBtn} onClick={() => setMinutes(Math.max(0, minutes - 10))}>－</View>
            <View className={styles.stepValue}>
              {minutes}
              <Text className={styles.unit}>min</Text>
            </View>
            <View className={styles.stepBtn} onClick={() => setMinutes(Math.min(59, minutes + 10))}>＋</View>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>💤 睡眠质量</View>
        <View className={styles.qualityGrid}>
          {qualityOptions.map((opt) => (
            <View
              key={opt.key}
              className={classnames(styles.qualityOption, quality === opt.key && styles.selected)}
              onClick={() => setQuality(opt.key)}
            >
              <Text className={styles.qualityEmoji}>{opt.emoji}</Text>
              <Text className={styles.qualityLabel}>{opt.label}</Text>
              <Text className={styles.qualityDesc}>{opt.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>🏠 睡眠环境（可多选）</View>
        <View className={styles.envTags}>
          {envTags.map((tag) => (
            <View
              key={tag}
              className={classnames(styles.envTag, selectedEnvs.includes(tag) && styles.active)}
              onClick={() => toggleEnv(tag)}
            >
              {tag}
            </View>
          ))}
        </View>
        <Input
          className={styles.textarea}
          placeholder="其他环境备注、夜醒次数、安抚情况等..."
          value={note}
          onInput={(e) => setNote(e.detail.value)}
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.cancelBtn} onClick={() => Taro.navigateBack()}>取消</View>
        <View className={styles.saveBtn} onClick={handleSave}>保存记录</View>
      </View>
    </View>
  );
};

export default SleepEditPage;
