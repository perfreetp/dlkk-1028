import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import { dayjs } from '@/utils';
import ImagePicker from '@/components/ImagePicker';

const commonFoods = ['米糊', '小米粥', '鸡蛋黄', '苹果泥', '香蕉泥', '胡萝卜泥', '南瓜泥', '西兰花', '菠菜泥', '肉泥', '鱼泥', '豆腐'];
const commonIngredients = ['大米', '小米', '鸡蛋', '苹果', '香蕉', '胡萝卜', '南瓜', '西兰花', '菠菜', '猪肉', '牛肉', '三文鱼', '豆腐'];
const allergyOptions = [
  { key: 'none', label: '无反应', emoji: '✅' },
  { key: 'rash', label: '皮疹', emoji: '🔴' },
  { key: 'vomit', label: '呕吐', emoji: '🤮' },
  { key: 'diarrhea', label: '腹泻', emoji: '💩' },
  { key: 'other', label: '其他', emoji: '⚠️' }
];

const FoodEditPage: React.FC = () => {
  const addRecord = useBabyStore((s) => s.addRecord);

  const [foodName, setFoodName] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [amount, setAmount] = useState(50);
  const [unit, setUnit] = useState('g');
  const [allergy, setAllergy] = useState<'none' | 'rash' | 'vomit' | 'diarrhea' | 'other'>('none');
  const [allergyDetail, setAllergyDetail] = useState('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [recordTime, setRecordTime] = useState(dayjs().toISOString());

  const toggleIngredient = (ing: string) => {
    setIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const addCustomIngredient = () => {
    if (customIngredient.trim() && !ingredients.includes(customIngredient.trim())) {
      setIngredients([...ingredients, customIngredient.trim()]);
      setCustomIngredient('');
    }
  };

  const handleSave = () => {
    try {
      const finalFoodName = foodName.trim() || (ingredients.length > 0 ? ingredients.join('+') : '辅食');
      addRecord({
        type: 'food',
        foodName: finalFoodName,
        ingredients: ingredients.length > 0 ? ingredients : [finalFoodName],
        amount,
        unit,
        allergyReaction: allergy,
        reactionDetail: allergyDetail || undefined,
        time: recordTime,
        note: note || undefined,
        photos: photos.length > 0 ? photos : undefined
      } as any);
      Taro.showToast({ title: '记录成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 800);
    } catch (e) {
      console.error('[FoodEdit] 保存失败:', e);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <View className={styles.sectionTitle}>🍽️ 辅食名称</View>
        <Input
          className={styles.inputField}
          placeholder="如：苹果泥米糊、蔬菜瘦肉粥等"
          value={foodName}
          onInput={(e) => setFoodName(e.detail.value)}
        />
        <View className={styles.quickFoods}>
          {commonFoods.map((f) => (
            <View
              key={f}
              className={classnames(styles.quickTag, foodName === f && styles.active)}
              onClick={() => setFoodName(f)}
            >
              {f}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>🥗 食材成分（已选 {ingredients.length} 种）</View>
        <View className={styles.ingredientGrid}>
          {commonIngredients.map((ing) => (
            <View
              key={ing}
              className={classnames(styles.ingredientTag, ingredients.includes(ing) && styles.selected)}
              onClick={() => toggleIngredient(ing)}
            >
              {ingredients.includes(ing) && '✓ '}{ing}
            </View>
          ))}
        </View>
        <View className={styles.customIngredientRow}>
          <Input
            className={styles.customInput}
            placeholder="添加其他食材..."
            value={customIngredient}
            onInput={(e) => setCustomIngredient(e.detail.value)}
            confirmType="done"
            onConfirm={addCustomIngredient}
          />
          <View className={styles.addBtn} onClick={addCustomIngredient}>添加</View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📏 食用量</View>
        <View className={styles.amountRow}>
          <View className={styles.stepper}>
            <View className={styles.stepBtn} onClick={() => setAmount(Math.max(5, amount - 5))}>－</View>
            <View>
              <Text className={styles.amountValue}>{amount}</Text>
            </View>
            <View className={styles.stepBtn} onClick={() => setAmount(amount + 5)}>＋</View>
          </View>
          <View className={styles.unitSelector}>
            {['g', 'ml', '勺', '碗'].map((u) => (
              <View
                key={u}
                className={classnames(styles.unitBtn, unit === u && styles.active)}
                onClick={() => setUnit(u)}
              >
                {u}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>🔍 过敏反应观察</View>
        <View className={styles.allergyGrid}>
          {allergyOptions.map((opt) => (
            <View
              key={opt.key}
              className={classnames(styles.allergyOption, allergy === opt.key && styles.selected)}
              onClick={() => setAllergy(opt.key as any)}
            >
              <Text style={{ fontSize: 36 }}>{opt.emoji}</Text>
              <Text>{opt.label}</Text>
            </View>
          ))}
        </View>
        {allergy !== 'none' && (
          <Input
            className={styles.inputField}
            placeholder="请描述具体反应和处理方式..."
            value={allergyDetail}
            onInput={(e) => setAllergyDetail(e.detail.value)}
          />
        )}
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📝 备注</View>
        <Input
          className={styles.textarea}
          placeholder="进食情况、宝宝喜好、特殊情况等..."
          value={note}
          onInput={(e) => setNote(e.detail.value)}
        />
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📷 照片附件（可选，最多3张）</View>
        <ImagePicker photos={photos} onChange={setPhotos} maxCount={3} size={160} />
        <Text style={{ fontSize: 22, color: '#999', marginTop: 12, display: 'block' }}>
          可拍照记录食物、餐盒、宝宝进食情况，方便日后回看
        </Text>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.cancelBtn} onClick={() => Taro.navigateBack()}>取消</View>
        <View className={styles.saveBtn} onClick={handleSave}>保存记录</View>
      </View>
    </View>
  );
};

export default FoodEditPage;
