import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import RecordCard from '@/components/RecordCard';
import { formatDate, dayjs, formatDuration } from '@/utils';

const typeTabs = [
  { key: 'all', label: '全部' },
  { key: 'feeding', label: '喂奶' },
  { key: 'food', label: '辅食' },
  { key: 'diaper', label: '尿布' },
  { key: 'sleep', label: '睡眠' }
];

const RecordPage: React.FC = () => {
  const records = useBabyStore((s) => s.records);
  const getDailyStats = useBabyStore((s) => s.getDailyStats);
  const getPeriodSummary = useBabyStore((s) => s.getPeriodSummary);
  const getRecordsByDateRange = useBabyStore((s) => s.getRecordsByDateRange);
  const deleteRecord = useBabyStore((s) => s.deleteRecord);

  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [periodTab, setPeriodTab] = useState<'today' | 'week' | 'month'>('today');
  const [showFab, setShowFab] = useState(false);

  const currentSummary = useMemo(() => {
    if (periodTab === 'today') {
      const s = getDailyStats(selectedDate);
      return { ...s, startDate: selectedDate, endDate: selectedDate, dayCount: 1 };
    }
    if (periodTab === 'week') {
      return getPeriodSummary('week', selectedDate);
    }
    return getPeriodSummary('month', selectedDate);
  }, [periodTab, selectedDate, getDailyStats, getPeriodSummary]);

  const filteredRecords = useMemo(() => {
    let list: typeof records;
    if (periodTab === 'today') {
      list = records.filter((r) => formatDate(r.time) === selectedDate);
    } else {
      list = getRecordsByDateRange(currentSummary.startDate, currentSummary.endDate);
    }
    if (activeTab === 'feeding') {
      list = list.filter((r) => ['breast', 'formula', 'bottle'].includes(r.type));
    } else if (activeTab !== 'all') {
      list = list.filter((r) => r.type === activeTab);
    }
    return list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [records, periodTab, selectedDate, activeTab, currentSummary, getRecordsByDateRange]);

  const stats = useMemo(() => currentSummary, [currentSummary]);

  const handleDateChange = () => {
    Taro.showActionSheet({
      itemList: ['今天', '昨天', '前天', '自定义日期...'],
      success: (res) => {
        const now = dayjs();
        switch (res.tapIndex) {
          case 0:
            setSelectedDate(now.format('YYYY-MM-DD'));
            break;
          case 1:
            setSelectedDate(now.subtract(1, 'day').format('YYYY-MM-DD'));
            break;
          case 2:
            setSelectedDate(now.subtract(2, 'day').format('YYYY-MM-DD'));
            break;
          case 3:
            Taro.showToast({ title: '日期选择器', icon: 'none' });
            break;
        }
      }
    });
  };

  const handleRecordClick = (recordId: string) => {
    Taro.showActionSheet({
      itemList: ['查看详情', '编辑记录', '删除记录'],
      success: (res) => {
        if (res.tapIndex === 2) {
          Taro.showModal({
            title: '确认删除',
            content: '删除后不可恢复，确定要删除这条记录吗？',
            success: (modalRes) => {
              if (modalRes.confirm) {
                deleteRecord(recordId);
                Taro.showToast({ title: '已删除', icon: 'success' });
              }
            }
          });
        } else if (res.tapIndex === 1) {
          Taro.showToast({ title: '编辑功能', icon: 'none' });
        }
      }
    });
  };

  const handleAddRecord = (type: string) => {
    const pageMap: Record<string, string> = {
      breast: '/pages/feeding-edit/index?type=breast',
      formula: '/pages/feeding-edit/index?type=formula',
      bottle: '/pages/feeding-edit/index?type=bottle',
      food: '/pages/food-edit/index',
      diaper: '/pages/diaper-edit/index',
      sleep: '/pages/sleep-edit/index'
    };
    const url = pageMap[type];
    if (url) {
      setShowFab(false);
      Taro.navigateTo({ url });
    }
  };

  const fabItems = [
    { key: 'breast', icon: '🤱', label: '母乳' },
    { key: 'formula', icon: '🍼', label: '配方奶' },
    { key: 'bottle', icon: '🥛', label: '瓶喂' },
    { key: 'food', icon: '🥣', label: '辅食' },
    { key: 'diaper', icon: '👶', label: '尿布' },
    { key: 'sleep', icon: '😴', label: '睡眠' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        {typeTabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      <View className={styles.filterBar}>
        <View className={styles.datePicker} onClick={handleDateChange}>
          <Text>📅</Text>
          <Text>{selectedDate === dayjs().format('YYYY-MM-DD') ? '今天' : selectedDate}</Text>
        </View>
        <View style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <View
            style={{
              padding: '6rpx 20rpx',
              borderRadius: 20,
              fontSize: 24,
              background: periodTab === 'today' ? '#FF8BA7' : '#f5f5f5',
              color: periodTab === 'today' ? '#fff' : '#666'
            }}
            onClick={() => setPeriodTab('today')}
          >今日</View>
          <View
            style={{
              padding: '6rpx 20rpx',
              borderRadius: 20,
              fontSize: 24,
              background: periodTab === 'week' ? '#FF8BA7' : '#f5f5f5',
              color: periodTab === 'week' ? '#fff' : '#666'
            }}
            onClick={() => setPeriodTab('week')}
          >本周</View>
          <View
            style={{
              padding: '6rpx 20rpx',
              borderRadius: 20,
              fontSize: 24,
              background: periodTab === 'month' ? '#FF8BA7' : '#f5f5f5',
              color: periodTab === 'month' ? '#fff' : '#666'
            }}
            onClick={() => setPeriodTab('month')}
          >本月</View>
        </View>
        <View className={styles.filterActions}>
          <View className={styles.filterBtn} onClick={() => Taro.showToast({ title: '搜索', icon: 'none' })}>
            🔍 搜索
          </View>
          <View className={styles.filterBtn} onClick={() => Taro.showToast({ title: '导出', icon: 'none' })}>
            📤 导出
          </View>
        </View>
      </View>

      <ScrollView scrollY>
        <View className={styles.statsSummary}>
          <View className={styles.summaryTitle}>
            {periodTab === 'today'
              ? (selectedDate === dayjs().format('YYYY-MM-DD') ? '今日' : selectedDate)
              : periodTab === 'week' ? `本周（${currentSummary.startDate}~${currentSummary.endDate}）`
              : `本月（${currentSummary.startDate}~${currentSummary.endDate}）`} 统计摘要
          </View>
          <View className={styles.summaryGrid}>
            <View className={styles.summaryItem}>
              <View className={styles.summaryValue}>{stats.feedingCount}</View>
              <View className={styles.summaryLabel}>喂奶次数</View>
            </View>
            <View className={styles.summaryItem}>
              <View className={styles.summaryValue}>{stats.feedingTotalAmount}ml</View>
              <View className={styles.summaryLabel}>奶量</View>
            </View>
            <View className={styles.summaryItem}>
              <View className={styles.summaryValue}>{formatDuration(stats.breastTotalDuration)}</View>
              <View className={styles.summaryLabel}>亲喂时长</View>
            </View>
            <View className={styles.summaryItem}>
              <View className={styles.summaryValue}>{stats.diaperCount}</View>
              <View className={styles.summaryLabel}>换尿布</View>
            </View>
            <View className={styles.summaryItem}>
              <View className={styles.summaryValue}>{`${Math.floor(stats.sleepTotalDuration / 60)}h${stats.sleepTotalDuration % 60}m`}</View>
              <View className={styles.summaryLabel}>睡眠时长</View>
            </View>
            <View className={styles.summaryItem}>
              <View className={styles.summaryValue}>{stats.foodCount}</View>
              <View className={styles.summaryLabel}>辅食次数</View>
            </View>
          </View>
        </View>

        <View className={styles.recordList}>
          {filteredRecords.length === 0 ? (
            <View style={{
              padding: '80rpx 32rpx',
              textAlign: 'center',
              background: '#fff',
              borderRadius: '16rpx',
              boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.08)'
            }}>
              <Text style={{ fontSize: '80rpx', display: 'block', marginBottom: '16rpx' }}>📝</Text>
              <Text style={{ color: '#999', fontSize: '28rpx' }}>该日期暂无记录，点击右下角+号添加</Text>
            </View>
          ) : (
            filteredRecords.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onClick={() => handleRecordClick(record.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {showFab && (
        <View className={styles.fabGroup}>
          {fabItems.map((item, idx) => (
            <View className={styles.fabItem} key={item.key} style={{ animationDelay: `${idx * 50}ms` }}>
              <View className={styles.fabLabel}>{item.label}</View>
              <View
                className={classnames(styles.fab, styles.secondary)}
                onClick={() => handleAddRecord(item.key)}
              >
                {item.icon}
              </View>
            </View>
          ))}
        </View>
      )}

      <View
        className={styles.fab}
        style={{
          position: 'fixed',
          right: '32rpx',
          bottom: '180rpx',
          zIndex: 101,
          transform: showFab ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease'
        }}
        onClick={() => setShowFab(!showFab)}
      >
        ＋
      </View>
    </View>
  );
};

export default RecordPage;
