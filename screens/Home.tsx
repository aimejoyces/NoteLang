import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import LoadingScreen from '../components/Loading';
import { useTheme } from '../context/Theme';
import { auth, db } from '../services/firebase';

type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: any;
  updatedAt: any;
  userId: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firstName, setFirstName] = useState('');

  const colors = {
    background: isDark ? '#121212' : '#f8faff',
    card: isDark ? '#1e1e1e' : '#fff',
    text: isDark ? '#fff' : '#1a1a2e',
    subtext: isDark ? '#a0a0a0' : '#64748b',
    primary: '#4f46e5',
    danger: '#ef4444',
  };

  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};
    let unsubscribeNotes: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Real-time listener for user profile
        const userDocRef = doc(db, "users", user.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            setFirstName(userDoc.data().firstName || '');
          }
        }, (error) => {
          console.error("Profile listener error:", error);
        });

        // Real-time listener for notes (removed orderBy to avoid index permission issues)
        const q = query(
          collection(db, 'notes'),
          where('userId', '==', user.uid)
        );

        unsubscribeNotes = onSnapshot(q, (snapshot) => {
          const notesList: Note[] = [];
          snapshot.forEach((doc) => {
            notesList.push({ id: doc.id, ...doc.data() } as Note);
          });
          
          // Sort client-side by updatedAt desc
          notesList.sort((a, b) => {
            const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt || 0);
            const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt || 0);
            return timeB - timeA;
          });

          setNotes(notesList);
          setLoading(false);
        }, (error) => {
          console.error("Notes listener error:", error);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
      unsubscribeNotes();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // onSnapshot handles real-time updates, so we just simulate a brief delay for UX
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'notes', id));
            } catch (error) {
              Alert.alert("Error", "Could not delete the note.");
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity 
      style={[styles.noteCard, { backgroundColor: colors.card }]}
      onPress={() => router.push({ pathname: '/screens/add-edit', params: { id: item.id } })}
    >
      <View style={styles.noteContent}>
        <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title || 'Untitled Note'}
        </Text>
        <Text style={[styles.noteBody, { color: colors.subtext }]} numberOfLines={2}>
          {item.body || 'No content...'}
        </Text>

        <View style={styles.noteFooter}>
          <Ionicons name="time-outline" size={12} color={colors.subtext} />
          <Text style={[styles.noteDate, { color: colors.subtext }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Background circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Notes</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Capture your thoughts
          </Text>
        </View>

        <View style={styles.headerRight}>
          {firstName ? (
            <Text style={[styles.userName, { color: colors.text }]}>
              Hi, {firstName}
            </Text>
          ) : null}
          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => router.push('/screens/profile')}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {firstName ? firstName.charAt(0).toUpperCase() : (auth.currentUser?.email?.charAt(0).toUpperCase() || 'U')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {notes.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Notes
            </Text>

            <FlatList
              data={notes}
              keyExtractor={(item) => item.id}
              renderItem={renderNote}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
              }
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="document-text-outline" size={60} color={colors.primary + '80'} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No notes yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.subtext }]}>
              Your ideas deserve a space. Start by creating your first note!
            </Text>
            <TouchableOpacity 
              style={[styles.createFirstBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/screens/add-edit')}
            >
              <Text style={styles.createFirstBtnText}>Create Note</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/screens/add-edit')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40, // Increased top spacing
    paddingBottom: 20,
    zIndex: 10,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  userName: {
    fontSize: 15,
    fontWeight: '600',
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },

  profileBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  noteCard: {
    borderRadius: 20, // More rounded
    padding: 20, // More padding
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },

  noteContent: {
    flex: 1,
  },

  noteTitle: {
    fontSize: 17,
    fontWeight: '700',
  },

  noteBody: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },

  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 5,
  },

  noteDate: {
    fontSize: 12,
  },

  deleteBtn: {
    padding: 10,
    marginLeft: 10,
  },

  fab: {
    position: 'absolute',
    bottom: 40, // Moved upward
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },

  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
    marginBottom: 32,
  },

  createFirstBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 18,
    elevation: 4,
  },

  createFirstBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: '#4f46e5',
    opacity: 0.05, // Match Welcome screen
    zIndex: -1,
  },

  circle1: {
    width: 400,
    height: 400,
    top: -150,
    right: -150,
  },

  circle2: {
    width: 250, // Slightly adjusted
    height: 250,
    bottom: 150, // Moved up like in Welcome part
    left: -80,
  },
});