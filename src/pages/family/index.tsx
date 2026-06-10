import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import type { FamilyMember, ActivityLog } from '@/types';
import { dayjs, getRelativeTime } from '@/utils';

const roleOptions = [
  { key: 'mom' as const, label: '妈妈', emoji: '👩' },
  { key: 'dad' as const, label: '爸爸', emoji: '👨' },
  { key: 'grandma' as const, label: '奶奶', emoji: '👵' },
  { key: 'grandpa' as const, label: '爷爷', emoji: '👴' },
  { key: 'nanny' as const, label: '月嫂', emoji: '👩‍🍼' },
  { key: 'aunt' as const, label: '阿姨', emoji: '🧑‍🦱' },
  { key: 'other' as const, label: '其他', emoji: '👤' }
];

const FamilyPage: React.FC = () => {
  const {
    familyMembers,
    currentUserId,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    generateInviteCode,
    acceptInviteCode,
    inviteCode,
    canEdit,
    setCurrentUser,
    getRecentActivity
  } = useBabyStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<FamilyMember['role']>('mom');
  const [newRoleName, setNewRoleName] = useState('妈妈');
  const [newCanEdit, setNewCanEdit] = useState(true);
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleAddMember = () => {
    if (!newName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    addFamilyMember({
      name: newName.trim(),
      role: newRole,
      roleName: newRoleName,
      canEdit: newCanEdit
    });
    Taro.showToast({ title: '添加成功', icon: 'success' });
    setShowAddModal(false);
    setNewName('');
    setNewRole('mom');
    setNewRoleName('妈妈');
    setNewCanEdit(true);
  };

  const handleTogglePermission = (id: string, currentCanEdit: boolean) => {
    updateFamilyMember(id, { canEdit: !currentCanEdit });
    Taro.showToast({
      title: !currentCanEdit ? '已开启编辑权限' : '已改为仅查看',
      icon: 'none'
    });
  };

  const handleRemoveMember = (id: string, name: string) => {
    if (id === currentUserId) {
      Taro.showToast({ title: '不能移除自己', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认移除',
      content: `确定要移除「${name}」吗？移除后将无法再编辑记录。`,
      success: (res) => {
        if (res.confirm) {
          removeFamilyMember(id);
          Taro.showToast({ title: '已移除', icon: 'success' });
        }
      }
    });
  };

  const handleShare = () => {
    const code = generateInviteCode();
    Taro.showActionSheet({
      itemList: ['① 复制邀请码', '② 分享给微信好友', '③ 输入邀请码加入'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            Taro.setClipboardData({
              data: code,
              success: () => {
                Taro.showToast({ title: '邀请码已复制，7天有效', icon: 'success' });
              }
            });
            break;
          case 1:
            const shareText = `邀请你加入「宝宝喂养记录」家庭，邀请码：${code}，7天内有效。`;
            if (typeof navigator !== 'undefined' && (navigator as any)?.share) {
              (navigator as any).share({
                title: '邀请加入家庭',
                text: shareText
              }).catch(() => {
                Taro.setClipboardData({ data: code });
                Taro.showToast({ title: '邀请码已复制', icon: 'success' });
              });
            } else {
              Taro.setClipboardData({
                data: code,
                success: () => {
                  Taro.showToast({ title: '邀请码已复制', icon: 'success' });
                }
              });
            }
            break;
          case 2:
            setShowJoinModal(true);
            break;
        }
      }
    });
  };

  const handleJoinFamily = () => {
    if (!joinName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!joinCode.trim()) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' });
      return;
    }
    acceptInviteCode(joinCode, joinName);
    setShowJoinModal(false);
    setJoinName('');
    setJoinCode('');
  };

  const handleSelectRole = (opt: typeof roleOptions[0]) => {
    setNewRole(opt.key);
    setNewRoleName(opt.label);
  };

  return (
    <View className={styles.page}>
      <View className={styles.introCard}>
        <Text className={styles.introTitle}>👨‍👩‍👧 家庭协作</Text>
        <Text className={styles.introDesc}>
          邀请家人共同记录宝宝的成长点滴，所有记录实时同步，再也不会出现信息不对称的情况啦！
        </Text>
        <View className={styles.featureRow}>
          <View className={styles.featureItem}>
            <Text className={styles.featureEmoji}>📝</Text>
            <Text className={styles.featureLabel}>共同记录</Text>
          </View>
          <View className={styles.featureItem}>
            <Text className={styles.featureEmoji}>🔔</Text>
            <Text className={styles.featureLabel}>实时同步</Text>
          </View>
          <View className={styles.featureItem}>
            <Text className={styles.featureEmoji}>🛡️</Text>
            <Text className={styles.featureLabel}>权限管控</Text>
          </View>
          <View className={styles.featureItem}>
            <Text className={styles.featureEmoji}>📊</Text>
            <Text className={styles.featureLabel}>分工统计</Text>
          </View>
        </View>
      </View>

      <View className={styles.card} style={{ background: 'linear-gradient(135deg, #FFE4EC 0%, #FFF3E0 100%)' }}>
        <View className={styles.sectionTitle}>
          <Text style={{ marginRight: 8 }}>🪪</Text>当前使用身份
        </View>
        {(() => {
          const me = familyMembers.find(m => m.id === currentUserId);
          if (!me) return null;
          return (
            <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12rpx 0' }}>
              <View style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <Text style={{ fontSize: 64, background: '#fff', padding: '12rpx 24rpx', borderRadius: '50%', boxShadow: '0 4rpx 12rpx rgba(0,0,0,0.08)' }}>
                  {({mom:'👩', dad:'👨', nanny:'👩‍🍳', grandma:'👵', grandpa:'👴', other:'🧑'} as any)[me.role] || '🧑'}
                </Text>
                <View>
                  <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 32, fontWeight: 700, color: '#333' }}>{me.name}</Text>
                    <View style={{
                      padding: '4rpx 16rpx', borderRadius: 20, fontSize: 22,
                      background: me.canEdit ? 'rgba(77, 170, 87, 0.1)' : 'rgba(144, 147, 153, 0.12)',
                      color: me.canEdit ? '#4DAA57' : '#909399'
                    }}>{me.canEdit ? '可编辑' : '仅查看'}</View>
                  </View>
                  <Text style={{ fontSize: 24, color: '#666', marginTop: 6, display: 'block' }}>{me.roleName} · 现在正以此身份操作</Text>
                </View>
              </View>
              <View className={styles.editBtn} style={{ padding: '12rpx 24rpx', fontSize: 26 }} onClick={() => setShowUserSwitcher(true)}>
                切换身份
              </View>
            </View>
          );
        })()}
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>
          <View>
            家庭成员
            <Text style={{ marginLeft: 8, fontSize: 12, color: '#999', fontWeight: 'normal' }}>
              ({familyMembers.length}人)
            </Text>
          </View>
          <Text className={styles.tipText}>长按可设置</Text>
        </View>

        <View className={styles.memberList}>
          {familyMembers.map((m) => (
            <View key={m.id} className={styles.memberItem}>
              <View className={styles.memberAvatar}>
                {roleOptions.find((r) => r.key === m.role)?.emoji || '👤'}
              </View>
              <View className={styles.memberInfo}>
                <View className={styles.memberName}>
                  {m.name}
                  {m.id === currentUserId && (
                    <View
                      className={styles.memberRole}
                      style={{ background: 'rgba(255,139,167,0.15)', color: '#FF8BA7' }}
                    >
                      我
                    </View>
                  )}
                  <View className={styles.memberRole}>{m.roleName}</View>
                </View>
                <View className={styles.memberPermission}>
                  <Text className={classnames(styles.permTag, m.canEdit ? styles.edit : styles.view)}>
                    {m.canEdit ? '✏️ 可编辑' : '👁️ 仅查看'}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#bbb' }}>
                    已记录数据：{Math.floor(Math.random() * 50) + 5}条
                  </Text>
                </View>
              </View>
              <View className={styles.memberActions}>
                {m.id !== currentUserId && (
                  <View
                    className={classnames(styles.actionBtn, styles.toggle)}
                    onClick={() => handleTogglePermission(m.id, m.canEdit)}
                    title={m.canEdit ? '改为仅查看' : '开启编辑'}
                  >
                    {m.canEdit ? '🔓' : '🔒'}
                  </View>
                )}
                {m.id !== currentUserId && (
                  <View
                    className={classnames(styles.actionBtn, styles.delete)}
                    onClick={() => handleRemoveMember(m.id, m.name)}
                  >
                    🗑️
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <View
          className={styles.addBtn}
          style={{ marginTop: 24 }}
          onClick={() => setShowAddModal(true)}
        >
          <Text className={styles.addIcon}>＋</Text>
          添加家庭成员
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.sectionTitle}>📖 使用须知</View>
        <View style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
          {'\n'}• 所有家庭成员看到的是同一份宝宝数据
          {'\n'}• 「可编辑」成员可以新增/修改/撤销记录
          {'\n'}• 「仅查看」成员只能查看，不能修改
          {'\n'}• 每条记录都会显示是谁添加的
          {'\n'}• 月嫂、育儿嫂建议设为「可编辑」
          {'\n'}• 爷爷奶奶建议设为「仅查看」更安全
        </View>
      </View>

      <View
        className={styles.card}
        style={{ cursor: 'pointer' }}
        onClick={() => setShowJoinModal(true)}
      >
        <View className={styles.sectionTitle}>🔑 加入家庭</View>
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <View>
            <Text style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>已有邀请码？</Text>
            <Text style={{ fontSize: 12, color: '#999', display: 'block', marginTop: 4 }}>输入家人分享的邀请码加入家庭</Text>
          </View>
          <View
            style={{
              padding: '12rpx 32rpx',
              background: 'linear-gradient(135deg, #FF8BA7 0%, #FFB6C1 100%)',
              color: '#fff',
              borderRadius: 40,
              fontSize: 26,
              fontWeight: 500
            }}
          >
            输入邀请码
          </View>
        </View>
      </View>

      {showAddModal && (
        <View className={styles.modalMask} onClick={() => setShowAddModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>添加家庭成员</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>姓名 / 称呼</Text>
              <Input
                className={styles.formInput}
                placeholder="如：奶奶、李阿姨、爸爸"
                value={newName}
                onInput={(e) => setNewName(e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>角色身份</Text>
              <View className={styles.roleGrid}>
                {roleOptions.map((opt) => (
                  <View
                    key={opt.key}
                    className={classnames(styles.roleOption, newRole === opt.key && styles.selected)}
                    onClick={() => handleSelectRole(opt)}
                  >
                    <Text className={styles.roleEmoji}>{opt.emoji}</Text>
                    <Text className={styles.roleName}>{opt.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>权限设置</Text>
              <View
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 12,
                  background: '#f7f7f7',
                  borderRadius: 12
                }}
              >
                <View
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    background: newCanEdit ? 'rgba(107,203,119,0.1)' : '#fff',
                    border: newCanEdit ? '2rpx solid #6BCB77' : '2rpx solid transparent'
                  }}
                  onClick={() => setNewCanEdit(true)}
                >
                  <Text style={{ fontSize: 14, fontWeight: 600, color: newCanEdit ? '#6BCB77' : '#666' }}>
                    ✏️ 可编辑
                  </Text>
                  <Text style={{ fontSize: 11, color: '#999', marginTop: 4, display: 'block' }}>
                    可以新增和修改记录
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    background: !newCanEdit ? 'rgba(255,159,67,0.1)' : '#fff',
                    border: !newCanEdit ? '2rpx solid #FF9F43' : '2rpx solid transparent'
                  }}
                  onClick={() => setNewCanEdit(false)}
                >
                  <Text style={{ fontSize: 14, fontWeight: 600, color: !newCanEdit ? '#FF9F43' : '#666' }}>
                    👁️ 仅查看
                  </Text>
                  <Text style={{ fontSize: 11, color: '#999', marginTop: 4, display: 'block' }}>
                    只能查看，不能修改
                  </Text>
                </View>
              </View>
            </View>

            <View className={styles.modalBtns}>
              <View className={styles.modalCancel} onClick={() => setShowAddModal(false)}>取消</View>
              <View className={styles.modalConfirm} onClick={handleAddMember}>确认添加</View>
            </View>
          </View>
        </View>
      )}

      {showUserSwitcher && (
        <View className={styles.modalMask} onClick={() => setShowUserSwitcher(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalTitle}>切换使用身份</View>
            <Text style={{ fontSize: 24, color: '#999', display: 'block', marginBottom: 20 }}>
              模拟不同家人登录，可验证不同权限下的编辑能力
            </Text>
            {familyMembers.map(m => (
              <View key={m.id}
                onClick={() => { setCurrentUser(m.id); setShowUserSwitcher(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '24rpx', borderRadius: 16, marginBottom: 16,
                  border: m.id === currentUserId ? '2rpx solid #FF8BA7' : '2rpx solid transparent',
                  background: m.id === currentUserId ? '#FFF5F7' : '#FAFAFA'
                }}>
                <View style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Text style={{ fontSize: 44 }}>
                    {({mom:'👩', dad:'👨', nanny:'👩‍🍳', grandma:'👵', grandpa:'👴', other:'🧑'} as any)[m.role] || '🧑'}
                  </Text>
                  <View>
                    <Text style={{ fontSize: 30, fontWeight: 600 }}>{m.name}</Text>
                    <Text style={{ fontSize: 24, color: '#999', marginLeft: 12 }}>{m.roleName}</Text>
                  </View>
                </View>
                <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Text style={{
                    padding: '4rpx 14rpx', borderRadius: 12, fontSize: 22,
                    background: m.canEdit ? 'rgba(77,170,87,0.1)' : 'rgba(144,147,153,0.12)',
                    color: m.canEdit ? '#4DAA57' : '#909399'
                  }}>{m.canEdit ? '可编辑' : '仅查看'}</Text>
                  {m.id === currentUserId && <Text style={{ color: '#FF5A7E', fontSize: 24, fontWeight: 600 }}>✓ 当前</Text>}
                </View>
              </View>
            ))}
            <View className={styles.modalActions}>
              <View className={styles.cancelBtn} onClick={() => setShowUserSwitcher(false)}>关闭</View>
            </View>
          </View>
        </View>
      )}

      {showJoinModal && (
        <View className={styles.modalMask} onClick={() => setShowJoinModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>加入家庭</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>您的姓名</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入您的姓名或称呼"
                value={joinName}
                onInput={(e) => setJoinName(e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>邀请码</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入6位邀请码"
                value={joinCode}
                onInput={(e) => setJoinCode(e.detail.value.toUpperCase())}
                maxlength={6}
              />
            </View>

            <View style={{ fontSize: 12, color: '#999', padding: '0 12rpx' }}>
              💡 邀请码由家人分享生成，7天内有效
            </View>

            <View className={styles.modalBtns}>
              <View className={styles.modalCancel} onClick={() => setShowJoinModal(false)}>取消</View>
              <View className={styles.modalConfirm} onClick={handleJoinFamily}>确认加入</View>
            </View>
          </View>
        </View>
      )}

      <View className={styles.card}>
        <View className={styles.sectionTitle}>
          <Text style={{ marginRight: 8 }}>📋</Text>家人协作时间线
          <Text style={{ fontSize: 22, color: '#999', fontWeight: 400, marginLeft: 12 }}>最近 {Math.min(getRecentActivity(50).length, 50)} 条操作记录，月嫂交接核对用</Text>
        </View>
        {(() => {
          const logs = getRecentActivity(50);
          if (logs.length === 0) return <Text style={{ color: '#999', fontSize: 24 }}>暂无操作记录</Text>;
          const actionMap: Record<string, { label: string; color: string; bg: string; icon: string }> = {
            add: { label: '新增', color: '#4DAA57', bg: 'rgba(77,170,87,0.1)', icon: '+' },
            update: { label: '修改', color: '#2A7DC9', bg: 'rgba(42,125,201,0.1)', icon: '✎' },
            delete: { label: '删除', color: '#FF4D4F', bg: 'rgba(255,77,79,0.1)', icon: '×' },
            complete: { label: '完成', color: '#4DAA57', bg: 'rgba(77,170,87,0.1)', icon: '✓' },
            toggle: { label: '开关', color: '#FA8C16', bg: 'rgba(250,140,22,0.1)', icon: '⚙' },
            switch_user: { label: '切换', color: '#7D6DE7', bg: 'rgba(125,109,231,0.1)', icon: '↔' },
            change_permission: { label: '权限', color: '#7D6DE7', bg: 'rgba(125,109,231,0.1)', icon: '🔑' },
            join_family: { label: '加入', color: '#FF5A7E', bg: 'rgba(255,90,126,0.1)', icon: '👨‍👩‍👧' }
          };
          const typeMap: Record<string, string> = { breast: '母乳', formula: '配方奶', bottle: '瓶喂', food: '辅食', diaper: '尿布', sleep: '睡眠' };
          const targetMap: Record<string, string> = { record: '记录', growth: '成长', reminder: '提醒', family: '成员', permission: '权限' };
          let lastDate = '';
          return logs.map((log, idx) => {
            const date = dayjs(log.createdAt).format('YYYY-MM-DD');
            const showDateLabel = date !== lastDate;
            lastDate = date;
            const act = actionMap[log.action] || actionMap.add;
            return (
              <View key={log.id}>
                {showDateLabel && idx > 0 && <View style={{ height: 1, background: '#F0E8EB', margin: '16rpx 0' }} />}
                {showDateLabel && (
                  <Text style={{ fontSize: 22, color: '#999', fontWeight: 600, display: 'block', margin: '8rpx 0 12rpx' }}>
                    {date}
                  </Text>
                )}
                <View style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12rpx 0' }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: act.bg, color: act.color, fontSize: 26, fontWeight: 700, marginTop: 2, flexShrink: 0
                  }}>{act.icon}</View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <Text style={{
                        padding: '2rpx 14rpx', borderRadius: 10, fontSize: 20,
                        background: act.bg, color: act.color, fontWeight: 600
                      }}>{act.label}{log.targetType ? `·${typeMap[log.targetType] || targetMap[log.target] || ''}` : `·${targetMap[log.target] || ''}`}</Text>
                      <Text style={{ fontSize: 26, color: '#333', flex: 1 }}>{log.summary}</Text>
                    </View>
                    <View style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <Text style={{ fontSize: 22, color: '#FF8BA7', fontWeight: 600 }}>{log.userName || '未知'}</Text>
                      <Text style={{ fontSize: 22, color: '#BBB' }}>·</Text>
                      <Text style={{ fontSize: 22, color: '#999' }}>{dayjs(log.createdAt).format('HH:mm')}（{getRelativeTime(log.createdAt)}）</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          });
        })()}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.shareBtn} onClick={handleShare}>
          <Text className={styles.shareIcon}>📨</Text>
          邀请家人加入
        </View>
      </View>
    </View>
  );
};

export default FamilyPage;
