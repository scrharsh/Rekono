import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

type BrandMarkProps = {
  size?: number;
  style?: ViewStyle;
};

export default function BrandMark({ size = 56, style }: BrandMarkProps) {
  const scale = size / 56;

  return (
    <View style={[s.container, { width: size, height: size }, style]}>
      <View style={[s.backShard, { left: 30 * scale, width: 14 * scale, height: 42 * scale, transform: [{ rotate: '-18deg' }] }]} />
      <View style={[s.middleShard, { left: 22 * scale, width: 14 * scale, height: 42 * scale, transform: [{ rotate: '-18deg' }] }]} />
      <View style={[s.frontShard, { left: 14 * scale, width: 14 * scale, height: 42 * scale, transform: [{ rotate: '-18deg' }] }]} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backShard: {
    position: 'absolute',
    borderRadius: 6,
    backgroundColor: '#063580',
  },
  middleShard: {
    position: 'absolute',
    borderRadius: 6,
    backgroundColor: '#0B57D0',
  },
  frontShard: {
    position: 'absolute',
    borderRadius: 6,
    backgroundColor: '#0E7EF0',
  },
});
