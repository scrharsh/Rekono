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
  toggleCatalogFavorite,
} from '../services/businessProfile.service';

const MOCK_CATALOG = [
  { _id: 'c1', name: 'General Consultation', category: 'Services', type: 'Service', sellingPrice: 500 },
  { _id: 'c2', name: 'Premium Service Package', category: 'Services', type: 'Package', sellingPrice: 2000 },
  { _id: 'c3', name: 'Standard Product', category: 'Products', type: 'Product', sellingPrice: 1500 },
  { _id: 'c4', name: 'Diagnostic Check', category: 'Services', type: 'Service', sellingPrice: 300 },
];

export default function CatalogScreen() {
  const [items, setItems] = useState<CatalogItem[]>(MOCK_CATALOG);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', type: '', price: '' });

  const loadCatalog = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const activeBusinessId = await AsyncStorage.getItem('businessProfileId');
      if (!activeBusinessId) {
        setBusinessId('');
        setItems(MOCK_CATALOG);
        return;
      }

      setBusinessId(activeBusinessId);
      const apiItems = await fetchCatalogItems(activeBusinessId);
      setItems(apiItems.length > 0 ? apiItems : MOCK_CATALOG);
    } catch {
      setItems(MOCK_CATALOG);
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
    if (!businessId) {
      Alert.alert('Business context missing', 'Complete onboarding first, then add catalog items.');
      return;
    }
    if (!newItem.name.trim() || !newItem.category.trim() || Number.isNaN(price) || price <= 0) {
      Alert.alert('Validation', 'Name, category and a valid price are required.');
      return;
    }

    try {
      await createCatalogItem(businessId, {
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
    if (!businessId || !item._id) return;

    try {
      await toggleCatalogFavorite(businessId, item._id);
      await loadCatalog();
    } catch {
      Alert.alert('Failed', 'Unable to update favorite status.');
    }
  };

  const handleDeleteItem = (item: CatalogItem) => {
    if (!businessId || !item._id) return;

    Alert.alert('Delete item', `Remove ${item.name || item.category} from catalog?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCatalogItem(businessId, item._id);
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
      <StatusBar barStyle="light-content" backgroundColor="#131b2e" />
      <View style={s.header}>
        <Text style={s.title}>Progressive Catalog</Text>
        <Text style={s.subtitle}>Your smartest items learned over time</Text>
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
          <ActivityIndicator color="#4f46e5" size="large" />
        </View>
      ) : (
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={i => i._id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
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
  container: { flex: 1, backgroundColor: '#0b1326' },
  header: { 
    backgroundColor: '#131b2e', padding: 20, paddingTop: 48, 
    borderBottomWidth: 1, borderBottomColor: '#171f33' 
  },
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
    backgroundColor: '#171f33',
    borderWidth: 1,
    borderColor: '#222a3d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#dae2fd',
  },
  filterBtn: {
    borderWidth: 1,
    borderColor: '#464555',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterBtnActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterText: { color: '#c7c4d8', fontWeight: '600', fontSize: 12 },
  filterTextActive: { color: '#fff' },
  title: { fontSize: 20, fontWeight: '700', color: '#dae2fd' },
  subtitle: { fontSize: 13, color: '#c7c4d8', marginTop: 4 },
  list: { padding: 16, paddingBottom: 100 },
  itemCard: {
    backgroundColor: '#171f33', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: '#222a3d'
  },
  itemActions: { alignItems: 'flex-end' },
  inlineActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  starBtn: {
    borderWidth: 1,
    borderColor: '#464555',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  starText: { color: '#fbbf24', fontSize: 16 },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteText: { color: '#ffb4ab', fontSize: 12, fontWeight: '700' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#dae2fd', marginBottom: 4 },
  itemType: { fontSize: 13, color: '#c7c4d8' },
  itemPrice: { fontSize: 18, fontWeight: '700', color: '#dae2fd' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { color: '#dae2fd', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: '#c7c4d8', fontSize: 13, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
  },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '300', marginTop: -2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 38, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#131b2e',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222a3d',
  },
  modalTitle: { color: '#dae2fd', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalInput: {
    backgroundColor: '#171f33',
    borderWidth: 1,
    borderColor: '#222a3d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#dae2fd',
    marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#464555',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: { color: '#c7c4d8', fontWeight: '700' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
