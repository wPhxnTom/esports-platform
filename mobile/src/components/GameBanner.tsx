import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
interface GameBannerProps {
  mode: string;
  icon: string;
  description: string;
  color: string;
  players: string;
  image: any;
  onPress: () => void;
}

export default function GameBanner({ mode, icon, description, color, players, image, onPress }: GameBannerProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <ImageBackground source={image} style={styles.card} imageStyle={{ borderRadius: 16 }}>
        <View style={[styles.overlay, { borderLeftColor: color }]}>
          <View style={styles.topRow}>
            <Text style={styles.icon}>{icon}</Text>
            <View style={[styles.badge, { backgroundColor: color + 'CC' }]}>
              <Text style={[styles.badgeText, { color: '#fff' }]}>{players}</Text>
            </View>
          </View>
          <Text style={styles.modeName}>{mode}</Text>
          <Text style={styles.desc}>{description}</Text>
          <View style={[styles.playBtn, { backgroundColor: color }]}>
            <Text style={styles.playText}>PLAY NOW →</Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  overlay: {
    padding: 20,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(10,10,26,0.75)',
    minHeight: 180,
    justifyContent: 'flex-end',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: { fontSize: 40 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  modeName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  desc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 18, marginBottom: 12 },
  playBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  playText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
});
