import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomAlert } from '../components/Alert';
import { useTheme } from '../context/Theme';
import { updateUserProfile } from '../services/auth';
import { auth, db } from '../services/firebase';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info', onClose?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onClose });
  };

  const [initialData, setInitialData] = useState({ firstName: '', lastName: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        const fName = data.firstName || '';
        const lName = data.lastName || '';
        setProfile(data);
        setFirstName(fName);
        setLastName(lName);
        setInitialData({ firstName: fName, lastName: lName });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showAlert('Error', 'Failed to load profile information.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      showAlert('Required', 'Please enter both first and last name.', 'info');
      return;
    }

    // Check if changes were made
    if (trimmedFirstName === initialData.firstName && trimmedLastName === initialData.lastName) {
      showAlert('No Changes', 'You haven\'t made any changes to your profile.', 'info');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user!.uid, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });
      setInitialData({ firstName: trimmedFirstName, lastName: trimmedLastName });
      showAlert('Success', 'Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('Error', 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const colors = {
    background: isDark ? '#121212' : '#f8faff',
    card: isDark ? '#1e1e1e' : '#fff',
    text: isDark ? '#ffffff' : '#1a1a2e',
    subtext: isDark ? '#a0a0a0' : '#64748b',
    border: isDark ? '#333' : '#e2e8f0',
    primary: '#4f46e5',
    danger: '#ef4444',
    inputBg: isDark ? '#2d2d2d' : '#fff',
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Picture Section */}
        <View style={styles.profilePicSection}>
          <View style={styles.imageWrapper}>
            <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
              <Text style={styles.placeholderText}>
                {firstName.charAt(0) || 'U'}
              </Text>
            </View>
          </View>
          <Text style={[styles.userEmail, { color: colors.subtext }]}>{profile?.email}</Text>
        </View>

        {/* Settings Groups */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>PERSONAL INFORMATION</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>First Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor={colors.subtext}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>Last Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor={colors.subtext}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
            onPress={handleUpdateProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>PREFERENCES</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsLabel}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={22} color={isDark ? "#fbbf24" : "#4f46e5"} />
                <Text style={[styles.settingsText, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#cbd5e1', true: '#818cf8' }}
                thumbColor={isDark ? '#4f46e5' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.danger }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.onClose) alertConfig.onClose();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profilePicSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  placeholderImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 15,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputGroup: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
  },
  saveBtn: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  settingsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
