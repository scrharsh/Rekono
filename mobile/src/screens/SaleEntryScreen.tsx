import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { saveSale, LocalSaleEntry } from '../services/database.service';
import uuid from 'react-native-uuid';
import { CatalogItem, fetchCatalogItems } from '../services/businessProfile.service';

type SaleMode = 'quick' | 'detailed' | 'session';
type ValidGst = 0 | 5 | 12 | 18 | 28;
const GST_RATES: ValidGst[] = [0, 5, 12, 18, 28];

interface Item { name: string; quantity: number; price: number; gstRate: ValidGst; hsnCode?: string; }

function calcGST(items: Item[]) {
  let taxable = 0, cgst = 0, sgst = 0;
  items.forEach(it => {
    const lineTotal = it.price * it.quantity;
    const t = lineTotal / (1 + it.gstRate / 100);
    const g = lineTotal - t;
    taxable += t; cgst += g / 2; sgst += g / 2;
  });
  return { taxable, cgst, sgst, igst: 0, total: taxable + cgst + sgst };
}

export default function SaleEntryScreen() {
  const [mode, setMode] = useState<SaleMode>('quick');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<Record<string, unknown>>>();

  // Quick mode
  const [quickAmount, setQuickAmount] = useState('');
  const [quickMethod, setQuickMethod] = useState('cash');

  // Detailed mode
  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [itemGst, setItemGst] = useState<ValidGst>(18);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Session mode
  const [sessionSales, setSessionSales] = useState<{id: string; amount: number; time: Date}[]>([]);
  const [sessionAmount, setSessionAmount] = useState('');
  const [suggestedItems, setSuggestedItems] = useState<CatalogItem[]>([]);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const businessId = await AsyncStorage.getItem('businessProfileId');
        if (!businessId) return;
        const items = await fetchCatalogItems(businessId);
        setSuggestedItems(items.slice(0, 6));
      } catch {
        setSuggestedItems([]);
      }
    };

    loadSuggestions();
  }, []);

  const getShowroomId = async () => {
    const id = await AsyncStorage.getItem('showroomId');
    if (!id) { Alert.alert('Error', 'Showroom not configured'); return null; }
    return id;
  };

  const handleQuickSale = useCallback(async () => {
    const amt = parseFloat(quickAmount);
    if (!quickAmount || isNaN(amt) || amt <= 0) {
      Alert.alert('Validation', 'Enter a valid amount > 0'); return;
    }
    setLoading(true);
    try {
      const showroomId = await getShowroomId();
      if (!showroomId) return;
      const gstRate: ValidGst = 0;
      const taxable = amt;
      const sale: LocalSaleEntry = {
        id: String(uuid.v4()), showroomId,
        totalAmount: amt, taxableAmount: taxable, cgst: 0, sgst: 0, igst: 0,
        items: [{ name: 'Sale', quantity: 1, price: amt, gstRate }],
        timestamp: new Date().toISOString(),
        status: 'unmatched', syncStatus: 'pending',
      };
      await saveSale(sale);
      Alert.alert('✓ Sale Created', `₹${amt.toLocaleString('en-IN')}`);
      setQuickAmount('');
    } finally { setLoading(false); }
  }, [quickAmount]);

  const addItem = () => {
    const price = parseFloat(itemPrice);
    const qty = parseInt(itemQty) || 1;
    if (!itemName || isNaN(price) || price <= 0) {
      Alert.alert('Validation', 'Enter item name and valid price'); return;
    }
    setItems(prev => [...prev, { name: itemName, quantity: qty, price, gstRate: itemGst }]);
    setItemName(''); setItemPrice(''); setItemQty('1'); setItemGst(18);
  };

  const handleDetailedSale = useCallback(async () => {
    if (items.length === 0) { Alert.alert('Validation', 'Add at least one item'); return; }
    setLoading(true);
    try {
      const showroomId = await getShowroomId();
      if (!showroomId) return;
      const { taxable, cgst, sgst, igst, total } = calcGST(items);
      const sale: LocalSaleEntry = {
        id: String(uuid.v4()), showroomId,
        totalAmount: Math.round(total * 100) / 100,
        taxableAmount: Math.round(taxable * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst,
        items,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        timestamp: new Date().toISOString(),
        status: 'unmatched', syncStatus: 'pending',
      };
      await saveSale(sale);
      Alert.alert('✓ Sale Created', `₹${total.toFixed(2)}`);
      setItems([]); setCustomerName(''); setCustomerPhone('');
    } finally { setLoading(false); }
  }, [items, customerName, customerPhone]);

  const addSessionSale = () => {
    const amt = parseFloat(sessionAmount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Validation', 'Enter valid amount'); return; }
    setSessionSales(prev => [...prev, { id: String(uuid.v4()), amount: amt, time: new Date() }]);
    setSessionAmount('');
  };

  const submitSession = useCallback(async () => {
    if (sessionSales.length === 0) return;
    setLoading(true);
    try {
      const showroomId = await getShowroomId();
      if (!showroomId) return;
      for (const s of sessionSales) {
        const sale: LocalSaleEntry = {
          id: s.id, showroomId,
          totalAmount: s.amount, taxableAmount: s.amount, cgst: 0, sgst: 0, igst: 0,
          items: [{ name: 'Session Sale', quantity: 1, price: s.amount, gstRate: 0 }],
          timestamp: s.time.toISOString(),
          status: 'unmatched', syncStatus: 'pending',
        };
        await saveSale(sale);
      }
      Alert.alert('✓ Session Saved', `${sessionSales.length} sales created`);
      setSessionSales([]);
    } finally { setLoading(false); }
  }, [sessionSales]);

  const { total: detailedTotal } = calcGST(items);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f8fc" />
      <View style={s.header}>
        <Text style={s.title}>New Sale Entry</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Catalog')}>
          <Text style={s.headerLink}>Catalog</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        {(['quick', 'detailed', 'session'] as SaleMode[]).map(m => (
          <TouchableOpacity key={m} style={[s.tab, mode === m && s.tabActive]} onPress={() => setMode(m)}>
            <Text style={[s.tabText, mode === m && s.tabTextActive]}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scrollContent}>
        {/* Quick Mode */}
        {mode === 'quick' && (
          <View style={s.form}>
            {suggestedItems.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Suggested from Catalog</Text>
                <View style={s.chipRow}>
                  {suggestedItems.slice(0, 4).map((it) => (
                    <TouchableOpacity
                      key={it._id}
                      style={s.chip}
                      onPress={() => setQuickAmount(String(it.sellingPrice))}
                    >
                      <Text style={s.chipText}>{it.name || it.category} • ₹{it.sellingPrice}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={s.label}>Amount (₹)</Text>
            <TextInput style={s.inputBig} placeholder="0.00" placeholderTextColor="#94a3b8" keyboardType="numeric"
              value={quickAmount} onChangeText={setQuickAmount} autoFocus />
            <Text style={s.label}>Payment Method</Text>
            <View style={s.chipRow}>
              {['cash', 'PhonePe', 'Google Pay', 'Paytm', 'BHIM'].map(m => (
                <TouchableOpacity key={m} style={[s.chip, quickMethod === m && s.chipActive]}
                  onPress={() => setQuickMethod(m)}>
                  <Text style={[s.chipText, quickMethod === m && s.chipTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleQuickSale} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Record Fast Entry</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Detailed Mode */}
        {mode === 'detailed' && (
          <View style={s.form}>
            <Text style={s.sectionTitle}>Customer (optional)</Text>
            <TextInput style={s.input} placeholder="Customer name" placeholderTextColor="#94a3b8" value={customerName} onChangeText={setCustomerName} />
            <TextInput style={s.input} placeholder="Phone number" placeholderTextColor="#94a3b8" keyboardType="phone-pad" value={customerPhone} onChangeText={setCustomerPhone} />

            <Text style={s.sectionTitle}>Items</Text>
            {suggestedItems.length > 0 && (
              <View style={s.chipRow}>
                {suggestedItems.slice(0, 4).map((it) => (
                  <TouchableOpacity
                    key={it._id}
                    style={s.chipSmall}
                    onPress={() => {
                      setItemName(it.name || it.category);
                      setItemPrice(String(it.sellingPrice));
                    }}
                  >
                    <Text style={s.chipText}>{it.name || it.category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {items.map((it, i) => (
              <View key={i} style={s.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemName}>{it.name}</Text>
                  <Text style={s.itemMeta}>Qty {it.quantity} × ₹{it.price} | GST {it.gstRate}%</Text>
                </View>
                <Text style={s.itemAmt}>₹{(it.price * it.quantity).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => setItems(prev => prev.filter((_, j) => j !== i))} style={s.removeBtn}>
                  <Text style={{ color: '#ffb4ab', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={s.addItemBox}>
              <TextInput style={s.input} placeholder="Item name" placeholderTextColor="#94a3b8" value={itemName} onChangeText={setItemName} />
              <View style={s.row}>
                <TextInput style={[s.input, { flex: 1, marginRight: 8 }]} placeholderTextColor="#94a3b8" placeholder="Price" keyboardType="numeric" value={itemPrice} onChangeText={setItemPrice} />
                <TextInput style={[s.input, { width: 60 }]} placeholder="Qty" placeholderTextColor="#94a3b8" keyboardType="numeric" value={itemQty} onChangeText={setItemQty} />
              </View>
              <Text style={[s.label, {marginTop: 8}]}>GST Rate</Text>
              <View style={s.chipRow}>
                {GST_RATES.map(r => (
                  <TouchableOpacity key={r} style={[s.chipSmall, itemGst === r && s.chipActive]} onPress={() => setItemGst(r)}>
                    <Text style={[s.chipText, itemGst === r && s.chipTextActive]}>{r}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.outlineBtn} onPress={addItem}>
                <Text style={s.outlineBtnText}>+ Add Line Item</Text>
              </TouchableOpacity>
            </View>

            {items.length > 0 && (
              <View style={s.summary}>
                <Text style={s.summaryLabel}>Total Payable</Text>
                <Text style={s.summaryText}>₹{detailedTotal.toLocaleString('en-IN')}</Text>
                <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleDetailedSale} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Generate Exact Invoice</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Session Mode */}
        {mode === 'session' && (
          <View style={s.form}>
            <Text style={s.sectionTitle}>Batch Entry</Text>
            <Text style={s.hint}>Fastest way to clock old offline entries</Text>
            {sessionSales.map((ss, i) => (
              <View key={i} style={s.itemRow}>
                <Text style={s.itemName}>Entry #{i + 1}</Text>
                <Text style={s.itemAmt}>₹{ss.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <TextInput style={s.inputBig} placeholder="Amount (₹)" placeholderTextColor="#94a3b8" keyboardType="numeric"
              value={sessionAmount} onChangeText={setSessionAmount} />
            <TouchableOpacity style={s.outlineBtn} onPress={addSessionSale}>
              <Text style={s.outlineBtnText}>+ Queue Entry</Text>
            </TouchableOpacity>
            {sessionSales.length > 0 && (
              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={submitSession} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={s.btnText}>Sync {sessionSales.length} Entries</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f8fc' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', padding: 20, paddingTop: 48,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#102135' },
  headerLink: { fontSize: 15, color: '#1f5eff', fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#d7e1ee' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1f5eff' },
  tabText: { fontSize: 14, color: '#5f6b7d', fontWeight: '500' },
  tabTextActive: { color: '#102135', fontWeight: '700' },
  scrollContent: { paddingBottom: 40 },
  form: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#102135', marginTop: 16, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#5f6b7d', marginBottom: 8 },
  hint: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  input: { 
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d7e1ee', 
    borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12, color: '#102135' 
  },
  inputBig: { 
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#1f5eff', 
    borderRadius: 16, padding: 20, fontSize: 32, fontWeight: '700', marginBottom: 20, color: '#102135',
    textAlign: 'center'
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d7e1ee' },
  chipSmall: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#e9f0ff', borderWidth: 1, borderColor: '#d7e1ee' },
  chipActive: { backgroundColor: '#1f5eff', borderColor: '#1f5eff' },
  chipText: { fontSize: 14, color: '#5f6b7d', fontWeight: '500' },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },
  btn: { backgroundColor: '#1f5eff', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineBtn: { borderWidth: 1, borderColor: '#d7e1ee', backgroundColor: '#f5f8fc', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  outlineBtnText: { color: '#102135', fontSize: 15, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f8fc', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#d7e1ee' },
  itemName: { fontSize: 15, fontWeight: '600', color: '#102135', marginBottom: 4 },
  itemMeta: { fontSize: 13, color: '#5f6b7d' },
  itemAmt: { fontSize: 18, fontWeight: '700', color: '#102135', marginLeft: 'auto' },
  removeBtn: { padding: 8, marginLeft: 4 },
  addItemBox: { backgroundColor: 'rgba(31,94,255,0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#d7e1ee', marginBottom: 16 },
  row: { flexDirection: 'row' },
  summary: { backgroundColor: '#f5f8fc', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1f5eff' },
  summaryLabel: { fontSize: 14, color: '#5f6b7d', textAlign: 'center', marginBottom: 4 },
  summaryText: { fontSize: 32, fontWeight: '800', color: '#102135', marginBottom: 16, textAlign: 'center', letterSpacing: -0.5 },
});
