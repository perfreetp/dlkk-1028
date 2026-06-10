import React, { useState, useMemo } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import { dayjs, calcBMI } from '@/utils';

const GrowthEditPage: React.FC = () => {
  const addGrowthRecord = useBabyStore((s) => s.addGrowthRecord);
  const growthRecords = useBabyStore((s) => s.growthRecords);

  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [headC, setHeadC] = useState<string>('');
  const [note, setNote] = useState('');

  const sortedRecords = useMemo(() => {
    return [...growthRecords].sort((a, b) =>
      dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1
    );
  }, [growthRecords]);

  const lastRecord = sortedRecords[sortedRecords.length - 1];

  const bmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      return calcBMI(w, h);
    }
    return null;
  }, [height, weight]);

  const getBMIStatus = (bmi: number) => {
    if (bmi < 15) return { label: '偏瘦', color: '#FFD93D' };
    if (bmi < 18) return { label: '正常', color: '#6BCB77' };
    if (bmi < 20) return { label: '偏重', color: '#FF9F43' };
    return { label: '肥胖', color: '#FF6B6B' };
  };

  const handleSave = () => {
    try {
      const hVal = parseFloat(height) || undefined;
      const wVal = parseFloat(weight) || undefined;
      const cVal = parseFloat(headC) || undefined;

      if (!hVal && !wVal && !cVal) {
        Taro.showToast({ title: '请至少填写一项', icon: 'none' });
        return;
      }

      addGrowthRecord({
        date,
        height: hVal,
        weight: wVal,
        headCircumference: cVal,
        note: note || undefined
      });
      Taro.showToast({ title: '记录成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 800);
    } catch (e) {
      console.error('[GrowthEdit] 保存失败:', e);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  const adjustValue = (
    setter: (v: string) => void,
    current: string,
    delta: number,
    decimals = 1
  ) => {
    const v = parseFloat(current) || 0;
    const newVal = Math.max(0, v + delta);
    setter(newVal.toFixed(decimals));
  };

  const diffText = (current: string | undefined, last: number | undefined, unit: string) => {
    if (!current || !last) return '';
    const diff = parseFloat(current) - last;
    if (Math.abs(diff) < 0.01) return `上次: ${last}${unit}`;
    const sign = diff > 0 ? '↑' : '↓';
    return `${sign}${Math.abs(diff).toFixed(1)}${unit} (上次:${last}${unit})`;
  };

  const presets = [
    { label: '今天', value: dayjs().format('YYYY-MM-DD') },
    { label: '昨天', value: dayjs().subtract(1, 'd').format('YYYY-MM-DD') },
    { label: '上周', value: dayjs().subtract(7, 'd').format('YYYY-MM-DD') },
    { label: '上月', value: dayjs().subtract(1, 'M').format('YYYY-MM-DD') }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <View className={styles.sectionTitle}>📅 测量日期</View>
        <View
          className={styles.dateRow}
          onClick={() => {
            Taro.showActionSheet({
              itemList: presets.map((p) => p.label),
              success: (res) => {
                setDate(presets[res.tapIndex].value);
              }
            });
          }}
        >
          <Text className={styles.dateLabel}>点击选择日期</Text>
          <Text className={styles.dateValue}>{date}</Text>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📏 测量数据</View>
        <View className={styles.measureGrid}>
          <View className={styles.measureItem}>
            <View className={styles.measureHeader}>
              <View
                className={styles.measureIcon}
                style={{ background: 'rgba(255, 139, 167, 0.15)' }}
              >
                📐
              </View>
              <Text className={styles.measureName}>身高</Text>
              <Text className={styles.measureHint}>站立/仰卧位</Text>
            </View>
            <View className={styles.measureInputRow}>
              <View className={styles.stepper}>
                <View
                  className={styles.stepBtn}
                  onClick={() => adjustValue(setHeight, height, -0.5)}
                >
                  －
                </View>
              </View>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.measureValue}
                  type="digit"
                  value={height}
                  placeholder="0.0"
                  onInput={(e) => setHeight(e.detail.value)}
                />
                <Text className={styles.measureUnit}>cm</Text>
              </View>
              <View className={styles.stepper}>
                <View
                  className={styles.stepBtn}
                  onClick={() => adjustValue(setHeight, height, 0.5)}
                >
                  ＋
                </View>
              </View>
            </View>
            {lastRecord?.height && (
              <View className={styles.lastRecord}>
                <Text className={styles.lastLabel}>对比上次</Text>
                <Text className={styles.lastValue}>
                  {diffText(height, lastRecord.height, 'cm')}
                </Text>
              </View>
            )}
          </View>

          <View className={styles.measureItem}>
            <View className={styles.measureHeader}>
              <View
                className={styles.measureIcon}
                style={{ background: 'rgba(255, 217, 61, 0.2)' }}
              >
                ⚖️
              </View>
              <Text className={styles.measureName}>体重</Text>
              <Text className={styles.measureHint}>净重</Text>
            </View>
            <View className={styles.measureInputRow}>
              <View className={styles.stepper}>
                <View
                  className={styles.stepBtn}
                  onClick={() => adjustValue(setWeight, weight, -0.1)}
                >
                  －
                </View>
              </View>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.measureValue}
                  type="digit"
                  value={weight}
                  placeholder="0.0"
                  onInput={(e) => setWeight(e.detail.value)}
                />
                <Text className={styles.measureUnit}>kg</Text>
              </View>
              <View className={styles.stepper}>
                <View
                  className={styles.stepBtn}
                  onClick={() => adjustValue(setWeight, weight, 0.1)}
                >
                  ＋
                </View>
              </View>
            </View>
            {lastRecord?.weight && (
              <View className={styles.lastRecord}>
                <Text className={styles.lastLabel}>对比上次</Text>
                <Text className={styles.lastValue}>
                  {diffText(weight, lastRecord.weight, 'kg')}
                </Text>
              </View>
            )}
          </View>

          <View className={styles.measureItem}>
            <View className={styles.measureHeader}>
              <View
                className={styles.measureIcon}
                style={{ background: 'rgba(195, 174, 214, 0.25)' }}
              >
                🧠
              </View>
              <Text className={styles.measureName}>头围</Text>
              <Text className={styles.measureHint}>眉弓-枕骨粗隆</Text>
            </View>
            <View className={styles.measureInputRow}>
              <View className={styles.stepper}>
                <View
                  className={styles.stepBtn}
                  onClick={() => adjustValue(setHeadC, headC, -0.5)}
                >
                  －
                </View>
              </View>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.measureValue}
                  type="digit"
                  value={headC}
                  placeholder="0.0"
                  onInput={(e) => setHeadC(e.detail.value)}
                />
                <Text className={styles.measureUnit}>cm</Text>
              </View>
              <View className={styles.stepper}>
                <View
                  className={styles.stepBtn}
                  onClick={() => adjustValue(setHeadC, headC, 0.5)}
                >
                  ＋
                </View>
              </View>
            </View>
            {lastRecord?.headCircumference && (
              <View className={styles.lastRecord}>
                <Text className={styles.lastLabel}>对比上次</Text>
                <Text className={styles.lastValue}>
                  {diffText(headC, lastRecord.headCircumference, 'cm')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {bmi !== null && (
        <View className={styles.card}>
          <View className={styles.bmiCard}>
            <Text className={styles.bmiLabel}>BMI 指数（身高体重比）</Text>
            <Text className={styles.bmiValue}>{bmi.toFixed(1)}</Text>
            <Text
              className={styles.bmiStatus}
              style={{
                background: `rgba(${getBMIStatus(bmi).color}, 0.2)`,
                color: getBMIStatus(bmi).color
              }}
            >
              {getBMIStatus(bmi).label}
            </Text>
          </View>
        </View>
      )}

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📝 备注</View>
        <Input
          className={styles.textarea}
          placeholder="测量方式、医院体检、医生建议等..."
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

export default GrowthEditPage;
