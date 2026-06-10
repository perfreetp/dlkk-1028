import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import { getBabyAge, dayjs, calcBMI, getBMICategory, roundTo } from '@/utils';
import { getDateRange, downloadReport, shareReport } from '@/utils/export';

const typeTabs = [
  { key: 'weight', label: '体重', unit: 'kg' },
  { key: 'height', label: '身高', unit: 'cm' },
  { key: 'head', label: '头围', unit: 'cm' }
];

const periodTabs = [
  { key: 'month', label: '按月' },
  { key: 'week', label: '按周' },
  { key: 'all', label: '全部' }
];

const GrowthPage: React.FC = () => {
  const getCurrentBaby = useBabyStore((s) => s.getCurrentBaby);
  const familyMembers = useBabyStore((s) => s.familyMembers);
  const records = useBabyStore((s) => s.records);
  const reminders = useBabyStore((s) => s.reminders);
  const growthRecords = useBabyStore((s) => s.growthRecords);
  const getPeriodSummary = useBabyStore((s) => s.getPeriodSummary);
  const getRecordsByDateRange = useBabyStore((s) => s.getRecordsByDateRange);

  const [activeType, setActiveType] = useState('weight');
  const [activePeriod, setActivePeriod] = useState('month');

  const baby = useMemo(() => getCurrentBaby(), []);
  const bmi = useMemo(() => {
    if (!baby) return { value: 0, category: '--' };
    const b = calcBMI(baby.weight || 0, baby.height || 0);
    const ageMonths = dayjs().diff(dayjs(baby.birthday), 'month');
    return { value: b, category: getBMICategory(b, ageMonths) };
  }, [baby]);

  const sortedRecords = useMemo(() => {
    return [...growthRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [growthRecords]);

  const latestRecord = useMemo(() => {
    return sortedRecords[sortedRecords.length - 1];
  }, [sortedRecords]);

  const chartData = useMemo(() => {
    const records = sortedRecords.slice(-7);
    if (records.length === 0) return { points: [], yLabels: [], xLabels: [] };

    const values = records.map((r) => {
      if (activeType === 'weight') return r.weight || 0;
      if (activeType === 'height') return r.height || 0;
      return r.headCircumference || 0;
    });

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const padding = range * 0.2;
    const yMin = Math.floor((minVal - padding) * 10) / 10;
    const yMax = Math.ceil((maxVal + padding) * 10) / 10;

    const points = values.map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 100;
      const y = ((yMax - v) / (yMax - yMin)) * 100;
      return { x: `${x}%`, y: `${y}%`, value: v };
    });

    const yLabels: string[] = [];
    for (let i = 0; i <= 4; i++) {
      const val = yMax - ((yMax - yMin) * i) / 4;
      yLabels.push(roundTo(val, 1).toString());
    }

    const xLabels = records.map((r) => {
      const d = dayjs(r.date);
      if (activePeriod === 'week') return d.format('MM/DD');
      return d.format('M月');
    });

    return { points, yLabels, xLabels };
  }, [sortedRecords, activeType, activePeriod]);

  const handleAddRecord = () => {
    Taro.navigateTo({ url: '/pages/growth-edit/index' });
  };

  const handleExport = () => {
    const baby = getCurrentBaby();
    if (!baby) {
      Taro.showToast({ title: '请先设置宝宝信息', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList: ['导出生成HTML报告（下载）', '分享给医生（复制摘要+下载）'],
      success: (res) => {
        const { startDate, endDate } = getDateRange('month');
        const summary = getPeriodSummary('month');
        const rangeRecords = getRecordsByDateRange(startDate, endDate);
        const params = {
          baby,
          familyMembers,
          records: rangeRecords,
          growthRecords,
          reminders,
          startDate,
          endDate,
          summary
        };
        if (res.tapIndex === 0) {
          downloadReport(params);
        } else if (res.tapIndex === 1) {
          shareReport(params);
        }
      }
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View style={{ height: '32rpx' }} />

      <View className={styles.headerCard}>
        <View className={styles.headerTitle}>{baby?.name} 的成长数据</View>
        <View className={styles.headerStats}>
          <View className={styles.headerStat}>
            <View>
              <Text className={styles.value}>{latestRecord?.height || baby?.height || '--'}</Text>
              <Text className={styles.unit}> cm</Text>
            </View>
            <View className={styles.label}>身高</View>
          </View>
          <View className={styles.headerStat}>
            <View>
              <Text className={styles.value}>{latestRecord?.weight || baby?.weight || '--'}</Text>
              <Text className={styles.unit}> kg</Text>
            </View>
            <View className={styles.label}>体重</View>
          </View>
          <View className={styles.headerStat}>
            <View>
              <Text className={styles.value}>{latestRecord?.headCircumference || baby?.headCircumference || '--'}</Text>
              <Text className={styles.unit}> cm</Text>
            </View>
            <View className={styles.label}>头围</View>
          </View>
        </View>
      </View>

      <View className={styles.bmiCard}>
        <View className={styles.bmiInfo}>
          <View className={styles.label}>BMI 体质指数</View>
          <View className={styles.value}>{bmi.value || '--'}</View>
        </View>
        <View className={styles.bmiTag}>{bmi.category}</View>
      </View>

      <View className={styles.typeTabs}>
        {typeTabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.typeTab, activeType === tab.key && styles.active)}
            onClick={() => setActiveType(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      <View className={styles.periodTabs}>
        {periodTabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.periodTab, activePeriod === tab.key && styles.active)}
            onClick={() => setActivePeriod(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      <View className={styles.chartCard}>
        <View className={styles.chartTitle}>
          <Text>
            {typeTabs.find((t) => t.key === activeType)?.label}生长曲线
          </Text>
          <View className={styles.chartLegend}>
            <View className={styles.legendItem}>
              <View className={styles.dot} style={{ background: '#FF8BA7' }} />
              <Text>实际值</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={styles.dot} style={{ background: '#C3AED6' }} />
              <Text>标准范围</Text>
            </View>
          </View>
        </View>
        <View className={styles.chartArea}>
          <View className={styles.yLabels}>
            {chartData.yLabels.map((label, i) => (
              <Text key={i}>{label}</Text>
            ))}
          </View>
          <View className={styles.chartGrid}>
            {[0, 25, 50, 75, 100].map((pos) => (
              <View key={pos} className={styles.gridLine} style={{ top: `${pos}%` }} />
            ))}
          </View>
          <View className={styles.chartLine}>
            {chartData.points.map((p, i) => (
              <View
                key={i}
                className={styles.dataPoint}
                style={{ left: p.x, top: p.y }}
              />
            ))}
          </View>
          <View className={styles.chartLabels}>
            {chartData.xLabels.map((label, i) => (
              <Text key={i}>{label}</Text>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.recordsSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.title}>历史记录</Text>
          <Text className={styles.addBtn} onClick={handleAddRecord}>
            ＋ 新增记录
          </Text>
        </View>
        {sortedRecords.slice().reverse().slice(0, 5).map((record) => (
          <View key={record.id} className={styles.recordItem}>
            <Text className={styles.recordDate}>{record.date}</Text>
            <View className={styles.recordValues}>
              {record.height && (
                <View className={styles.recordVal}>
                  <Text className={styles.label}>身高</Text>
                  <Text>{record.height}cm</Text>
                </View>
              )}
              {record.weight && (
                <View className={styles.recordVal}>
                  <Text className={styles.label}>体重</Text>
                  <Text>{record.weight}kg</Text>
                </View>
              )}
              {record.headCircumference && (
                <View className={styles.recordVal}>
                  <Text className={styles.label}>头围</Text>
                  <Text>{record.headCircumference}cm</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <View className={styles.exportCard} onClick={handleExport}>
        <View className={styles.exportInfo}>
          <View className={styles.title}>📤 导出给医生</View>
          <View className={styles.desc}>生成完整成长报告，打印或分享</View>
        </View>
        <View className={styles.exportBtn}>立即导出</View>
      </View>
    </ScrollView>
  );
};

export default GrowthPage;
