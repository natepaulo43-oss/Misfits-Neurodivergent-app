import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../constants/theme';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Avatar: React.FC<AvatarProps> = ({ 
  uri, 
  name = '', 
  size = 'medium' 
}) => {
  const sizeValue = {
    small: 40,
    medium: 60,
    large: 100,
  }[size];

  const fontSize = {
    small: 16,
    medium: 24,
    large: 40,
  }[size];

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (uri && !uri.includes('placeholder')) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surface,
  },
  placeholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontWeight: '600',
  },
});
