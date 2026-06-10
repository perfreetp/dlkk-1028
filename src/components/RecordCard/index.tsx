import React, { useCallback } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { AllRecord } from '@/types';
import { formatTime, getRecordTypeLabel, getRecordTypeColor, getRelativeTime, formatDuration } from '@/utils';
import { useBabyStore } from '@/store';

interface RecordCardProps {
  record: AllRecord;
  onClick?: () => void;
  compact?: boolean;
}

const RecordCard: React.FC<RecordCardProps> = ({ record, onClick, compact }) => {
  const getMemberById = useBabyStore((s) => s.getMemberById);
  const member = getMemberById(record.createdBy);
  const typeColor = getRecordTypeColor(record.type);
  const typeLabel = getRecordTypeLabel(record.type);
  const photos = record.photos || [];

  const handlePreviewPhoto = useCallback((index: number, e: any) => {
    e.stopPropagation?.();
    Taro.previewImage({ current: photos[index], urls: photos });
  }, [photos]);

  const renderDetail = () => {
    switch (record.type) {
      case 'breast':
        const lr = record.leftDuration || 0;
        const rr = record.rightDuration || 0;
        return (
          <View className={styles.detailRow}>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>左侧</Text>
              <Text className={styles.detailValue}>{lr}分钟</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>右侧</Text>
              <Text className={styles.detailValue}>{rr}分钟</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>合计</Text>
              <Text className={styles.detailValue}>{record.totalDuration}分钟</Text>
            </View>
          </View>
        );
      case 'formula':
        return (
          <View className={styles.detailRow}>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>奶量</Text>
              <Text className={styles.detailValue}>{record.waterAmount}ml</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>奶粉</Text>
              <Text className={styles.detailValue}>{record.powderAmount}勺</Text>
            </View>
            {record.waterTemp && (
              <View className={styles.detailItem}>
                <Text className={styles.detailLabel}>水温</Text>
                <Text className={styles.detailValue}>{record.waterTemp}°C</Text>
              </View>
            )}
          </View>
        );
      case 'bottle':
        return (
          <View className={styles.detailRow}>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>奶量</Text>
              <Text className={styles.detailValue}>{record.amount}ml</Text>
            </View>
            {record.duration && (
              <View className={styles.detailItem}>
                <Text className={styles.detailLabel}>用时</Text>
                <Text className={styles.detailValue}>{record.duration}分钟</Text>
              </View>
            )}
          </View>
        );
      case 'food':
        return (
          <View className={styles.detailRow}>
            <View className={styles.detailItem} style={{ flex: 1 }}>
              <Text className={styles.detailLabel}>辅食</Text>
              <Text className={styles.detailValue}>{record.foodName}</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>份量</Text>
              <Text className={styles.detailValue}>{record.amount}{record.unit}</Text>
            </View>
          </View>
        );
      case 'diaper':
        const colorMap: Record<string, string> = {
          yellow: '金黄', green: '绿色', brown: '棕色', black: '黑色', red: '红色', other: '其他'
        };
        const textureMap: Record<string, string> = {
          normal: '正常', loose: '稀便', hard: '干结', watery: '水样', mucus: '黏液', other: '其他'
        };
        const typeMap: Record<string, string> = { pee: '小便', poop: '大便', both: '大小便' };
        return (
          <View className={styles.detailRow}>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>类型</Text>
              <Text className={styles.detailValue}>{typeMap[record.diaperType]}</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>颜色</Text>
              <Text className={styles.detailValue}>{colorMap[record.color]}</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>形态</Text>
              <Text className={styles.detailValue}>{textureMap[record.texture]}</Text>
            </View>
          </View>
        );
      case 'sleep':
        const qMap: Record<string, string> = { good: '好', normal: '一般', poor: '差' };
        return (
          <View className={styles.detailRow}>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>时长</Text>
              <Text className={styles.detailValue}>{formatDuration(record.duration)}</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>起止</Text>
              <Text className={styles.detailValue}>
                {formatTime(record.startTime)} - {record.endTime ? formatTime(record.endTime) : '--'}
              </Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>质量</Text>
              <Text className={styles.detailValue}>{qMap[record.quality]}</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className={classnames(styles.card, compact && styles.compact)} onClick={onClick}>
      <View className={styles.header}>
        <View className={styles.typeTag} style={{ backgroundColor: typeColor + '22', color: typeColor }}>
          {typeLabel}
        </View>
        <View className={styles.timeInfo}>
          <Text className={styles.time}>{formatTime(record.time)}</Text>
          <Text className={styles.relativeTime}>{getRelativeTime(record.time)}</Text>
        </View>
        {member && (
          <View className={styles.memberTag}>
            {member.name}
          </View>
        )}
      </View>
      {renderDetail()}
      {record.note && !compact && (
        <View className={styles.note}>
          <Text className={styles.noteLabel}>备注：</Text>
          <Text className={styles.noteText}>{record.note}</Text>
        </View>
      )}
      {photos.length > 0 && !compact && (
        <View className={styles.photos}>
          {photos.slice(0, 4).map((src, i) => (
            <View key={i} className={styles.photoItem} onClick={(e) => handlePreviewPhoto(i, e)}>
              <Image className={styles.photoImg} src={src} mode='aspectFill' />
              {i === 3 && photos.length > 4 && (
                <View className={styles.photoCount}>+{photos.length - 4}</View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default RecordCard;
