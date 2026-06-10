import React, { useCallback } from 'react';
import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface ImagePickerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxCount?: number;
  size?: number;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ photos, onChange, maxCount = 3, size = 140 }) => {
  const handleChoose = useCallback(async () => {
    const remaining = maxCount - photos.length;
    if (remaining <= 0) {
      Taro.showToast({ title: `最多${maxCount}张`, icon: 'none' });
      return;
    }
    try {
      const res = await Taro.chooseImage({
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      const paths: string[] = res.tempFilePaths || [];
      const h5Paths: string[] = (res as any).tempFiles?.map((f: any) => f.path) || [];
      const finalPaths = paths.length > 0 ? paths : h5Paths;
      const reader = typeof FileReader !== 'undefined';
      const base64Promises = finalPaths.map(async (p) => {
        if (reader && p.startsWith('blob:')) {
          return new Promise<string>((resolve) => {
            fetch(p)
              .then((r) => r.blob())
              .then((blob) => {
                const fr = new FileReader();
                fr.onload = () => resolve(String(fr.result));
                fr.readAsDataURL(blob);
              })
              .catch(() => resolve(p));
          });
        }
        return p;
      });
      const results = await Promise.all(base64Promises);
      onChange([...photos, ...results]);
    } catch (e) {
      console.warn('选择图片失败', e);
      Taro.showToast({ title: '选择图片失败', icon: 'none' });
    }
  }, [photos, maxCount, onChange]);

  const handlePreview = useCallback((index: number) => {
    const urls = photos.map((p) => (p.startsWith('data:') || p.startsWith('http') || p.startsWith('/') ? p : p));
    Taro.previewImage({
      current: urls[index],
      urls
    });
  }, [photos]);

  const handleDelete = useCallback(
    (index: number, e: any) => {
      e.stopPropagation?.();
      Taro.showModal({
        title: '删除照片',
        content: '确定要删除这张照片吗？',
        success: (res) => {
          if (res.confirm) {
            const next = [...photos];
            next.splice(index, 1);
            onChange(next);
          }
        }
      });
    },
    [photos, onChange]
  );

  return (
    <View className={styles.picker}>
      {photos.map((src, index) => (
        <View key={index} className={styles.item} style={{ width: `${size}rpx`, height: `${size}rpx` }}>
          <Image
            className={styles.img}
            src={src}
            mode='aspectFill'
            onClick={() => handlePreview(index)}
          />
          <View className={styles.deleteBtn} onClick={(e) => handleDelete(index, e)}>
            <Text className={styles.deleteText}>×</Text>
          </View>
        </View>
      ))}
      {photos.length < maxCount && (
        <View
          className={styles.addBtn}
          style={{ width: `${size}rpx`, height: `${size}rpx` }}
          onClick={handleChoose}
        >
          <Text className={styles.addIcon}>＋</Text>
          <Text className={styles.addText}>照片</Text>
        </View>
      )}
    </View>
  );
};

export default ImagePicker;
