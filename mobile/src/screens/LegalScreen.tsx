import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useMemo } from 'react';
import { useTheme } from '../utils/theme';

const SECTIONS = ['CGU', 'Confidentialité', 'Fair Play', 'Mentions Légales'];

const CONTENT: Record<string, string> = {
  'CGU': `CONDITIONS GÉNÉRALES D'UTILISATION

1. ACCEPTATION
En utilisant cette application, vous acceptez ces conditions générales. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.

2. DESCRIPTION DU SERVICE
Cette application est une plateforme de compétition esports où les utilisateurs peuvent créer et rejoindre des parties, gagner des pièces virtuelles et des points d'expérience, et échanger ces récompenses contre des cartes cadeaux.

3. CRÉATION DE COMPTE
- Vous devez avoir au moins 13 ans pour créer un compte.
- Vous êtes responsable de la confidentialité de vos identifiants.
- Un seul compte par personne est autorisé.
- Les informations fournies doivent être exactes et à jour.

4. MONNAIE VIRTUELLE
- Les pièces et l'XP sont des récompenses virtuelles sans valeur monétaire réelle.
- Elles ne peuvent pas être échangées contre de l'argent réel.
- Aucun remboursement n'est possible pour les pièces dépensées.
- Les soldes peuvent être ajustés en cas d'activité frauduleuse détectée.

5. CONDUITE DES UTILISATEURS
Il est interdit de :
- Utiliser des programmes tiers (cheats, bots, mods)
- Créer des comptes multiples pour exploiter le système
- Abuser des mécanismes de gain de pièces/XP
- Tenir des propos injurieux, discriminatoires ou harcelants
- Organiser des matchs truqués pour farmer des récompenses

6. ANTI-FRAUDE
- Un système de détection de farming est actif.
- Les récompenses journalières sont limitées (500 XP max, 1000 pièces max).
- Les comptes suspects peuvent être suspendus ou bannis.
- Tout signalement est examiné par notre équipe.

7. PROPRIÉTÉ INTELLECTUELLE
- Les images et marques utilisées appartiennent à leurs propriétaires respectifs.
- Le code et le design de l'application sont protégés.

8. LIMITATION DE RESPONSABILITÉ
- Le service est fourni "en l'état" sans garantie.
- Nous ne sommes pas responsables des pertes de données ou d'interruptions de service.
- Nous ne sommes pas responsables des dommages indirects liés à l'utilisation de l'application.

9. SUSPENSION ET RÉSILIATION
Nous nous réservons le droit de suspendre ou supprimer tout compte en cas de violation des présentes conditions.

10. MODIFICATIONS
Ces conditions peuvent être modifiées à tout moment. Les utilisateurs seront informés des changements importants.`,

  'Confidentialité': `POLITIQUE DE CONFIDENTIALITÉ

1. DONNÉES COLLECTÉES
Nous collectons les données suivantes :
- Informations d'inscription (pseudo, email, mot de passe chiffré)
- Statistiques de jeu (victoires, défaites, XP, pièces)
- Historique des matchs
- Signalements et preuves soumises
- Historique des échanges de récompenses

2. UTILISATION DES DONNÉES
Vos données sont utilisées pour :
- Fournir et améliorer le service
- Classer les joueurs et attribuer des récompenses
- Détecter et prévenir la fraude
- Communiquer des informations importantes
- Analyser l'utilisation de l'application

3. STOCKAGE DES DONNÉES
- Les mots de passe sont chiffrés (bcrypt).
- Les données sont stockées sur des serveurs sécurisés.
- Nous conservons vos données tant que votre compte est actif.

4. PARTAGE DES DONNÉES
- Nous ne vendons pas vos données personnelles.
- Votre pseudo et vos statistiques sont visibles publiquement dans le classement.
- Nous pouvons partager des données si requis par la loi.

5. VOS DROITS (RGPD)
Conformément au RGPD, vous avez droit :
- D'accès à vos données personnelles
- De rectification de vos données
- D'effacement de vos données (droit à l'oubli)
- De limitation du traitement
- De portabilité de vos données
- D'opposition au traitement

Pour exercer ces droits, contactez-nous à privacy@esports-platform.app

6. COOKIES
Cette application utilise des cookies essentiels au fonctionnement. Aucun cookie tiers n'est utilisé.

7. SÉCURITÉ
Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données contre tout accès non autorisé.

8. CONTACT
Pour toute question concernant vos données : privacy@esports-platform.app`,

  'Fair Play': `RÈGLES DE FAIR PLAY

1. ESPRIT SPORTIF
- Respectez tous les joueurs, quel que soit leur niveau.
- Les insultes, menaces et discriminations sont interdites.
- Jouez pour vous amuser et progresser.

2. TRICHES ET EXPLOITS
- L'utilisation de cheats, aimbots, wallhacks ou tout logiciel tiers est strictement interdite.
- L'exploitation de bugs est interdite et doit être signalée.
- La création de comptes multiples (multi-comptes) est interdite.

3. FARMING
- Il est interdit d'organiser des matchs uniquement pour gagner des récompenses.
- Jouer en groupe avec les mêmes personnes de façon répétée peut être détecté comme du farming.
- Les récompenses sont limitées quotidiennement pour garantir l'équité.

4. MATCH TRUQUÉ
- Arranger le résultat d'un match à l'avance est interdit.
- Laisser un adversaire gagner intentionnellement est interdit.
- Tout match suspect sera signalé et examiné.

5. SIGNALEMENT
- Tout joueur peut signaler un comportement suspect.
- Les signalements sont examinés par notre équipe.
- Les fausses signalements peuvent entraîner des sanctions.

6. SANCTIONS
Les sanctions peuvent inclure :
- Avertissement
- Réduction des récompenses
- Suspension temporaire
- Bannissement permanent
- Réinitialisation du compte

7. CONFIRMATION DES RÉSULTATS
- Les joueurs doivent confirmer leurs résultats de match.
- Des preuves (captures d'écran) peuvent être demandées.
- Les matchs non confirmés peuvent être annulés.`,

  'Mentions Légales': `MENTIONS LÉGALES

1. ÉDITEUR DE L'APPLICATION
Cette application est éditée par :
Esports Platform
Email : contact@esports-platform.app

2. HÉBERGEMENT
L'application est hébergée sur les serveurs de :
Vercel Inc. / Railway Platform

3. PROPRIÉTÉ INTELLECTUELLE
Les marques et logos de Call of Duty, Warzone, PlayStation, Xbox, Steam, Netflix, Spotify, Uber Eats, Amazon et autres marques citées sont la propriété de leurs détenteurs respectifs.

4. PROTECTION DES DONNÉES
Conformément à la loi Informatique et Libertés et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données.

5. LOI APPLICABLE
Les présentes conditions sont régies par le droit français. Tout litige relève des tribunaux compétents.

6. CONTACT
Pour toute question :
Email : contact@esports-platform.app`,
};

export default function LegalScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [section, setSection] = useState('CGU');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Legal</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.tab, section === s && styles.tabActive]}
            onPress={() => setSection(s)}
          >
            <Text style={[styles.tabText, section === s && styles.tabTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.bodyText}>{CONTENT[section]}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  title: { fontSize: 26, fontWeight: '900', color: t.text, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8, letterSpacing: -0.5 },
  tabRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
  tabActive: { backgroundColor: t.primary, borderColor: t.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: t.textSecondary },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  content: { paddingHorizontal: 20, flex: 1 },
  bodyText: { fontSize: 13, color: t.textSecondary, lineHeight: 22 },
});
