import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import { getBabyAge, dayjs, formatDuration } from '@/utils';
import RecordCard from '@/components/RecordCard';

const quickActions = [
  { key: 'breast', label: '母乳', icon: '🤱', color: '#FFD93D22', textColor: '#F5B800' },
  { key: 'formula', label: '配方奶', icon: '🍼', color: '#F7B26722', textColor: '#E67E22' },
  { key: 'bottle', label: '瓶喂', icon: '🥛', color: '#FF8BA722', textColor: '#FF8BA7' },
  { key: 'food', label: '辅食', icon: '🥣', color: '#A8D8EA22', textColor: '#3498DB' },
  { key: 'diaper', label: '尿布', icon: '👶', color: '#B5EAD722', textColor: '#27AE60' },
  { key: 'sleep', label: '睡眠', icon: '😴', color: '#C3AED622', textColor: '#9B59B6' },
  { key: 'makeup', label: '补录', icon: '📝', color: '#E8E8E8', textColor: '#666' },
  { key: 'more', label: '更多', icon: '➕', color: '#F0F0F0', textColor: '#999' }
];

const HomePage: React.FC = () => {
  const getCurrentBaby = useBabyStore((s) => s.getCurrentBaby);
  const getRecordsByDate = useBabyStore((s) => s.getRecordsByDate);
  const getDailyStats = useBabyStore((s) => s.getDailyStats);
  const undoRecord = useBabyStore((s) => s.undoRecord);
  const redoRecord = useBabyStore((s) => s.redoRecord);
  const historyStack = useBabyStore((s) => s.historyStack);

  const [dateTab, setDateTab] = useState<'today' | 'yesterday' | 'week'>('today');
  const [showUndo, setShowUndo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    setShowUndo(historyStack.cursor >= 0);
  });

  const baby = useMemo(() => getCurrentBaby(), []);
  const targetDate = useMemo(() => {
    if (dateTab === 'yesterday') return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    return dayjs().format('YYYY-MM-DD');
  }, [dateTab]);

  const records = useMemo(() => getRecordsByDate(targetDate), [targetDate, getRecordsByDate]);
  const stats = useMemo(() => getDailyStats(targetDate), [targetDate, getDailyStats]);

  const handleQuickAction = (key: string) => {
    const pageMap: Record<string, string> = {
      breast: '/pages/feeding-edit/index?type=breast',
      formula: '/pages/feeding-edit/index?type=formula',
      bottle: '/pages/feeding-edit/index?type=bottle',
      food: '/pages/food-edit/index',
      diaper: '/pages/diaper-edit/index',
      sleep: '/pages/sleep-edit/index',
      makeup: '/pages/record/index'
    };
    if (key === 'more') {
      Taro.switchTab({ url: '/pages/record/index' });
      return;
    }
    const url = pageMap[key];
    if (url) {
      Taro.navigateTo({ url });
    }
  };

  const handleUndo = () => {
    if (undoRecord()) {
      Taro.showToast({ title: '已撤销', icon: 'success' });
    }
  };

  const handleRedo = () => {
    if (redoRecord()) {
      Taro.showToast({ title: '已重做', icon: 'success' });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  };

  const handleNightMode = () => {
    Taro.showActionSheet({
      itemList: ['快速母乳（左）', '快速母乳（右）', '快速配方奶120ml', '快速换尿布', '快速睡眠开始'],
      success: (res) => {
        const now = dayjs().toISOString();
        switch (res.tapIndex) {
          case 0:
            useBabyStore.getState().addRecord({
              type: 'breast', side: 'left', leftDuration: 15, totalDuration: 15, time: now
            } as any);
            Taro.showToast({ title: '已记录母乳15分钟' });
            break;
          case 1:
            useBabyStore.getState().addRecord({
              type: 'breast', side: 'right', rightDuration: 15, totalDuration: 15, time: now
            } as any);
            Taro.showToast({ title: '已记录母乳15分钟' });
            break;
          case 2:
            useBabyStore.getState().addRecord({
              type: 'formula', powderAmount: 4, waterAmount: 120, time: now
            } as any);
            Taro.showToast({ title: '已记录配方奶120ml' });
            break;
          case 3:
            useBabyStore.getState().addRecord({
              type: 'diaper', diaperType: 'pee', color: 'yellow', texture: 'normal', time: now
            } as any);
            Taro.showToast({ title: '已记录换尿布' });
            break;
          case 4:
            Taro.showToast({ title: '睡眠计时已开始', icon: 'none' });
            break;
        }
        setShowUndo(true);
      }
    });
  };

  return (
    <View style={{ position: 'relative', minHeight: '100vh' }}>
      <ScrollView
        className={styles.page}
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        <View className={styles.header}>
        <View className={styles.babyCard}>
          <View className={styles.avatar}>
            {baby?.gender === 'girl' ? '👧' : '👦'}
          </View>
          <View className={styles.babyInfo}>
            <View className={styles.babyName}>{baby?.name || '我的宝宝'}</View>
            <View className={styles.babyMeta}>
              <Text>{baby?.gender === 'girl' ? '小公主' : '小王子'}</Text>
              <Text>·</Text>
              <Text>{baby ? getBabyAge(baby.birthday) : '--'}</Text>
            </View>
            <View className={styles.babyStats}>
              <View className={styles.babyStatItem}>
                <Text className={styles.label}>身高</Text>
                <Text className={styles.value}>{baby?.height || '--'}cm</Text>
              </View>
              <View className={styles.babyStatItem}>
                <Text className={styles.label}>体重</Text>
                <Text className={styles.value}>{baby?.weight || '--'}kg</Text>
              </View>
              <View className={styles.babyStatItem}>
                <Text className={styles.label}>头围</Text>
                <Text className={styles.value}>{baby?.headCircumference || '--'}cm</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.quickSection}>
        <View className={styles.sectionTitle}>
          <Text>快捷记录</Text>
          <Text className={styles.action} onClick={() => Taro.switchTab({ url: '/pages/record/index' })}>全部记录</Text>
        </View>
        <View className={styles.quickGrid}>
          {quickActions.map((item) => (
            <View
              key={item.key}
              className={styles.quickItem}
              onClick={() => handleQuickAction(item.key)}
            >
              <View className={styles.quickIcon} style={{ background: item.color }}>
                <Text>{item.icon}</Text>
              </View>
              <Text className={styles.quickLabel} style={{ color: item.textColor }}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.statsSection}>
        <View className={styles.statsCard}>
          <View className={styles.statsHeader}>
            <Text className={styles.sectionTitle} style={{ marginBottom: 0 }}>今日统计</Text>
            <View className={styles.dateTab}>
              <View
                className={classnames(styles.dateTabItem, dateTab === 'today' && styles.active)}
                onClick={() => setDateTab('today')}
              >今日</View>
              <View
                className={classnames(styles.dateTabItem, dateTab === 'yesterday' && styles.active)}
                onClick={() => setDateTab('yesterday')}
              >昨日</View>
              <View
                className={classnames(styles.dateTabItem, dateTab === 'week' && styles.active)}
                onClick={() => setDateTab('week')}
              >本周</View>
            </View>
          </View>
          <View className={styles.statsGrid}>
            <View className={styles.statBox}>
              <View className={styles.statHeader}>
                <View className={styles.statDot} style={{ background: '#FFD93D' }} />
                <Text className={styles.statLabel}>喂奶</Text>
              </View>
              <View>
                <Text className={styles.statValue}>{stats.feedingCount}</Text>
                <Text className={styles.statUnit}> 次</Text>
              </View>
              <Text className={styles.statSub}>
                {stats.feedingTotalAmount > 0 ? `${stats.feedingTotalAmount}ml` : ''}
                {stats.breastTotalDuration > 0 ? ` 亲喂${formatDuration(stats.breastTotalDuration)}` : ''}
              </Text>
            </View>
            <View className={styles.statBox}>
              <View className={styles.statHeader}>
                <View className={styles.statDot} style={{ background: '#A8D8EA' }} />
                <Text className={styles.statLabel}>辅食</Text>
              </View>
              <View>
                <Text className={styles.statValue}>{stats.foodCount}</Text>
                <Text className={styles.statUnit}> 次</Text>
              </View>
              <Text className={styles.statSub}>营养均衡，健康成长</Text>
            </View>
            <View className={styles.statBox}>
              <View className={styles.statHeader}>
                <View className={styles.statDot} style={{ background: '#B5EAD7' }} />
                <Text className={styles.statLabel}>换尿布</Text>
              </View>
              <View>
                <Text className={styles.statValue}>{stats.diaperCount}</Text>
                <Text className={styles.statUnit}> 次</Text>
              </View>
              <Text className={styles.statSub}>观察颜色和形态</Text>
            </View>
            <View className={styles.statBox}>
              <View className={styles.statHeader}>
                <View className={styles.statDot} style={{ background: '#C3AED6' }} />
                <Text className={styles.statLabel}>睡眠</Text>
              </View>
              <View>
                <Text className={styles.statValue}>{formatDuration(stats.sleepTotalDuration)}</Text>
              </View>
              <Text className={styles.statSub}>共{stats.sleepCount}次小睡</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.timelineSection}>
        <View className={styles.timelineHeader}>
          <Text className={styles.timelineTitle}>今日时间轴</Text>
          <Text className={classnames(styles.sectionTitle, styles.action)} style={{ marginBottom: 0 }} onClick={() => Taro.switchTab({ url: '/pages/record/index' })}>查看全部</Text>
        </View>
        {records.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>今天还没有记录，点击上方快捷按钮开始记录吧~</Text>
          </View>
        ) : (
          <View className={styles.recordList}>
            {records.map((record) => (
              <View key={record.id} className={styles.recordListItem}>
                <RecordCard record={record} compact />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>

    <View className={styles.nightModeBtn} onClick={handleNightMode}>
      <Text className={styles.nightIcon}>🌙</Text>
      <Text className={styles.nightText}>夜间</Text>
    </View>

    {showUndo && historyStack.cursor >= 0 && (
      <View className={styles.undoBar}>
        <Text className={styles.undoText}>已添加一条记录</Text>
        <View className={styles.undoActions}>
          {historyStack.cursor < historyStack.records.length - 1 && (
            <View className={styles.redoBtn} onClick={handleRedo}>重做</View>
          )}
          <View className={styles.undoBtn} onClick={handleUndo}>撤销</View>
        </View>
      </View>
    )}
    </View>
  );
};

export default HomePage;
