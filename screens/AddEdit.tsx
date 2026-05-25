import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomAlert } from '../components/Alert';
import { useTheme } from '../context/Theme';
import { auth, db } from '../services/firebase';

export default function AddEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isDark } = useTheme();
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

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

  const isEditing = !!id;

  const colors = {
    background: isDark ? '#121212' : '#f8faff',
    card: isDark ? '#1e1e1e' : '#fff',
    text: isDark ? '#ffffff' : '#1a1a2e',
    subtext: isDark ? '#a0a0a0' : '#64748b',
    border: isDark ? '#333' : '#e2e8f0',
    primary: '#4f46e5',
    divider: isDark ? '#333' : '#f1f5f9',
  };

  const [initialData, setInitialData] = useState({ title: '', body: '' });

  useEffect(() => {
    if (isEditing) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    setFetching(true);
    try {
      const docRef = doc(db, 'notes', id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fetchedTitle = data.title || '';
        const fetchedBody = data.body || '';
        setTitle(fetchedTitle);
        setBody(fetchedBody);
        setInitialData({ title: fetchedTitle, body: fetchedBody });
      } else {
        showAlert("Error", "Note not found.", "error", () => router.back());
      }
    } catch (error) {
      console.error("Error fetching note:", error);
      showAlert("Error", "Could not fetch note details.", "error");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle && !trimmedBody) {
      showAlert("Empty Note", "Please add some content to your note.", "info");
      return;
    }

    // Check if changes were made
    if (isEditing && trimmedTitle === initialData.title && trimmedBody === initialData.body) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      if (isEditing) {
        const docRef = doc(db, 'notes', id as string);
        await updateDoc(docRef, {
          title: trimmedTitle,
          body: trimmedBody,
          updatedAt: serverTimestamp(),
        });
        showAlert("Success", "Note updated successfully!", "success", () => router.back());
      } else {
        await addDoc(collection(db, 'notes'), {
          userId: user.uid,
          title: trimmedTitle,
          body: trimmedBody,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showAlert("Success", "Note created successfully!", "success", () => router.back());
      }
    } catch (error) {
      console.error("Error saving note:", error);
      showAlert("Error", "Could not save the note.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={[styles.headerBackButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? 'Edit Note' : 'New Note'}
        </Text>

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Editor */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.editorContainer}>
            
            {/* Title */}
            <TextInput
              style={[styles.titleInput, { color: colors.text }]}
              placeholder="Title"
              placeholderTextColor={colors.subtext}
              value={title}
              onChangeText={setTitle}
            />

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            {/* Body */}
            <TextInput
              style={[styles.bodyInput, { color: colors.text }]}
              placeholder="Start writing your thoughts..."
              placeholderTextColor={colors.subtext}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Background Circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

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
  flex: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    height: 80,
    zIndex: 20,
  },
  headerBackButton: {
    padding: 8,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Editor
  scrollContent: {
    flexGrow: 1,
  },
  editorContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    minHeight: 500,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  bodyInput: {
    fontSize: 18,
    lineHeight: 28,
    flex: 1,
  },

  // Background Circles
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: '#4f46e5',
    opacity: 0.03,
    zIndex: -1,
  },
  circle1: {
    width: 400,
    height: 400,
    top: -150,
    right: -150,
  },
  circle2: {
    width: 300,
    height: 300,
    bottom: -50,
    left: -100,
  },
});