import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import { getBabyAge, dayjs } from '@/utils';
import { showDoctorReportPicker } from '@/utils/export';

const MinePage: React.FC = () => {
  const {
    getCurrentBaby,
    familyMembers,
    currentUserId,
    records,
    reminders,
    growthRecords,
    getPeriodSummary,
    getRecordsByDateRange,
    resetAll,
    canEdit
  } = useBabyStore();

  const currentUser = useMemo(() => {
    return familyMembers.find((m) => m.id === currentUserId);
  }, [familyMembers, currentUserId]);

  const baby = useMemo(() => getCurrentBaby(), []);

  const totalRecords = records.length;
  const totalDays = dayjs().diff(dayjs(baby?.birthday || new Date()), 'day') + 1;

  const menuItems = [
    {
      icon: '📤',
      iconBg: '#DBEAFE',
      title: '导出记录',
      desc: '导出喂养数据给医生查看',
      onClick: () => {
        const baby = getCurrentBaby();
        if (!baby) {
          Taro.showToast({ title: '请先设置宝宝信息', icon: 'none' });
          return;
        }
        showDoctorReportPicker({
          baby,
          allRecords: records,
          growthRecords,
          reminders,
          familyMembers,
          getPeriodSummary,
          getRecordsByDateRange
        });
      }
    },
    {
      id: 'reset',
      icon: '🔄',
      iconBg: '#FFE4E6',
      title: '重置示例数据',
      desc: '清空所有记录恢复初始示例',
      onClick: () => {
        Taro.showModal({
          title: '确认重置',
          content: '此操作会清空所有记录并恢复初始示例数据，确定继续吗？',
          success: (modalRes) => {
            if (modalRes.confirm) {
              resetAll();
              Taro.showToast({ title: '已重置', icon: 'success' });
            }
          }
        });
      }
    },
    {
      icon: '☁️',
      iconBg: '#FEF3C7',
      title: '云端同步',
      desc: '已同步至云端 · 自动备份',
      onClick: () => Taro.showToast({ title: '数据已同步', icon: 'success' })
    },
    {
      icon: '🌙',
      iconBg: '#C3AED6',
      title: '夜间模式',
      desc: '降低屏幕亮度，护眼舒适',
      onClick: () => Taro.showToast({ title: '夜间模式已开启', icon: 'none' })
    },
    {
      icon: '🔔',
      iconBg: '#FCE7F3',
      title: '通知设置',
      desc: '管理提醒和通知',
      onClick: () => Taro.switchTab({ url: '/pages/reminder/index' })
    },
    {
      icon: '💾',
      iconBg: '#D1FAE5',
      title: '数据备份',
      desc: '本地存储 + 云端双重保障',
      onClick: () => Taro.showToast({ title: '备份中...', icon: 'loading' })
    },
    {
      icon: '❓',
      iconBg: '#E0E7FF',
      title: '帮助与反馈',
      desc: '使用问题和建议反馈',
      onClick: () => Taro.showToast({ title: '反馈功能', icon: 'none' })
    },
    {
      icon: 'ℹ️',
      iconBg: '#F3E8FF',
      title: '关于我们',
      desc: '版本 v1.0.0',
      onClick: () => Taro.showModal({ title: '宝宝喂养记录', content: '陪伴宝宝健康成长的每一刻\n版本 v1.0.0', showCancel: false })
    }
  ];

  const memberClass: Record<string, string> = {
    mom: styles.mom,
    dad: styles.dad,
    grandma: styles.grandma,
    grandpa: styles.grandpa,
    nanny: styles.nanny,
    other: styles.other
  };

  const memberEmoji: Record<string, string> = {
    mom: '👩',
    dad: '👨',
    grandma: '👵',
    grandpa: '👴',
    nanny: '👩‍🍳',
    other: '🧑'
  };

  const handleAddMember = () => {
    Taro.showModal({
      title: '邀请家庭成员',
      content: '通过分享邀请码的方式邀请家人共同记录宝宝成长',
      confirmText: '生成邀请码',
      success: (res) => {
        if (res.confirm) {
          Taro.showModal({
            title: '邀请码',
            content: 'BABY2024X6K8\n有效期：7天\n使用方式：在首页"我的"-"家庭成员"中输入邀请码加入',
            showCancel: false
          });
        }
      }
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            {currentUser ? memberEmoji[currentUser.role] : '👤'}
          </View>
          <View className={styles.userDetail}>
            <View className={styles.userName}>
              {currentUser?.name || '用户'}
              <View
                style={{
                  display: 'inline-block',
                  marginLeft: 12,
                  padding: '4rpx 16rpx',
                  borderRadius: 20,
                  fontSize: 22,
                  background: canEdit() ? 'rgba(77, 170, 87, 0.1)' : 'rgba(144, 147, 153, 0.12)',
                  color: canEdit() ? '#4DAA57' : '#909399',
                  verticalAlign: 'middle'
                }}
              >
                {canEdit() ? '可编辑' : '仅查看'}
              </View>
            </View>
            <View className={styles.userRole}>
              <Text className={styles.roleTag}>{currentUser?.roleName || '管理员'}</Text>
              <Text>家庭管理员</Text>
            </View>
          </View>
          <View
            className={styles.switchIdentityBtn}
            onClick={() => Taro.navigateTo({ url: '/pages/family/index' })}
          >
            切换身份
          </View>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statsBox}>
          <View className={styles.num}>{totalDays}</View>
          <View className={styles.label}>记录天数</View>
        </View>
        <View className={styles.statsBox}>
          <View className={styles.num}>{totalRecords}</View>
          <View className={styles.label}>记录总数</View>
        </View>
        <View className={styles.statsBox}>
          <View className={styles.num}>{growthRecords.length}</View>
          <View className={styles.label}>成长数据</View>
        </View>
      </View>

      <View className={styles.babySection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.title}>👶 我的宝宝</Text>
        </View>
        <View className={styles.babyCard}>
          <View className={styles.babyAvatar}>
            {baby?.gender === 'girl' ? '👧' : '👦'}
          </View>
          <View className={styles.babyInfo}>
            <View className={styles.name}>{baby?.name || '宝宝'}</View>
            <View className={styles.meta}>
              {baby?.gender === 'girl' ? '小公主' : '小王子'} · {baby ? getBabyAge(baby.birthday) : '--'} · 已记录{totalDays}天
            </View>
          </View>
          <View className={styles.switchBtn} onClick={() => Taro.showToast({ title: '切换宝宝', icon: 'none' })}>
            切换
          </View>
        </View>
      </View>

      <View className={styles.familySection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.title}>👨‍👩‍👧 家庭成员 ({familyMembers.length})</Text>
          <Text className={styles.more} onClick={handleAddMember}>＋ 邀请</Text>
        </View>
        <View className={styles.memberList}>
          {familyMembers.map((member) => (
            <View key={member.id} className={styles.memberItem}>
              <View className={classnames(styles.memberAvatar, memberClass[member.role] || styles.other)}>
                {memberEmoji[member.role] || '🧑'}
              </View>
              <View className={styles.memberInfo}>
                <View className={styles.name}>
                  {member.name}
                  {member.id === currentUserId && (
                    <Text style={{ fontSize: 20, color: '#FF8BA7', marginLeft: 8 }}>（我）</Text>
                  )}
                </View>
                <View className={styles.role}>{member.roleName}</View>
              </View>
              <View className={classnames(styles.memberStatus, member.canEdit ? styles.edit : styles.view)}>
                {member.canEdit ? '✏️ 可编辑' : '👁 仅查看'}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.menuSection}>
        {menuItems.map((item, idx) => (
          <View key={idx} className={styles.menuItem} onClick={item.onClick}>
            <View className={styles.menuIcon} style={{ background: item.iconBg }}>
              {item.icon}
            </View>
            <View className={styles.menuContent}>
              <View className={styles.title}>{item.title}</View>
              <View className={styles.desc}>{item.desc}</View>
            </View>
            <View className={styles.menuArrow}>›</View>
          </View>
        ))}
      </View>

      <View className={styles.bottomTip}>
        ❤️ 陪伴宝宝健康成长的每一刻
      </View>
    </ScrollView>
  );
};

export default MinePage;
