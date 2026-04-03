import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../constants/colors';
import {
  getNotifications,
  markAllNotificationsSeen,
  markNotificationSeen,
  MobileNotification,
  subscribeToNotificationChanges,
} from '../services/notification.service';

function formatTime(createdAt: string) {
  const date = new Date(createdAt);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-IN');
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const items = await getNotifications(40);
      setNotifications(items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeToNotificationChanges(() => {
      void load();
    });

    return unsubscribe;
  }, [load]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const handleClearAll = async () => {
    await markAllNotificationsSeen(notifications);
    await load();
  };

  const renderItem = ({ item }: { item: MobileNotification }) => {
    const accent =
      item.severity === 'high'
        ? colors.error
        : item.severity === 'medium'
          ? colors.warning
          : colors.primary;

    return (
      <TouchableOpacity
        style={[s.card, !item.read && s.cardUnread]}
        onPress={async () => {
          await markNotificationSeen(item.id);
          await load();
        }}
      >
        <View style={[s.severityBar, { backgroundColor: accent }]} />
        <View style={s.cardContent}>
          <View style={s.cardHeader}>
            <View style={s.cardTitleWrap}>
              <Text style={s.cardTitle}>{item.title}</Text>
              <Text style={s.cardTime}>{formatTime(item.createdAt)}</Text>
            </View>
            <View style={[s.badge, { borderColor: accent, backgroundColor: `${accent}14` }]}>
              <Text style={[s.badgeText, { color: accent }]}>{item.action.replace('_', ' ')}</Text>
            </View>
          </View>

          <Text style={s.cardMessage}>{item.message}</Text>

          <View style={s.metaRow}>
            <Text style={s.metaText}>{item.entityType.replace('ca_', '').replace('_', ' ')}</Text>
            {!item.read && <Text style={s.unreadDot}>Unread</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>Activity Feed</Text>
          <Text style={s.title}>Notifications</Text>
          <Text style={s.subtitle}>{unreadCount} unread updates from your workspace</Text>
        </View>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={s.toolbar}>
        <View style={s.toolbarPill}>
          <Text style={s.toolbarPillText}>{notifications.length} items</Text>
        </View>
        <TouchableOpacity style={s.toolbarAction} onPress={handleClearAll} disabled={notifications.length === 0}>
          <Text style={s.toolbarActionText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyGlyph}>
                <Text style={s.emptyGlyphText}>OK</Text>
              </View>
              <Text style={s.emptyTitle}>No notifications yet</Text>
              <Text style={s.emptyText}>Recent task, payment, and document updates will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: colors.surfaceContainer,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineLighter,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8 },
  title: { color: colors.onSurface, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.onSurfaceVariant, fontSize: 13, marginTop: 6, maxWidth: 250 },
  backBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surfaceLow, borderWidth: 1, borderColor: colors.outlineLighter },
  backText: { color: colors.onSurface, fontWeight: '700' },
  toolbar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.outlineLighter },
  toolbarPillText: { color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '700' },
  toolbarAction: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceHigh },
  toolbarActionText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 28 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardUnread: {
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceLow,
  },
  severityBar: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  cardTitleWrap: { flex: 1 },
  cardTitle: { color: colors.onSurface, fontSize: 15, fontWeight: '800' },
  cardTime: { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 4 },
  badge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardMessage: { color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 19 },
  metaRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  unreadDot: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  empty: { padding: 48, alignItems: 'center' },
  emptyGlyph: {
    width: 62,
    height: 62,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGlyphText: { fontSize: 16, fontWeight: '800', color: colors.onSurfaceVariant, letterSpacing: 0.7 },
  emptyTitle: { color: colors.onSurface, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  emptyText: { color: colors.onSurfaceVariant, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
