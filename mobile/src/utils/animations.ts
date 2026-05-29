import { Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export function fadeIn(delay = 0): Animated.Value {
  const anim = new Animated.Value(0);
  Animated.timing(anim, {
    toValue: 1,
    duration: 400,
    delay,
    useNativeDriver: true,
  }).start();
  return anim;
}

export function slideUp(delay = 0): Animated.Value {
  const anim = new Animated.Value(50);
  Animated.timing(anim, {
    toValue: 0,
    duration: 400,
    delay,
    useNativeDriver: true,
  }).start();
  return anim;
}

export function slideLeft(delay = 0): Animated.Value {
  const anim = new Animated.Value(width);
  Animated.timing(anim, {
    toValue: 0,
    duration: 350,
    delay,
    useNativeDriver: true,
  }).start();
  return anim;
}

export function scaleIn(delay = 0): Animated.Value {
  const anim = new Animated.Value(0.8);
  Animated.spring(anim, {
    toValue: 1,
    delay,
    useNativeDriver: true,
  }).start();
  return anim;
}
