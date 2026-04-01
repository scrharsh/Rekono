import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem, fetchCatalogItems } from '../services/businessProfile.service';

const MOCK_CATALOG = [
  { _id: 'c1', name: 'General Consultation', category: 'Services', type: 'Service', sellingPrice: 500 },
  { _id: 'c2', name: 'Premium Service Package', category: 'Services', type: 'Package', sellingPrice: 2000 },
  { _id: 'c3', name: 'Standard Product', category: 'Products', type: 'Product', sellingPrice: 1500 },
  { _id: 'c4', name: 'Diagnostic Check', category: 'Services', type: 'Service', sellingPrice: 300 },
];

export default function CatalogScreen() {
  const [items, setItems] = useState<CatalogItem[]>(MOCK_CATALOG);
  const [refreshing, setRefreshing] = useState(false);

  const loadCatalog = useCallback(async () => {
    try {
      const businessId = await AsyncStorage.getItem('businessProfileId');
      if (!businessId) {
        setItems(MOCK_CATALOG);
        return;
      }

      const apiItems = await fetchCatalogItems(businessId);
      setItems(apiItems.length > 0 ? apiItems : MOCK_CATALOG);
    } catch {
      setItems(MOCK_CATALOG);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalog();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: CatalogItem }) => (
    <View style={s.itemCard}>
      <View style={{ flex: 1 }}>
        <Text style={s.itemName}>{item.name || item.category}</Text>
        <Text style={s.itemType}>{item.type || item.category}</Text>
      </View>
      <Text style={s.itemPrice}>₹{item.sellingPrice}</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131b2e" />
      <View style={s.header}>
        <Text style={s.title}>Progressive Catalog</Text>
        <Text style={s.subtitle}>Your smartest items learned over time</Text>
      </View>
      
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={i => i._id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
      />
      
      <TouchableOpacity style={s.fab}>
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1326' },
  header: { 
    backgroundColor: '#131b2e', padding: 20, paddingTop: 48, 
    borderBottomWidth: 1, borderBottomColor: '#171f33' 
  },
  title: { fontSize: 20, fontWeight: '700', color: '#dae2fd' },
  subtitle: { fontSize: 13, color: '#c7c4d8', marginTop: 4 },
  list: { padding: 16, paddingBottom: 100 },
  itemCard: {
    backgroundColor: '#171f33', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: '#222a3d'
  },
  itemName: { fontSize: 16, fontWeight: '600', color: '#dae2fd', marginBottom: 4 },
  itemType: { fontSize: 13, color: '#c7c4d8' },
  itemPrice: { fontSize: 18, fontWeight: '700', color: '#dae2fd' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
  },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '300', marginTop: -2 },
});
