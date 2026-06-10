import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import { dayjs } from '@/utils';
import ImagePicker from '@/components/ImagePicker';

type FeedingType = 'breast' | 'formula' | 'bottle';

const FeedingEditPage: React.FC = () => {
  const router = useRouter();
  const addRecord = useBabyStore((s) => s.addRecord);

  const [type, setType] = useState<FeedingType>((router.params.type as FeedingType) || 'breast');
  const [recordTime, setRecordTime] = useState(dayjs().toISOString());
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Breast feeding
  const [side, setSide] = useState<'left' | 'right' | 'both'>('both');
  const [leftDuration, setLeftDuration] = useState(10);
  const [rightDuration, setRightDuration] = useState(10);
  const [timerSide, setTimerSide] = useState<'left' | 'right'>('left');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Formula
  const [powderAmount, setPowderAmount] = useState(4);
  const [waterAmount, setWaterAmount] = useState(120);
  const [waterTemp, setWaterTemp] = useState(45);
  const [brand, setBrand] = useState('爱他美');

  // Bottle
  const [milkType, setMilkType] = useState<'breast' | 'formula' | 'mixed'>('formula');
  const [amount, setAmount] = useState(120);
  const [bottleDuration, setBottleDuration] = useState(15);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    const mins = Math.round(timerSeconds / 60) || 1;
    if (timerSide === 'left') {
      setLeftDuration(mins);
      if (side === 'both') {
        setTimerSide('right');
        Taro.showToast({ title: '请切换到右侧', icon: 'none' });
      }
    } else {
      setRightDuration(mins);
    }
    setTimerSeconds(0);
  };

  const handleSave = () => {
    const now = recordTime;
    try {
      if (type === 'breast') {
        const total = (side === 'left' ? leftDuration : 0) + (side === 'right' ? rightDuration : 0) + (side === 'both' ? leftDuration + rightDuration : 0);
        addRecord({
          type: 'breast',
          side,
          leftDuration: side !== 'right' ? leftDuration : undefined,
          rightDuration: side !== 'left' ? rightDuration : undefined,
          totalDuration: total,
          time: now,
          note: note || undefined,
          photos: photos.length > 0 ? photos : undefined
        } as any);
      } else if (type === 'formula') {
        addRecord({
          type: 'formula',
          powderAmount,
          waterAmount,
          waterTemp,
          brand,
          time: now,
          note: note || undefined,
          photos: photos.length > 0 ? photos : undefined
        } as any);
      } else {
        addRecord({
          type: 'bottle',
          milkType,
          amount,
          duration: bottleDuration,
          time: now,
          note: note || undefined,
          photos: photos.length > 0 ? photos : undefined
        } as any);
      }
      Taro.showToast({ title: '记录成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 800);
    } catch (e) {
      console.error('[FeedingEdit] 保存失败:', e);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  const brands = ['爱他美', '飞鹤', 'A2', '美赞臣', '惠氏', '雀巢', '美素佳儿', '其他'];

  return (
    <View className={styles.page}>
      <View className={styles.typeTabs}>
        <View className={classnames(styles.typeTab, type === 'breast' && styles.active)} onClick={() => setType('breast')}>
          🤱 母乳
        </View>
        <View className={classnames(styles.typeTab, type === 'formula' && styles.active)} onClick={() => setType('formula')}>
          🍼 配方奶
        </View>
        <View className={classnames(styles.typeTab, type === 'bottle' && styles.active)} onClick={() => setType('bottle')}>
          🥛 瓶喂
        </View>
      </View>

      <View className={styles.timePicker} onClick={() => {
        Taro.showActionSheet({
          itemList: ['当前时间', '30分钟前', '1小时前', '2小时前', '自定义...'],
          success: (res) => {
            const now = dayjs();
            switch (res.tapIndex) {
              case 0: setRecordTime(now.toISOString()); break;
              case 1: setRecordTime(now.subtract(30, 'minute').toISOString()); break;
              case 2: setRecordTime(now.subtract(1, 'hour').toISOString()); break;
              case 3: setRecordTime(now.subtract(2, 'hour').toISOString()); break;
              case 4: Taro.showToast({ title: '日期选择器', icon: 'none' }); break;
            }
          }
        });
      }}>
        <Text className={styles.timeLabel}>🕒 记录时间</Text>
        <Text className={styles.timeValue}>{dayjs(recordTime).format('HH:mm')}</Text>
      </View>

      {type === 'breast' && (
        <>
          <View className={styles.card}>
            <View className={styles.sectionTitle}>👈 选择喂养侧</View>
            <View className={styles.sideSelector}>
              <View className={classnames(styles.sideBtn, side === 'left' && styles.active)} onClick={() => setSide('left')}>
                <View className={styles.icon}>⬅️</View>
                <View className={styles.label}>左侧</View>
              </View>
              <View className={classnames(styles.sideBtn, side === 'both' && styles.active)} onClick={() => setSide('both')}>
                <View className={styles.icon}>↔️</View>
                <View className={styles.label}>双侧</View>
              </View>
              <View className={classnames(styles.sideBtn, side === 'right' && styles.active)} onClick={() => setSide('right')}>
                <View className={styles.icon}>➡️</View>
                <View className={styles.label}>右侧</View>
              </View>
            </View>

            <View className={styles.sectionTitle}>⏱️ 计时器（{timerSide === 'left' ? '左侧' : '右侧'}）</View>
            <View className={styles.timerSection}>
              <View className={styles.timerDisplay}>{formatTimer(timerSeconds)}</View>
              <View className={styles.timerLabel}>
                {isRunning ? (isPaused ? '已暂停' : timerSide === 'left' ? '正在左侧喂奶...' : '正在右侧喂奶...') : '点击开始按钮计时'}
              </View>
              <View className={styles.timerBtns}>
                {!isRunning ? (
                  <View className={classnames(styles.timerBtn, styles.start)} onClick={handleStart}>开始</View>
                ) : (
                  <>
                    <View className={classnames(styles.timerBtn, styles.pause)} onClick={handlePause}>
                      {isPaused ? '继续' : '暂停'}
                    </View>
                    <View className={classnames(styles.timerBtn, styles.stop)} onClick={handleStop}>完成</View>
                  </>
                )}
              </View>
            </View>
          </View>

          <View className={styles.card}>
            <View className={styles.sectionTitle}>📊 手动调整时长</View>
            {side !== 'right' && (
              <View className={styles.durationRow}>
                <View className={styles.durationLabel}>
                  <Text>⬅️ 左侧时长</Text>
                </View>
                <View className={styles.durationInput}>
                  <View className={styles.durationBtn} onClick={() => setLeftDuration(Math.max(1, leftDuration - 1))}>－</View>
                  <View className={styles.durationValue}>{leftDuration}</View>
                  <View className={styles.durationBtn} onClick={() => setLeftDuration(leftDuration + 1)}>＋</View>
                  <View className={styles.durationUnit}>分钟</View>
                </View>
              </View>
            )}
            {side !== 'left' && (
              <View className={styles.durationRow}>
                <View className={styles.durationLabel}>
                  <Text>➡️ 右侧时长</Text>
                </View>
                <View className={styles.durationInput}>
                  <View className={styles.durationBtn} onClick={() => setRightDuration(Math.max(1, rightDuration - 1))}>－</View>
                  <View className={styles.durationValue}>{rightDuration}</View>
                  <View className={styles.durationBtn} onClick={() => setRightDuration(rightDuration + 1)}>＋</View>
                  <View className={styles.durationUnit}>分钟</View>
                </View>
              </View>
            )}
          </View>
        </>
      )}

      {type === 'formula' && (
        <View className={styles.card}>
          <View className={styles.sectionTitle}>🍼 冲调信息</View>
          <View className={styles.inputRow}>
            <Text className={styles.inputLabel}>💧 水量</Text>
            <View className={styles.stepper}>
              <View className={styles.stepBtn} onClick={() => setWaterAmount(Math.max(30, waterAmount - 10))}>－</View>
              <View>
                <Text className={styles.inputValue}>{waterAmount}</Text>
                <Text className={styles.inputUnit}> ml</Text>
              </View>
              <View className={styles.stepBtn} onClick={() => setWaterAmount(waterAmount + 10)}>＋</View>
            </View>
          </View>
          <View className={styles.inputRow}>
            <Text className={styles.inputLabel}>🥄 奶粉量</Text>
            <View className={styles.stepper}>
              <View className={styles.stepBtn} onClick={() => setPowderAmount(Math.max(1, powderAmount - 1))}>－</View>
              <View>
                <Text className={styles.inputValue}>{powderAmount}</Text>
                <Text className={styles.inputUnit}> 勺</Text>
              </View>
              <View className={styles.stepBtn} onClick={() => setPowderAmount(powderAmount + 1)}>＋</View>
            </View>
          </View>
          <View className={styles.inputRow}>
            <Text className={styles.inputLabel}>🌡️ 水温</Text>
            <View className={styles.stepper}>
              <View className={styles.stepBtn} onClick={() => setWaterTemp(Math.max(30, waterTemp - 1))}>－</View>
              <View>
                <Text className={styles.inputValue}>{waterTemp}</Text>
                <Text className={styles.inputUnit}> °C</Text>
              </View>
              <View className={styles.stepBtn} onClick={() => setWaterTemp(Math.min(70, waterTemp + 1))}>＋</View>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <Text className={styles.sectionTitle}>🏷️ 奶粉品牌</Text>
            <View className={styles.brandSelector}>
              {brands.map((b) => (
                <View key={b} className={classnames(styles.brandTag, brand === b && styles.active)} onClick={() => setBrand(b)}>
                  {b}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {type === 'bottle' && (
        <View className={styles.card}>
          <View className={styles.sectionTitle}>🥛 瓶喂信息</View>
          <View className={styles.milkTypeRow}>
            <View className={classnames(styles.milkTypeBtn, milkType === 'breast' && styles.active)} onClick={() => setMilkType('breast')}>
              <View className={styles.icon}>🤱</View>
              <View>母乳</View>
            </View>
            <View className={classnames(styles.milkTypeBtn, milkType === 'formula' && styles.active)} onClick={() => setMilkType('formula')}>
              <View className={styles.icon}>🍼</View>
              <View>配方奶</View>
            </View>
            <View className={classnames(styles.milkTypeBtn, milkType === 'mixed' && styles.active)} onClick={() => setMilkType('mixed')}>
              <View className={styles.icon}>🔀</View>
              <View>混合</View>
            </View>
          </View>
          <View className={styles.inputRow}>
            <Text className={styles.inputLabel}>📏 奶量</Text>
            <View className={styles.stepper}>
              <View className={styles.stepBtn} onClick={() => setAmount(Math.max(10, amount - 10))}>－</View>
              <View>
                <Text className={styles.inputValue}>{amount}</Text>
                <Text className={styles.inputUnit}> ml</Text>
              </View>
              <View className={styles.stepBtn} onClick={() => setAmount(amount + 10)}>＋</View>
            </View>
          </View>
          <View className={styles.inputRow}>
            <Text className={styles.inputLabel}>⏱️ 用时</Text>
            <View className={styles.stepper}>
              <View className={styles.stepBtn} onClick={() => setBottleDuration(Math.max(1, bottleDuration - 1))}>－</View>
              <View>
                <Text className={styles.inputValue}>{bottleDuration}</Text>
                <Text className={styles.inputUnit}> 分钟</Text>
              </View>
              <View className={styles.stepBtn} onClick={() => setBottleDuration(bottleDuration + 1)}>＋</View>
            </View>
          </View>
        </View>
      )}

      <View className={styles.card}>
        <View className={styles.textareaSection}>
          <View className={styles.textareaLabel}>📝 备注（异常情况等）</View>
          <Input
            className={styles.textarea}
            placeholder="如：吃奶情况、吐奶、异常表现等..."
            value={note}
            onInput={(e) => setNote(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📷 照片附件（可选，最多3张）</View>
        <ImagePicker photos={photos} onChange={setPhotos} maxCount={3} size={160} />
        <Text style={{ fontSize: 22, color: '#999', marginTop: 12, display: 'block' }}>
          可拍照记录喂奶姿势、奶量、宝宝状态等
        </Text>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.cancelBtn} onClick={() => Taro.navigateBack()}>取消</View>
        <View className={styles.saveBtn} onClick={handleSave}>保存记录</View>
      </View>
    </View>
  );
};

export default FeedingEditPage;
