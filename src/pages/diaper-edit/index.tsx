import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import { dayjs } from '@/utils';
import type { DiaperType, DiaperColor, DiaperTexture } from '@/types';
import ImagePicker from '@/components/ImagePicker';

const typeOptions = [
  { key: 'pee' as DiaperType, label: '小便', emoji: '💧' },
  { key: 'poop' as DiaperType, label: '大便', emoji: '💩' },
  { key: 'both' as DiaperType, label: '大小便', emoji: '💧💩' }
];

const colorOptions = [
  { key: 'yellow' as DiaperColor, name: '黄色', color: '#FFD93D' },
  { key: 'green' as DiaperColor, name: '绿色', color: '#6BCB77' },
  { key: 'brown' as DiaperColor, name: '棕色', color: '#A0522D' },
  { key: 'black' as DiaperColor, name: '黑色', color: '#333333' },
  { key: 'red' as DiaperColor, name: '红色', color: '#FF6B6B' },
  { key: 'other' as DiaperColor, name: '其他', color: '#CCCCCC' }
];

const textureOptions = [
  { key: 'normal' as DiaperTexture, label: '正常' },
  { key: 'loose' as DiaperTexture, label: '偏稀' },
  { key: 'hard' as DiaperTexture, label: '偏干' },
  { key: 'watery' as DiaperTexture, label: '水样' },
  { key: 'mucus' as DiaperTexture, label: '黏液' },
  { key: 'other' as DiaperTexture, label: '其他' }
];

const amountOptions = [
  { key: 'little' as const, label: '少量', desc: '轻微浸湿' },
  { key: 'medium' as const, label: '中量', desc: '正常量' },
  { key: 'large' as const, label: '大量', desc: '满满一片' }
];

const DiaperEditPage: React.FC = () => {
  const addRecord = useBabyStore((s) => s.addRecord);

  const [diaperType, setDiaperType] = useState<DiaperType>('pee');
  const [color, setColor] = useState<DiaperColor>('yellow');
  const [texture, setTexture] = useState<DiaperTexture>('normal');
  const [amount, setAmount] = useState<'little' | 'medium' | 'large'>('medium');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [recordTime, setRecordTime] = useState(dayjs().toISOString());

  const handleSave = () => {
    try {
      addRecord({
        type: 'diaper',
        diaperType,
        color,
        texture,
        amount,
        time: recordTime,
        note: note || undefined,
        photos: photos.length > 0 ? photos : undefined
      } as any);
      Taro.showToast({ title: '记录成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 800);
    } catch (e) {
      console.error('[DiaperEdit] 保存失败:', e);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <View className={styles.sectionTitle}>🧷 尿布类型</View>
        <View className={styles.typeGrid}>
          {typeOptions.map((opt) => (
            <View
              key={opt.key}
              className={classnames(styles.typeOption, diaperType === opt.key && styles.selected)}
              onClick={() => setDiaperType(opt.key)}
            >
              <Text className={styles.typeEmoji}>{opt.emoji}</Text>
              <Text className={styles.typeLabel}>{opt.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.colorSection}>
          <View className={styles.sectionTitle}>🎨 颜色观察</View>
          <View className={styles.colorGrid}>
            {colorOptions.map((opt) => (
              <View key={opt.key} style={{ position: 'relative', paddingBottom: 40 }}>
                <View
                  className={classnames(styles.colorOption, color === opt.key && styles.selected)}
                  onClick={() => setColor(opt.key)}
                >
                  <View className={styles.colorDot} style={{ backgroundColor: opt.color }} />
                </View>
                <Text className={styles.colorName}>{opt.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <View className={styles.sectionTitle}>📊 形态</View>
          <View className={styles.textureGrid}>
            {textureOptions.map((opt) => (
              <View
                key={opt.key}
                className={classnames(styles.textureOption, texture === opt.key && styles.selected)}
                onClick={() => setTexture(opt.key)}
              >
                {opt.label}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>⚖️ 用量</View>
        <View className={styles.amountSelector}>
          {amountOptions.map((opt) => (
            <View
              key={opt.key}
              className={classnames(styles.amountBtn, amount === opt.key && styles.selected)}
              onClick={() => setAmount(opt.key)}
            >
              <Text className={styles.amountLabel}>{opt.label}</Text>
              <Text className={styles.amountDesc}>{opt.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📝 异常备注</View>
        <Input
          className={styles.textarea}
          placeholder="颜色异常、有异味、带血丝、腹泻等情况..."
          value={note}
          onInput={(e) => setNote(e.detail.value)}
        />
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📷 照片附件（可选，最多3张）</View>
        <ImagePicker photos={photos} onChange={setPhotos} maxCount={3} size={160} />
        <Text style={{ fontSize: 22, color: '#999', marginTop: 12, display: 'block' }}>
          支持拍照或从相册选择，点击照片可预览，×号可删除
        </Text>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.cancelBtn} onClick={() => Taro.navigateBack()}>取消</View>
        <View className={styles.saveBtn} onClick={handleSave}>保存记录</View>
      </View>
    </View>
  );
};

export default DiaperEditPage;
