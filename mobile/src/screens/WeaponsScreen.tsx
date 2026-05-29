import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Alert, Dimensions, Modal, RefreshControl, ImageBackground } from 'react-native';
import { useTheme } from '../utils/theme';
import api from '../api/client';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

const CATEGORIES = ['All', 'AR', 'SMG', 'Sniper', 'Shotgun', 'LMG', 'Marksman'];

const CATEGORY_IMAGES: Record<string, any> = {
  AR: require('../../assets/images/weapons/ar.jpg'),
  SMG: require('../../assets/images/weapons/smg.jpg'),
  Sniper: require('../../assets/images/weapons/sniper.jpg'),
  Shotgun: require('../../assets/images/weapons/shotgun.jpg'),
  LMG: require('../../assets/images/weapons/lmg.jpg'),
  Marksman: require('../../assets/images/weapons/marksman.jpg'),
};

const WEAPON_IMAGES: Record<string, any> = {
  'MK.78': require('../../assets/images/weapons/mk78.webp'),
  'Kogot-7': require('../../assets/images/weapons/kogot7.webp'),
  'Carbon 57': require('../../assets/images/weapons/carbon57.webp'),
  'DS20 Mirage': require('../../assets/images/weapons/ds20mirage.webp'),
  'Voyak KT-3': require('../../assets/images/weapons/voyaktk3.webp'),
  'VST': require('../../assets/images/weapons/vst.webp'),
  'MXR-17': require('../../assets/images/weapons/mxr17.webp'),
  'Strider 300': require('../../assets/images/weapons/strider300.webp'),
  'VS Recon': require('../../assets/images/weapons/vsrecon.webp'),
  'Hawker HX': require('../../assets/images/weapons/hawkerhx.webp'),
  'Dravec 45': require('../../assets/images/weapons/dravec45.webp'),
  'MK35 ISR': require('../../assets/images/weapons/mk35isr.webp'),
  'AK-27': require('../../assets/images/weapons/ak27.webp'),
  'Peacekeeper Mk1': require('../../assets/images/weapons/peacekeepermk1.webp'),
  'Ryden 45K': require('../../assets/images/weapons/ryden45k.webp'),
  'Sturmwolf 45': require('../../assets/images/weapons/sturmwolf45.webp'),
};

interface Attachment { slot: string; name: string }

interface Weapon {
  id: string; name: string; category: string; tier: 'S' | 'A' | 'B';
  desc: string; bestAttachments: Attachment[]; color: string; source: string;
  image?: any;
}

interface LoadoutItem {
  id: string; weaponName: string; category: string; description?: string;
  attachments: Attachment[]; avgRating: number; reviewCount: number;
  createdAt: string; user: { id: string; pseudo: string };
}

interface ReviewItem {
  id: string; rating: number; comment?: string; createdAt: string;
  user: { id: string; pseudo: string };
}

const WARZONE_BANNERS = [
  { uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600' },
  { uri: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600' },
  { uri: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600' },
];

const WEAPONS: Weapon[] = [
  { id: '1', name: 'MK.78', category: 'LMG', tier: 'S',
    desc: 'Absolute #1 meta. Insane TTK at long range, low recoil, massive magazine. The king of Warzone right now.',
    color: '#ef4444', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'Barrel', name: '22" Impulse HB-762 Barrel' },
      { slot: 'Optic', name: 'Redwell 30-S 2x' },
      { slot: 'Stock', name: 'Shock Shield Stock' },
      { slot: 'Fire Mods', name: '7.62 NATO Overpressured' },
    ] },
  { id: '2', name: 'Kogot-7', category: 'SMG', tier: 'S',
    desc: 'Best close-range SMG. Unbelievable fire rate, melts in CQB. The go-to for aggressive play.',
    color: '#06b6d4', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Hawker Ported Comp' },
      { slot: 'Barrel', name: '13.5" Canis-05 Barrel' },
      { slot: 'Underbarrel', name: 'EAM Steady-90 Grip' },
      { slot: 'Magazine', name: 'Vex Expanse Mag' },
      { slot: 'Fire Mods', name: 'Buffer Spring' },
    ] },
  { id: '3', name: 'Carbon 57', category: 'SMG', tier: 'S',
    desc: 'Obliterates up close with lightning-fast TTK. Incredible mobility.',
    color: '#06b6d4', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Kühn Ported Comp' },
      { slot: 'Barrel', name: '14" Rockleigh Barrel' },
      { slot: 'Underbarrel', name: 'Sapper Guard Handstop' },
      { slot: 'Magazine', name: 'MFS Renown Plus Mag' },
      { slot: 'Fire Mods', name: 'Accelerated Recoil System' },
    ] },
  { id: '4', name: 'DS20 Mirage', category: 'AR', tier: 'S',
    desc: 'Versatile Sniper Support & Long Range AR. Exceptional handling for an AR.',
    color: '#f97316', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'Barrel', name: '17.1" Abdicator Barrel' },
      { slot: 'Optic', name: 'FANG HoverPoint ELO' },
      { slot: 'Magazine', name: 'Griffon Reserve Extended II' },
      { slot: 'Stock', name: 'Weighted Stock' },
    ] },
  { id: '5', name: 'Voyak KT-3', category: 'AR', tier: 'S',
    desc: 'Smooth long-range AR. Recent buffs to range & velocity made it a top contender.',
    color: '#f97316', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'Barrel', name: '17.6" LTI Grav-4 Barrel' },
      { slot: 'Optic', name: 'Redwell 30-S 2x' },
      { slot: 'Magazine', name: 'SK-Garrison Drum' },
      { slot: 'Stock', name: 'V-Last Control Pad' },
    ] },
  { id: '6', name: 'VST', category: 'SMG', tier: 'S',
    desc: 'NEW season powerhouse. Fastest fire rate SMG, dominates in close quarters.',
    color: '#06b6d4', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Hawker Series 45' },
      { slot: 'Barrel', name: '14" LTI Expedition Barrel' },
      { slot: 'Underbarrel', name: 'VAS Convergence Foregrip' },
      { slot: 'Magazine', name: 'Avarice Extended Mag II' },
      { slot: 'Stock', name: 'Hawker Cub-55 Pad' },
    ] },
  { id: '7', name: 'MXR-17', category: 'AR', tier: 'A',
    desc: 'Hard-hitting AR with excellent damage range. A reliable long-range beam.',
    color: '#f97316', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'Barrel', name: '17" Greaves Scourge Barrel' },
      { slot: 'Optic', name: 'FANG HoverPoint ELO' },
      { slot: 'Magazine', name: 'Rhodes Drum Mag' },
      { slot: 'Stock', name: 'Winch Stock' },
    ] },
  { id: '8', name: 'Strider 300', category: 'Sniper', tier: 'S',
    desc: 'The one-shot king. Best-in-class bullet velocity, devastating at any range.',
    color: '#a78bfa', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'Barrel', name: '25" Bowen Grooved Barrel' },
      { slot: 'Magazine', name: 'Carnation Fast Mag' },
      { slot: 'Rear Grip', name: 'Hatch Quick Grip' },
      { slot: 'Fire Mods', name: '.300 WM Overpressured' },
    ] },
  { id: '9', name: 'VS Recon', category: 'Sniper', tier: 'A',
    desc: 'Fast ADS sniper, perfect for aggressive sniping. Great for quickscoping.',
    color: '#a78bfa', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'Barrel', name: '26" Recon Barrel' },
      { slot: 'Magazine', name: 'Speed Mag' },
      { slot: 'Rear Grip', name: 'Quickdraw Grip' },
      { slot: 'Stock', name: 'Lightweight Stock' },
    ] },
  { id: '10', name: 'Hawker HX', category: 'Sniper', tier: 'A',
    desc: 'Heavy-hitting sniper with excellent bullet penetration. One-shot torso potential.',
    color: '#a78bfa', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'Barrel', name: '23.7" Composite-11 Barrel' },
      { slot: 'Magazine', name: 'Flatload Speed Mag' },
      { slot: 'Rear Grip', name: 'Auroral Light Grip' },
      { slot: 'Fire Mods', name: '.338 LM Overpressured' },
    ] },
  { id: '11', name: 'Dravec 45', category: 'SMG', tier: 'A',
    desc: 'High-damage SMG with excellent range. Feels like a mini-AR.',
    color: '#06b6d4', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'Barrel', name: '19" EAM Horizon Barrel' },
      { slot: 'Optic', name: 'FANG HoverPoint ELO' },
      { slot: 'Magazine', name: 'Lockjaw Extended Mag' },
      { slot: 'Fire Mods', name: 'Accelerated Recoil System' },
    ] },
  { id: '12', name: 'MK35 ISR', category: 'AR', tier: 'A',
    desc: 'NEW AR with incredible accuracy. Low recoil, consistent damage at all ranges.',
    color: '#f97316', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'Barrel', name: '19" Precision Barrel' },
      { slot: 'Optic', name: 'Redwell 30-S 2x' },
      { slot: 'Underbarrel', name: 'VAS Convergence Foregrip' },
      { slot: 'Magazine', name: 'Extended Mag' },
    ] },
  { id: '13', name: 'AK-27', category: 'AR', tier: 'A',
    desc: 'Classic powerhouse. Low recoil, reliable, and hard-hitting. No gimmicks.',
    color: '#f97316', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'Barrel', name: '18" Heavy Barrel' },
      { slot: 'Underbarrel', name: 'Vertical Foregrip' },
      { slot: 'Magazine', name: 'Extended Mag' },
      { slot: 'Rear Grip', name: 'Rubberized Grip' },
    ] },
  { id: '14', name: 'Peacekeeper Mk1', category: 'AR', tier: 'A',
    desc: 'Versatile AR returning to form. Great all-rounder with solid stats everywhere.',
    color: '#f97316', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'K&S Compensator' },
      { slot: 'Barrel', name: '21" DF-3 Merge Barrel' },
      { slot: 'Optic', name: 'Lethal Tools ELO' },
      { slot: 'Underbarrel', name: 'Lateral Precision Grip' },
      { slot: 'Magazine', name: 'Vulcan Reach Extension' },
    ] },
  { id: '15', name: 'Ryden 45K', category: 'SMG', tier: 'A',
    desc: 'Fast-handling SMG with great hipfire accuracy. Perfect for run-and-gun.',
    color: '#06b6d4', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Compensator' },
      { slot: 'Barrel', name: '12" Short Barrel' },
      { slot: 'Underbarrel', name: 'Handstop' },
      { slot: 'Magazine', name: 'Extended Mag' },
      { slot: 'Stock', name: 'No Stock' },
    ] },
  { id: '16', name: 'Sturmwolf 45', category: 'SMG', tier: 'A',
    desc: 'SMG with AR-like stopping power. Magazine-fed, great for aggressive pushes.',
    color: '#06b6d4', source: 'BO7',
    bestAttachments: [
      { slot: 'Muzzle', name: 'Ported Comp' },
      { slot: 'Barrel', name: '15" Tactical Barrel' },
      { slot: 'Underbarrel', name: 'Steady-90 Grip' },
      { slot: 'Magazine', name: 'Extended Mag' },
      { slot: 'Rear Grip', name: 'Quick Grip' },
    ] },
];

const TIER_COLORS: Record<string, string> = { S: '#ef4444', A: '#f97316', B: '#eab308' };
const CATEGORY_ICONS: Record<string, string> = { AR: '🔫', SMG: '⚡', Sniper: '🎯', Shotgun: '💥', LMG: '⚙️', Marksman: '🎯' };

function StarRating({ rating, size = 14, interactive = false, onRate }: { rating: number; size?: number; interactive?: boolean; onRate?: (n: number) => void }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.round(rating);
    stars.push(
      <TouchableOpacity key={i} disabled={!interactive} onPress={() => onRate?.(i)}>
        <Text style={[starStyles.star, { fontSize: size }, filled ? starStyles.filled : starStyles.empty]}>{filled ? '★' : '☆'}</Text>
      </TouchableOpacity>
    );
  }
  return <View style={starStyles.row}>{stars}</View>;
}
const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  star: { lineHeight: undefined },
  filled: { color: '#fbbf24' },
  empty: { color: '#4a4a4a' },
});

function LoadoutForm({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const { theme } = useTheme();
  const [weaponName, setWeaponName] = useState('');
  const [category, setCategory] = useState('AR');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(Array(5).fill({ slot: '', name: '' }));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!weaponName.trim()) { Alert.alert('Error', 'Enter a weapon name'); return; }
    const validAttachments = attachments.filter(a => a.slot.trim() && a.name.trim());
    if (validAttachments.length === 0) { Alert.alert('Error', 'Add at least one attachment'); return; }
    setSaving(true);
    try {
      await api.post('/loadouts', { weaponName: weaponName.trim(), category, description: description.trim() || undefined, attachments: validAttachments });
      Alert.alert('Saved!', 'Your loadout has been added to the community.');
      onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save loadout');
    } finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={[lfStyles.container, { backgroundColor: theme.background }]}>
        <View style={lfStyles.header}>
          <Text style={[lfStyles.title, { color: theme.text }]}>New Loadout</Text>
          <TouchableOpacity onPress={onClose}><Text style={[lfStyles.closeBtn, { color: theme.textMuted }]}>✕</Text></TouchableOpacity>
        </View>

        <Text style={[lfStyles.label, { color: theme.textSecondary }]}>Weapon Name</Text>
        <TextInput style={[lfStyles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={weaponName} onChangeText={setWeaponName} placeholder="e.g. MK.78" placeholderTextColor={theme.textMuted} />

        <Text style={[lfStyles.label, { color: theme.textSecondary }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['AR', 'SMG', 'Sniper', 'Shotgun', 'LMG', 'Marksman'].map(c => (
            <TouchableOpacity key={c} style={[lfStyles.chip, { backgroundColor: category === c ? theme.primary : theme.surface, borderColor: theme.border }]} onPress={() => setCategory(c)}>
              <Text style={{ color: category === c ? '#fff' : theme.textSecondary, fontWeight: '600', fontSize: 12 }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[lfStyles.label, { color: theme.textSecondary }]}>Description (optional)</Text>
        <TextInput style={[lfStyles.input, lfStyles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={description} onChangeText={setDescription} placeholder="Why this loadout? Any tips?" placeholderTextColor={theme.textMuted} multiline numberOfLines={3} />

        <Text style={[lfStyles.label, { color: theme.textSecondary }]}>Attachments (up to 5)</Text>
        {attachments.map((att, i) => (
          <View key={i} style={lfStyles.attRow}>
            <TextInput style={[lfStyles.attInput, lfStyles.slotInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={att.slot} onChangeText={(t) => { const a = [...attachments]; a[i] = { ...a[i], slot: t }; setAttachments(a); }} placeholder="Slot" placeholderTextColor={theme.textMuted} />
            <TextInput style={[lfStyles.attInput, lfStyles.nameInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={att.name} onChangeText={(t) => { const a = [...attachments]; a[i] = { ...a[i], name: t }; setAttachments(a); }} placeholder="Attachment name" placeholderTextColor={theme.textMuted} />
          </View>
        ))}

        <TouchableOpacity style={[lfStyles.saveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]} onPress={handleSave} disabled={saving}>
          <Text style={lfStyles.saveText}>{saving ? 'Saving...' : 'Submit Loadout'}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </Modal>
  );
}

const lfStyles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: '900' },
  closeBtn: { fontSize: 20, padding: 4 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 4 },
  textArea: { height: 80, textAlignVertical: 'top' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  attRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  attInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13 },
  slotInput: { width: 90 },
  nameInput: { flex: 1 },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default function WeaponsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [tab, setTab] = useState<'weapons' | 'community'>('weapons');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<Weapon | null>(null);
  const [communityLoadouts, setCommunityLoadouts] = useState<LoadoutItem[]>([]);
  const [selectedLoadout, setSelectedLoadout] = useState<LoadoutItem | null>(null);
  const [loadoutReviews, setLoadoutReviews] = useState<ReviewItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const filtered = category === 'All' ? WEAPONS : WEAPONS.filter(w => w.category === category);

  async function loadCommunity(weaponName?: string) {
    try {
      const params = weaponName ? `?weaponName=${encodeURIComponent(weaponName)}` : '';
      const r = await api.get(`/loadouts${params}`);
      setCommunityLoadouts(r.data);
    } catch {}
  }

  async function loadReviews(loadoutId: string) {
    try {
      const r = await api.get(`/loadouts/${loadoutId}`);
      setLoadoutReviews(r.data.reviews || []);
    } catch {}
  }

  useEffect(() => { if (tab === 'community') loadCommunity(); }, [tab]);

  async function handleRefresh() {
    setRefreshing(true);
    if (tab === 'community') await loadCommunity();
    setRefreshing(false);
  }

  function openWeaponDetail(w: Weapon) {
    setSelected(w);
    loadCommunity(w.name);
  }

  function openLoadoutDetail(l: LoadoutItem) {
    setSelectedLoadout(l);
    loadReviews(l.id);
  }

  async function handleSubmitReview() {
    if (!selectedLoadout || reviewRating === 0) return;
    setSubmittingReview(true);
    try {
      await api.post(`/loadouts/${selectedLoadout.id}/review`, { rating: reviewRating, comment: reviewText.trim() || undefined });
      Alert.alert('Done', 'Your review has been submitted.');
      setReviewRating(0);
      setReviewText('');
      loadReviews(selectedLoadout.id);
      loadCommunity();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  }

  async function handleDeleteLoadout(id: string) {
    try {
      await api.delete(`/loadouts/${id}`);
      setSelectedLoadout(null);
      loadCommunity();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
    }
  }

  const s = selected || selectedLoadout;
  if (s) {
    const isWeapon = 'bestAttachments' in s && !('attachments' in s);
    const atts = isWeapon ? (s as Weapon).bestAttachments : (s as LoadoutItem).attachments;
    const name = isWeapon ? (s as Weapon).name : (s as LoadoutItem).weaponName;
    const cat = isWeapon ? (s as Weapon).category : (s as LoadoutItem).category;
    const color = isWeapon ? (s as Weapon).color : theme.primary;
    const tier = isWeapon ? (s as Weapon).tier : undefined;
    const desc = isWeapon ? (s as Weapon).desc : (s as LoadoutItem).description;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setSelected(null); setSelectedLoadout(null); }}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <ImageBackground source={WEAPON_IMAGES[name] || CATEGORY_IMAGES[cat]} style={styles.detailImage} imageStyle={{ borderRadius: 0 }} resizeMode="contain">
            <View style={[styles.detailOverlay, { backgroundColor: color + '50' }]}>
              {tier && <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[tier] }]}>
                <Text style={styles.tierBadgeText}>{tier}-TIER</Text>
              </View>}
              <Text style={styles.detailName}>{name}</Text>
              <Text style={styles.detailCategory}>{CATEGORY_ICONS[cat] || '🔫'} {cat}</Text>
              <Text style={styles.detailSource}>Warzone Season 3 · BO7</Text>
            </View>
          </ImageBackground>

          <View style={styles.detailBody}>
            {desc && <Text style={styles.detailDesc}>{desc}</Text>}

            <Text style={styles.buildTitle}>Loadout</Text>
            {atts.map((att: Attachment, i: number) => (
              <View key={i} style={[styles.attRow, { borderLeftColor: color }]}>
                <Text style={styles.attSlot}>{att.slot}</Text>
                <Text style={[styles.attName, { color: theme.text }]}>{att.name}</Text>
              </View>
            ))}

            {!isWeapon && (
              <View style={styles.loadoutMeta}>
                <Text style={styles.loadoutAuthor}>by {(s as LoadoutItem).user?.pseudo || 'Unknown'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <StarRating rating={(s as LoadoutItem).avgRating} />
                  <Text style={styles.reviewCount}>{`(${(s as LoadoutItem).reviewCount})`}</Text>
                </View>
                <TouchableOpacity style={[styles.deleteBtn, { borderColor: theme.error }]} onPress={() => handleDeleteLoadout((s as LoadoutItem).id)}>
                  <Text style={[styles.deleteBtnText, { color: theme.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isWeapon && (
              <>
                <Text style={styles.buildTitle}>Reviews & Ratings</Text>
                <View style={styles.reviewForm}>
                  <StarRating rating={reviewRating} size={24} interactive onRate={setReviewRating} />
                  <TextInput style={[styles.reviewInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={reviewText} onChangeText={setReviewText} placeholder="Write a comment (optional)" placeholderTextColor={theme.textMuted} multiline />
                  <TouchableOpacity style={[styles.submitReviewBtn, { backgroundColor: theme.primary, opacity: reviewRating === 0 || submittingReview ? 0.5 : 1 }]} onPress={handleSubmitReview} disabled={reviewRating === 0 || submittingReview}>
                    <Text style={styles.submitReviewText}>{submittingReview ? 'Submitting...' : 'Submit Review'}</Text>
                  </TouchableOpacity>
                </View>
                {loadoutReviews.length === 0 ? (
                  <Text style={styles.emptyReviews}>No reviews yet. Be the first!</Text>
                ) : (
                  loadoutReviews.map((rv) => (
                    <View key={rv.id} style={[styles.reviewCard, { backgroundColor: theme.surface }]}>
                      <View style={styles.reviewHeader}>
                        <Text style={[styles.reviewAuthor, { color: theme.text }]}>{rv.user.pseudo}</Text>
                        <StarRating rating={rv.rating} size={12} />
                      </View>
                      {rv.comment && <Text style={[styles.reviewComment, { color: theme.textSecondary }]}>{rv.comment}</Text>}
                    </View>
                  ))
                )}
              </>
            )}

            <Text style={styles.sectionTitle}>Community Loadouts for {name}</Text>
            {communityLoadouts.filter(l => l.weaponName === name).length === 0 ? (
              <Text style={styles.emptyText}>No community loadouts yet. Be the first to share yours!</Text>
            ) : (
              communityLoadouts.filter(l => l.weaponName === name).map((l) => (
                <TouchableOpacity key={l.id} style={[styles.communityCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { setSelected(null); openLoadoutDetail(l); }}>
                  <View style={styles.communityCardTop}>
                    <Text style={[styles.communityAuthor, { color: theme.textSecondary }]}>by {l.user.pseudo}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <StarRating rating={l.avgRating} size={11} />
                      <Text style={[styles.communityReviews, { color: theme.textMuted }]}>{`(${l.reviewCount})`}</Text>
                    </View>
                  </View>
                  {l.description && <Text style={[styles.communityDesc, { color: theme.textSecondary }]} numberOfLines={2}>{l.description}</Text>}
                </TouchableOpacity>
              ))
            )}
          </View>
          <View style={{ height: 60 }} />
        </ScrollView>

        <LoadoutForm visible={showForm} onClose={() => setShowForm(false)} onSaved={() => loadCommunity()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Warzone Meta</Text>
        <Text style={styles.subtitle}>Season 3 Reloaded · BO7</Text>
      </View>

      <View style={styles.tabRow}>
        {(['weapons', 'community'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'weapons' ? '🔫 Weapons' : '👥 Community'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'weapons' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipActive]} onPress={() => setCategory(c)}>
                <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filtered}
            numColumns={2}
            columnWrapperStyle={styles.colWrap}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.weaponCard} activeOpacity={0.8} onPress={() => openWeaponDetail(item)}>
                <ImageBackground source={WEAPON_IMAGES[item.name] || CATEGORY_IMAGES[item.category]} style={styles.weaponBg} imageStyle={styles.weaponBgImage} resizeMode="contain">
                  <View style={[styles.weaponOverlay, { backgroundColor: item.color + '30' }]}>
                    <View style={[styles.tierTag, { backgroundColor: TIER_COLORS[item.tier] }]}>
                      <Text style={styles.tierTagText}>{item.tier}</Text>
                    </View>
                    <Text style={styles.weaponName}>{item.name}</Text>
                    <Text style={styles.weaponCat}>{CATEGORY_ICONS[item.category]} {item.category}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔫</Text>
                <Text style={styles.emptyTitle}>No weapons in {category}</Text>
              </View>
            }
          />
        </>
      ) : (
        <FlatList
          data={communityLoadouts}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.communityCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => openLoadoutDetail(item)}>
              <View style={styles.communityCardHeader}>
                <View>
                  <Text style={[styles.communityWeapon, { color: theme.text }]}>{item.weaponName}</Text>
                  <Text style={[styles.communityAuthor, { color: theme.textMuted }]}>by {item.user.pseudo} · {item.category}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <StarRating rating={item.avgRating} size={12} />
                  <Text style={[styles.communityReviews, { color: theme.textMuted }]}>{item.reviewCount} review{item.reviewCount !== 1 ? 's' : ''}</Text>
                </View>
              </View>
              {item.description && <Text style={[styles.communityDesc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>}
              <View style={styles.communityAtts}>
                {item.attachments.slice(0, 3).map((a, i) => (
                  <Text key={i} style={[styles.communityAtt, { backgroundColor: theme.surfaceLight }]}>{a.slot}: {a.name}</Text>
                ))}
                {item.attachments.length > 3 && <Text style={[styles.communityAtt, { backgroundColor: theme.surfaceLight }]}>+{item.attachments.length - 3}</Text>}
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <TouchableOpacity style={[styles.addLoadoutBtn, { borderColor: theme.primary }]} onPress={() => setShowForm(true)}>
              <Text style={[styles.addLoadoutText, { color: theme.primary }]}>+ Submit Your Loadout</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No community loadouts</Text>
              <Text style={styles.emptyText}>Be the first to share your build!</Text>
            </View>
          }
        />
      )}

      <LoadoutForm visible={showForm} onClose={() => setShowForm(false)} onSaved={() => { if (tab === 'community') loadCommunity(); }} />
    </View>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '900', color: t.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: t.textMuted, paddingHorizontal: 20, marginBottom: 4 },
  backBtn: { fontSize: 16, color: t.primary, fontWeight: '700' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
  tabActive: { backgroundColor: t.primary, borderColor: t.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: t.textSecondary },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  catRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
  catChipActive: { backgroundColor: t.primary, borderColor: t.primary },
  catText: { fontSize: 12, fontWeight: '600', color: t.textSecondary },
  catTextActive: { color: '#fff', fontWeight: '700' },
  colWrap: { gap: 8 },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 20 },
  weaponCard: { width: CARD_W, height: 160, borderRadius: 14, overflow: 'hidden' },
  weaponBg: { width: '100%', height: '100%' },
  weaponBgImage: { borderRadius: 14 },
  weaponOverlay: { flex: 1, padding: 12, justifyContent: 'flex-end' },
  tierTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tierTagText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  weaponName: { fontSize: 16, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  weaponCat: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: t.textMuted },
  emptyText: { fontSize: 13, color: t.textMuted, textAlign: 'center', paddingHorizontal: 20, marginTop: 4 },
  detailImage: { width: '100%', height: 200 },
  detailOverlay: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  tierBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, marginBottom: 8 },
  tierBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  detailName: { fontSize: 30, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  detailCategory: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  detailSource: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  detailBody: { paddingHorizontal: 20, paddingTop: 16 },
  detailDesc: { fontSize: 13, color: t.textSecondary, lineHeight: 20 },
  buildTitle: { fontSize: 16, fontWeight: '800', color: t.text, marginTop: 20, marginBottom: 12 },
  attRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: t.background, borderRadius: 10, padding: 12, marginBottom: 6, borderLeftWidth: 3 },
  attSlot: { fontSize: 11, color: t.textMuted, fontWeight: '600', width: 80 },
  attName: { fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: t.text, marginTop: 20, marginBottom: 10 },
  communityCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 8 },
  communityCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  communityWeapon: { fontSize: 16, fontWeight: '800' },
  communityAuthor: { fontSize: 11, marginTop: 2 },
  communityReviews: { fontSize: 10, marginTop: 2 },
  communityDesc: { fontSize: 12, marginTop: 6, lineHeight: 17 },
  communityAtts: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  communityAtt: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, color: t.textSecondary },
  communityCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loadoutMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 },
  loadoutAuthor: { fontSize: 12, color: t.textMuted, fontStyle: 'italic' },
  reviewCount: { fontSize: 11, color: t.textMuted },
  deleteBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { fontSize: 12, fontWeight: '700' },
  reviewForm: { marginBottom: 16, gap: 8 },
  reviewInput: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  submitReviewBtn: { padding: 12, borderRadius: 10, alignItems: 'center' },
  submitReviewText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyReviews: { fontSize: 13, color: t.textMuted, textAlign: 'center', marginVertical: 16 },
  reviewCard: { borderRadius: 10, padding: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: 13, fontWeight: '700' },
  reviewComment: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  addLoadoutBtn: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  addLoadoutText: { fontWeight: '700', fontSize: 13 },
});