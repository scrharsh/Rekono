import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveSale, LocalSaleEntry } from '../services/database.service';
import uuid from 'react-native-uuid';

type SaleMode = 'quick' | 'detailed' | 'session';
const GST_RATES = [0, 5, 12, 18, 28];

interface Item { name: string; quantity: number; price: number; gstRate: number; hsnCode?: string; }

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

  // Quick mode
  const [quickAmount, setQuickAmount] = useState('');
  const [quickMethod, setQuickMethod] = useState('cash');

  // Detailed mode
  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [itemGst, setItemGst] = useState(18);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Session mode
  const [sessionSales, setSessionSales] = useState<any[]>([]);
  const [sessionAmount, setSessionAmount] = useState('');

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
      const gstRate = 0;
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
        id: uuid.v4(), showroomId,
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
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      {/* Mode tabs */}
      <View style={s.tabs}>
        {(['quick', 'detailed', 'session'] as SaleMode[]).map(m => (
          <TouchableOpacity key={m} style={[s.tab, mode === m && s.tabActive]} onPress={() => setMode(m)}>
            <Text style={[s.tabText, mode === m && s.tabTextActive]}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Mode */}
      {mode === 'quick' && (
        <View style={s.form}>
          <Text style={s.label}>Amount (₹)</Text>
          <TextInput style={s.input} placeholder="0.00" keyboardType="numeric"
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
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Sale</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Detailed Mode */}
      {mode === 'detailed' && (
        <View style={s.form}>
          <Text style={s.sectionTitle}>Customer (optional)</Text>
          <TextInput style={s.input} placeholder="Customer name" value={customerName} onChangeText={setCustomerName} />
          <TextInput style={s.input} placeholder="Phone number" keyboardType="phone-pad" value={customerPhone} onChangeText={setCustomerPhone} />

          <Text style={s.sectionTitle}>Items</Text>
          {items.map((it, i) => (
            <View key={i} style={s.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{it.name}</Text>
                <Text style={s.itemMeta}>Qty {it.quantity} × ₹{it.price} | GST {it.gstRate}%</Text>
              </View>
              <Text style={s.itemAmt}>₹{(it.price * it.quantity).toFixed(2)}</Text>
              <TouchableOpacity onPress={() => setItems(prev => prev.filter((_, j) => j !== i))}>
                <Text style={{ color: '#ef4444', marginLeft: 8 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={s.addItemBox}>
            <TextInput style={s.input} placeholder="Item name" value={itemName} onChangeText={setItemName} />
            <View style={s.row}>
              <TextInput style={[s.input, { flex: 1, marginRight: 8 }]} placeholder="Price" keyboardType="numeric" value={itemPrice} onChangeText={setItemPrice} />
              <TextInput style={[s.input, { width: 60 }]} placeholder="Qty" keyboardType="numeric" value={itemQty} onChangeText={setItemQty} />
            </View>
            <Text style={s.label}>GST Rate</Text>
            <View style={s.chipRow}>
              {GST_RATES.map(r => (
                <TouchableOpacity key={r} style={[s.chip, itemGst === r && s.chipActive]} onPress={() => setItemGst(r)}>
                  <Text style={[s.chipText, itemGst === r && s.chipTextActive]}>{r}%</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.outlineBtn} onPress={addItem}>
              <Text style={s.outlineBtnText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.length > 0 && (
            <View style={s.summary}>
              <Text style={s.summaryText}>Total: ₹{detailedTotal.toFixed(2)}</Text>
              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleDetailedSale} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Sale</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Session Mode */}
      {mode === 'session' && (
        <View style={s.form}>
          <Text style={s.sectionTitle}>Batch Entry</Text>
          <Text style={s.hint}>Add multiple sales quickly, then submit all at once.</Text>
          {sessionSales.map((ss, i) => (
            <View key={i} style={s.itemRow}>
              <Text style={s.itemName}>Sale #{i + 1}</Text>
              <Text style={s.itemAmt}>₹{ss.amount.toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <TextInput style={s.input} placeholder="Amount (₹)" keyboardType="numeric"
            value={sessionAmount} onChangeText={setSessionAmount} />
          <TouchableOpacity style={s.outlineBtn} onPress={addSessionSale}>
            <Text style={s.outlineBtnText}>+ Add to Session</Text>
          </TouchableOpacity>
          {sessionSales.length > 0 && (
            <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={submitSession} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={s.btnText}>Submit {sessionSales.length} Sales (₹{sessionSales.reduce((a, b) => a + b.amount, 0).toLocaleString('en-IN')})</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4f46e5' },
  tabText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  tabTextActive: { color: '#4f46e5', fontWeight: '700' },
  form: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 12, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  hint: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12, color: '#1e293b' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  btn: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineBtn: { borderWidth: 1.5, borderColor: '#4f46e5', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  outlineBtnText: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  itemMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  itemAmt: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginLeft: 'auto' },
  addItemBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  row: { flexDirection: 'row' },
  summary: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryText: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
});
