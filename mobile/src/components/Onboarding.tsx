import { useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../utils/theme';

const { width } = Dimensions.get('window');

const getSlides = (t: any) => [
  {
    image: require('../../assets/images/onboarding-1.png'),
    title: 'Welcome to Phxntom',
    desc: 'Compete in epic battles and climb the ranks to become a legend.',
    color: t.primary,
  },
  {
    image: require('../../assets/images/onboarding-2.png'),
    title: 'Choose Your Mode',
    desc: 'Killrace, Resurgence or Battle Royale. Each mode has its own rules and rewards.',
    color: t.error,
  },
  {
    image: require('../../assets/images/onboarding-3.png'),
    title: 'Earn & Progress',
    desc: 'Win matches, earn XP and Phxntom Coins, unlock badges, and dominate the leaderboard.',
    color: t.secondary,
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { theme } = useTheme();
  const slides = useMemo(() => getSlides(theme), [theme]);
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).slide}>
        <View style={[styles(theme).imageWrap, { borderColor: slide.color }]}>
          <Image source={slide.image} style={styles(theme).image} />
        </View>
        <Text style={styles(theme).title}>{slide.title}</Text>
        <Text style={styles(theme).desc}>{slide.desc}</Text>
      </View>

      <View style={styles(theme).dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles(theme).dot, i === step && { backgroundColor: slide.color, width: 24 }]} />
        ))}
      </View>

      <View style={styles(theme).buttons}>
        {!isLast ? (
          <TouchableOpacity style={[styles(theme).btn, { backgroundColor: slide.color }]} onPress={() => setStep(step + 1)}>
            <Text style={styles(theme).btnText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles(theme).btn, { backgroundColor: slide.color }]} onPress={onComplete}>
            <Text style={styles(theme).btnText}>Get Started</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onComplete}>
          <Text style={styles(theme).skip}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (t: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.background,
    justifyContent: 'center',
    padding: 32,
  },
  slide: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  imageWrap: {
    width: 200,
    height: 200,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    overflow: 'hidden',
    backgroundColor: t.surface,
  },
  image: { width: 180, height: 180, resizeMode: 'contain' },
  title: { fontSize: 26, fontWeight: '900', color: t.text, textAlign: 'center', marginBottom: 12 },
  desc: { fontSize: 15, color: t.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.textMuted },
  buttons: { gap: 12, alignItems: 'center' },
  btn: { paddingVertical: 16, paddingHorizontal: 48, borderRadius: 14, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: { color: t.textMuted, fontSize: 14, padding: 8 },
});
