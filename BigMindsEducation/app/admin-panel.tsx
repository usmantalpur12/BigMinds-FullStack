import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { backendAPI, getFullUrl } from './services/backendAPI';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from './context/AuthContext';
import { colors, spacing, borderRadius, shadows, typography, responsive } from './theme/colors';

// Mock system stats for fallback
const mockSystemStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalCourses: 0,
  totalForums: 0,
  pendingApprovals: 0,
  systemHealth: 'Excellent',
  storageUsed: '0 GB',
  storageTotal: '10 GB',
};

export default function AdminPanelScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [forumRequests, setForumRequests] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(mockSystemStats);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [autoApproval, setAutoApproval] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();

  // Load admin data
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        backendAPI.get('/users/admin/all'),
        backendAPI.get('/users/admin/stats')
      ]);

      setUsers(usersRes.data?.data || []);
      setSystemStats(statsRes.data?.data || mockSystemStats);
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load system data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const [userRes, enrollmentsRes, analyticsRes] = await Promise.all([
        backendAPI.get(`/users/${userId}`),
        backendAPI.get(`/users/${userId}/enrollments`),
        backendAPI.get(`/gamification/analytics/${userId}`).catch(() => ({ data: { data: null } }))
      ]);

      setUserDetails({
        ...userRes.data?.data,
        enrollments: enrollmentsRes.data?.data || [],
        analytics: analyticsRes.data?.data || {}
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      Alert.alert('Error', 'Failed to load user details');
    }
  };

  const handleUserAction = (userId: string, action: string) => {
    const user = users.find(u => (u._id || u.id) === userId);
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name : 'this user';

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (action === 'delete') {
                await backendAPI.delete(`/users/${userId}`);
                setUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
                if (selectedUser && (selectedUser._id || selectedUser.id) === userId) {
                  setSelectedUser(null);
                }
                Alert.alert('Success', 'User deleted successfully');
              } else if (action === 'suspend' || action === 'activate') {
                const isActive = action === 'activate';
                await backendAPI.put(`/users/${userId}/status`, { isActive });
                setUsers(prev => prev.map(u => 
                  (u._id || u.id) === userId 
                    ? { ...u, isActive }
                    : u
                ));
                Alert.alert('Success', `User ${action}d successfully`);
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || `Failed to ${action} user`);
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: any }) => {
    const userId = item._id || item.id;
    const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.name || 'Unknown User';
    const isActive = item.isActive !== false;
    
    return (
      <TouchableOpacity 
        style={styles.userCard}
        onPress={() => {
          router.push({ pathname: '/screens/ProfileScreen', params: { userId } } as any);
        }}
      >
        <View style={styles.userHeader}>
          <View style={styles.avatarContainer}>
            {item.avatar || item.avatarSmall ? (
              <Image 
                source={{ uri: getFullUrl(item.avatarSmall || item.avatar) || undefined }} 
                style={styles.avatarSmall} 
              />
            ) : (
              <View style={styles.avatarPlaceholderSmall}>
                <Text style={styles.avatarTextSmall}>{fullName.charAt(0)}</Text>
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={styles.userMeta}>
              <Text style={styles.userRole}>{item.role}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isActive ? '#D1FAE5' : '#FEE2E2' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: isActive ? '#065F46' : '#991B1B' }
                ]}>
                  {isActive ? 'active' : 'inactive'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.userStats}>
            <Text style={styles.statText}>
              {item.role === 'teacher' ? `Instructor` : `Student`}
            </Text>
            <Text style={styles.lastActive}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.userActions}>
          {isActive ? (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleUserAction(userId, 'suspend')}
            >
              <Text style={styles.actionButtonText}>Deactivate</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.activateButton]}
              onPress={() => handleUserAction(userId, 'activate')}
            >
              <Text style={[styles.actionButtonText, styles.activateButtonText]}>Activate</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleUserAction(userId, 'delete')}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, '#1e3a8a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Admin Control</Text>
            <Text style={styles.headerSubtitle}>System Management</Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadAdminData();
          }} />
        }
      >
        {selectedTab === 'dashboard' && (
          <View style={styles.dashboardContainer}>
            <Text style={styles.sectionTitle}>System Overview</Text>
            {/* System Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
                <View style={styles.statIconBox}>
                  <Text style={{ fontSize: 20 }}>👥</Text>
                </View>
                <View>
                  <Text style={styles.statNumber}>{systemStats.totalUsers || 0}</Text>
                  <Text style={styles.statLabel}>Total Users</Text>
                </View>
              </View>
              <View style={[styles.statCard, { borderLeftColor: colors.success, borderLeftWidth: 4 }]}>
                <View style={styles.statIconBox}>
                  <Text style={{ fontSize: 20 }}>⚡</Text>
                </View>
                <View>
                  <Text style={styles.statNumber}>{systemStats.activeUsers || 0}</Text>
                  <Text style={styles.statLabel}>Active Now</Text>
                </View>
              </View>
              <View style={[styles.statCard, { borderLeftColor: colors.warning, borderLeftWidth: 4 }]}>
                <View style={styles.statIconBox}>
                  <Text style={{ fontSize: 20 }}>📚</Text>
                </View>
                <View>
                  <Text style={styles.statNumber}>{systemStats.totalCourses || 0}</Text>
                  <Text style={styles.statLabel}>Courses</Text>
                </View>
              </View>
              <View style={[styles.statCard, { borderLeftColor: colors.accent, borderLeftWidth: 4 }]}>
                <View style={styles.statIconBox}>
                  <Text style={{ fontSize: 20 }}>💬</Text>
                </View>
                <View>
                  <Text style={styles.statNumber}>{systemStats.totalForums || 0}</Text>
                  <Text style={styles.statLabel}>Forums</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions for Admin */}
            <View style={styles.healthCard}>
              <Text style={styles.healthTitle}>System Health</Text>
              <View style={styles.healthStats}>
                <View style={styles.healthItem}>
                  <Text style={styles.healthLabel}>Status</Text>
                  <View style={styles.healthIndicator}>
                    <View style={[styles.healthDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.healthValue, { color: colors.success }]}>{systemStats.systemHealth || 'Operational'}</Text>
                  </View>
                </View>
                <View style={styles.healthItem}>
                  <Text style={styles.healthLabel}>Storage Usage</Text>
                  <Text style={styles.healthValue}>{systemStats.storageUsed || '1.2 GB'} / 10 GB</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressThumb, { width: '12%', backgroundColor: colors.primary }]} />
                </View>
              </View>
            </View>
          </View>
        )}

        {(selectedTab === 'teachers' || selectedTab === 'students') && (
          <View style={styles.usersContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedTab === 'teachers' ? 'Instructors' : 'Students'}
              </Text>
              <View style={styles.userCountBadge}>
                <Text style={styles.userCountText}>
                  {users.filter(u => u.role === (selectedTab === 'teachers' ? 'teacher' : 'student')).length}
                </Text>
              </View>
            </View>
            <FlatList
              data={users.filter(u => u.role === (selectedTab === 'teachers' ? 'teacher' : 'student'))}
              renderItem={renderUserItem}
              keyExtractor={(item) => item._id || item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No {selectedTab} found in the system.</Text>
                </View>
              }
            />
          </View>
        )}

        {selectedTab === 'profile' && (
          <View style={styles.profileTabContainer}>
            <View style={styles.adminInfoCard}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                style={styles.adminGradient}
              >
                <View style={styles.adminProfileHeader}>
                   {user?.avatar ? (
                     <Image source={{ uri: getFullUrl(user.avatar) || '' }} style={styles.adminAvatarLarge} />
                   ) : (
                     <View style={styles.adminAvatarPlaceholder}>
                       <Text style={styles.adminAvatarLetter}>{user?.firstName?.charAt(0) || 'A'}</Text>
                     </View>
                   )}
                   <Text style={styles.adminNameText}>{user?.firstName} {user?.lastName}</Text>
                   <Text style={styles.adminEmailText}>{user?.email}</Text>
                </View>
              </LinearGradient>

              <View style={styles.adminActionsList}>
                <TouchableOpacity style={styles.adminActionButton} onPress={() => router.push('/admin/profile' as any)}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>👤</Text>
                  <Text style={styles.adminActionText}>Update Profile</Text>
                  <Text style={{ color: colors.textSecondary }}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.adminActionButton} onPress={() => router.push('/change-password' as any)}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>🔒</Text>
                  <Text style={styles.adminActionText}>Security Settings</Text>
                  <Text style={{ color: colors.textSecondary }}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.adminActionButton, { marginTop: 20, borderTopWidth: 0 }]} 
                  onPress={() => {
                    Alert.alert('Logout', 'Are you sure you want to logout?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Logout', style: 'destructive', onPress: () => logout() }
                    ]);
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 12 }}>🚪</Text>
                  <Text style={[styles.adminActionText, { color: colors.error }]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.appVersionSection}>
              <Text style={styles.versionText}>BigMinds Admin v1.0.2</Text>
              <Text style={styles.copyrightText}>© 2026 BigMinds Education</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: 'dashboard', label: 'Home', icon: '🏠' },
          { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
          { id: 'students', label: 'Students', icon: '🎓' },
          { id: 'profile', label: 'Profile', icon: '👤' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => setSelectedTab(tab.id)}
          >
            <View style={[
              styles.navIconContainer,
              selectedTab === tab.id && styles.navIconActive
            ]}>
              <Text style={[
                styles.navIcon,
                { opacity: selectedTab === tab.id ? 1 : 0.6 }
              ]}>
                {tab.icon}
              </Text>
            </View>
            <Text style={[
              styles.navLabel,
              selectedTab === tab.id && styles.navLabelActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    ...shadows.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.surface,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.surface,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  adminBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  healthCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  healthStats: {
    gap: spacing.md,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressThumb: {
    height: '100%',
    borderRadius: 3,
  },
  usersContainer: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  userCountBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  userCountText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  avatarSmall: {
    width: 50,
    height: 50,
  },
  avatarPlaceholderSmall: {
    width: 50,
    height: 50,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userRole: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  userStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  lastActive: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  activateButton: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
  },
  activateButtonText: {
    color: colors.success,
  },
  deleteButton: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '30',
  },
  deleteButtonText: {
    color: colors.error,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textLight,
    fontSize: 14,
  },
  profileTabContainer: {
    padding: spacing.lg,
  },
  adminInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  adminGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  adminProfileHeader: {
    alignItems: 'center',
  },
  adminAvatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: spacing.md,
  },
  adminAvatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: spacing.md,
  },
  adminAvatarLetter: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.surface,
  },
  adminNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.surface,
  },
  adminEmailText: {
    fontSize: 14,
    color: colors.surface,
    opacity: 0.8,
  },
  adminActionsList: {
    padding: spacing.md,
  },
  adminActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  adminActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  appVersionSection: {
    alignItems: 'center',
    marginTop: 40,
    opacity: 0.5,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  copyrightText: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 20,
    ...shadows.lg,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  navIconActive: {
    backgroundColor: colors.primary + '15',
  },
  navIcon: {
    fontSize: 22,
  },
  navLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    minHeight: '70%',
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  profileSection: {
    padding: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  profileAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  avatarLarge: {
    width: 80,
    height: 80,
  },
  avatarTextLarge: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary + '10',
    color: colors.primary,
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  profileRole: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  analyticsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  enrollmentItem: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  enrollmentInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  progressContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  enrollmentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.md,
  },
  enrollmentStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalActions: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalActionButton: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalDeleteButton: {
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  modalActionButtonText: {
    color: colors.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
});