import React, { ReactNode } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { fadeIn, slideUp } from '../utils/animations';
import { useMemo } from 'react';

interface Props {
  children: ReactNode;
  index?: number;
  style?: ViewStyle;
  type?: 'fade' | 'slide';
}

export default function AnimatedCard({ children, index = 0, style, type = 'slide' }: Props) {
  const anim = useMemo(() => {
    return type === 'fade' ? fadeIn(index * 80) : slideUp(index * 80);
  }, [index]);

  const opacity = useMemo(() => {
    const o = new Animated.Value(0);
    Animated.timing(o, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }).start();
    return o;
  }, [index]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY: anim }] }, style]}>
      {children}
    </Animated.View>
  );
}
