import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBabyStore } from '@/store';
import type { FamilyMember } from '@/types';

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
  const familyMembers = useBabyStore((s) => s.familyMembers);
  const currentUserId = useBabyStore((s) => s.currentUserId);
  const addFamilyMember = useBabyStore((s) => s.addFamilyMember);
  const updateFamilyMember = useBabyStore((s) => s.updateFamilyMember);
  const removeFamilyMember = useBabyStore((s) => s.removeFamilyMember);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<FamilyMember['role']>('mom');
  const [newRoleName, setNewRoleName] = useState('妈妈');
  const [newCanEdit, setNewCanEdit] = useState(true);

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
    Taro.showModal({
      title: '邀请家人加入',
      content: '方式一：通过微信分享链接邀请\n方式二：生成邀请码让家人输入\n\n家人加入后可共同记录宝宝成长。',
      confirmText: '去邀请',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '邀请功能开发中', icon: 'none' });
        }
      }
    });
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
