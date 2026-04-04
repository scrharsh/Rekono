import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CatalogItem,
  createCatalogItem,
  deleteCatalogItem,
  fetchCatalogItems,
  hydrateBusinessContextFromServer,
  toggleCatalogFavorite,
} from '../services/businessProfile.service';
import colors from '../constants/colors';

export default function CatalogScreen() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [catalogScopeId, setCatalogScopeId] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', type: '', price: '' });

  const loadCatalog = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const context = await hydrateBusinessContextFromServer();
      const showroomId = context?.showroomId || await AsyncStorage.getItem('showroomId');
      const businessProfileId = context?.businessProfileId || await AsyncStorage.getItem('businessProfileId');
      const primaryScopeId = showroomId || businessProfileId;

      if (!primaryScopeId) {
        setCatalogScopeId('');
        setItems([]);
        return;
      }

      const primaryItems = await fetchCatalogItems(primaryScopeId);

      // Some legacy records may still be under businessProfileId; try fallback when primary returns empty.
      if (primaryItems.length === 0 && showroomId && businessProfileId && showroomId !== businessProfileId) {
        const fallbackItems = await fetchCatalogItems(businessProfileId);
        if (fallbackItems.length > 0) {
          setCatalogScopeId(businessProfileId);
          setItems(fallbackItems);
          return;
        }
      }

      setCatalogScopeId(primaryScopeId);
      setItems(primaryItems);
    } catch {
      setItems([]);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog(true);
  }, [loadCatalog]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalog();
    setRefreshing(false);
  };

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (favoritesOnly && !item.isFavorite) return false;
      if (!normalized) return true;
      return [item.name, item.category, item.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [favoritesOnly, items, query]);

  const clearForm = () => {
    setNewItem({ name: '', category: '', type: '', price: '' });
  };

  const handleAddItem = async () => {
    const price = Number(newItem.price);
    if (!catalogScopeId) {
      Alert.alert('Business context missing', 'Complete onboarding first, then add catalog items.');
      return;
    }
    if (!newItem.name.trim() || !newItem.category.trim() || Number.isNaN(price) || price <= 0) {
      Alert.alert('Validation', 'Name, category and a valid price are required.');
      return;
    }

    try {
      await createCatalogItem(catalogScopeId, {
        name: newItem.name.trim(),
        category: newItem.category.trim(),
        type: newItem.type.trim() || undefined,
        sellingPrice: price,
      });
      setShowAddModal(false);
      clearForm();
      await loadCatalog(true);
    } catch {
      Alert.alert('Failed', 'Unable to add catalog item right now.');
    }
  };

  const handleToggleFavorite = async (item: CatalogItem) => {
    if (!catalogScopeId || !item._id) return;

    try {
      await toggleCatalogFavorite(catalogScopeId, item._id);
      await loadCatalog();
    } catch {
      Alert.alert('Failed', 'Unable to update favorite status.');
    }
  };

  const handleDeleteItem = (item: CatalogItem) => {
    if (!catalogScopeId || !item._id) return;

    Alert.alert('Delete item', `Remove ${item.name || item.category} from catalog?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCatalogItem(catalogScopeId, item._id);
            await loadCatalog();
          } catch {
            Alert.alert('Failed', 'Unable to delete this item.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: CatalogItem }) => (
    <View style={s.itemCard}>
      <View style={{ flex: 1 }}>
        <Text style={s.itemName}>{item.name || item.category}</Text>
        <Text style={s.itemType}>{item.type || item.category}</Text>
      </View>
      <View style={s.itemActions}>
        <Text style={s.itemPrice}>₹{item.sellingPrice || 0}</Text>
        <View style={s.inlineActions}>
          <TouchableOpacity style={s.starBtn} onPress={() => handleToggleFavorite(item)}>
            <Text style={s.starText}>{item.isFavorite ? '★' : '☆'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteItem(item)}>
            <Text style={s.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={s.headerGlow} />
      <View style={s.header}>
        <View style={s.headerBadge}><Text style={s.headerBadgeText}>Catalog Intelligence</Text></View>
        <Text style={s.title}>Saved Items</Text>
        <Text style={s.subtitle}>Your most-used items and services, ready for fast sale entry.</Text>
      </View>

      <View style={s.toolbar}>
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, category, type"
          placeholderTextColor="#687089"
        />
        <TouchableOpacity
          style={[s.filterBtn, favoritesOnly && s.filterBtnActive]}
          onPress={() => setFavoritesOnly((prev) => !prev)}
        >
          <Text style={[s.filterText, favoritesOnly && s.filterTextActive]}>Favorites</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={i => i._id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>No catalog items</Text>
            <Text style={s.emptyText}>Add your first item to speed up future sale entries.</Text>
          </View>
        }
      />
      )}
      
      <TouchableOpacity style={s.fab} onPress={() => setShowAddModal(true)}>
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Catalog Item</Text>
            <TextInput
              style={s.modalInput}
              value={newItem.name}
              onChangeText={(value) => setNewItem((prev) => ({ ...prev, name: value }))}
              placeholder="Item name"
              placeholderTextColor="#687089"
            />
            <TextInput
              style={s.modalInput}
              value={newItem.category}
              onChangeText={(value) => setNewItem((prev) => ({ ...prev, category: value }))}
              placeholder="Category"
              placeholderTextColor="#687089"
            />
            <TextInput
              style={s.modalInput}
              value={newItem.type}
              onChangeText={(value) => setNewItem((prev) => ({ ...prev, type: value }))}
              placeholder="Type (optional)"
              placeholderTextColor="#687089"
            />
            <TextInput
              style={s.modalInput}
              value={newItem.price}
              onChangeText={(value) => setNewItem((prev) => ({ ...prev, price: value }))}
              placeholder="Selling price"
              placeholderTextColor="#687089"
              keyboardType="decimal-pad"
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleAddItem}>
                <Text style={s.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerGlow: {
    position: 'absolute',
    top: 40,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(31, 94, 255, 0.08)',
  },
  header: { 
    backgroundColor: colors.surfaceContainer, padding: 20, paddingTop: 48,
    borderBottomWidth: 1, borderBottomColor: colors.outlineLighter 
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  headerBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.onSurface,
  },
  filterBtn: {
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { color: colors.onSurfaceVariant, fontWeight: '600', fontSize: 12 },
  filterTextActive: { color: colors.white },
  title: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  subtitle: { fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4, lineHeight: 18 },
  list: { padding: 16, paddingBottom: 100 },
  itemCard: {
    backgroundColor: colors.surfaceContainer, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: colors.outlineLighter,
    shadowColor: '#102135',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  itemActions: { alignItems: 'flex-end' },
  inlineActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  starBtn: {
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  starText: { color: colors.warning, fontSize: 16 },
  deleteBtn: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteText: { color: colors.errorLight, fontSize: 12, fontWeight: '700' },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.onSurface, marginBottom: 4 },
  itemType: { fontSize: 13, color: colors.onSurfaceVariant },
  itemPrice: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { color: colors.onSurface, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: colors.onSurfaceVariant, fontSize: 13, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
  },
  fabIcon: { color: colors.white, fontSize: 32, fontWeight: '300', marginTop: -2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 33, 53, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceContainer,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.outlineLighter,
  },
  modalTitle: { color: colors.onSurface, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.onSurface,
    marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: { color: colors.onSurfaceVariant, fontWeight: '700' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#1f5eff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
