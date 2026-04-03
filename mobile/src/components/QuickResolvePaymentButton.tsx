import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import colors from '../constants/colors';

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:3000/v1';
interface MatchCandidate {
  saleEntry: {
    _id: string;
    totalAmount: number;
    timestamp: Date;
  };
  confidence: number;
  reason: string;
}

interface QuickResolveResult {
  status: 'auto-matched' | 'suggestions';
  matchId?: string;
  suggestions?: MatchCandidate[];
}

interface Props {
  paymentId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const QuickResolvePaymentButton: React.FC<Props> = ({
  paymentId,
  amount,
  onSuccess,
  onError,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [showroomId, setShowroomId] = useState<string | null>(null);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [authToken, roomId] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('showroomId'),
        ]);
        setToken(authToken);
        setShowroomId(roomId);
      } catch (error) {
        console.error('Failed to load auth credentials:', error);
        onError?.(new Error('Failed to load authentication credentials'));
      }
    };
    loadAuth();
  }, []);
  // Quick resolve mutation
  const quickResolveMutation = useMutation<QuickResolveResult, Error, void>({
    mutationFn: async (): Promise<QuickResolveResult> => {
      if (!token || !showroomId) {
        throw new Error('Authentication or showroom not configured');
      }
      const response = await fetch(
        `${API_URL}/showrooms/${showroomId}/matches/${paymentId}/quick-match`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Quick resolve failed');
      }

      return response.json();
    },
    onSuccess: (result) => {
      if (result.status === 'auto-matched') {
        // Payment auto-matched, close and refresh
        setShowSuggestions(false);
        onSuccess?.();
      } else if (result.suggestions) {
        // Show suggestions for manual selection
        setShowSuggestions(true);
      }
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  // Confirm manual match mutation
  const confirmMatchMutation = useMutation<unknown, Error, string>({
    mutationFn: async (saleId: string) => {
      if (!token || !showroomId) {
        throw new Error('Authentication or showroom not configured');
      }
      const response = await fetch(
        `${API_URL}/showrooms/${showroomId}/matches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId,
            saleId,
            notes: 'Quick-matched from mobile',
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Manual match failed');
      }

      return response.json();
    },
    onSuccess: () => {
      setShowSuggestions(false);
      setSelectedSaleId(null);
      onSuccess?.();
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const handleQuickResolve = () => {
    quickResolveMutation.mutate();
  };

  const handleSelectSuggestion = (saleId: string) => {
    setSelectedSaleId(saleId);
  };

  const handleConfirmSelection = () => {
    if (selectedSaleId) {
      confirmMatchMutation.mutate(selectedSaleId);
    }
  };

  const result = quickResolveMutation.data;
  const isLoading = quickResolveMutation.isPending || confirmMatchMutation.isPending;

  return (
    <>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleQuickResolve}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          <Text style={styles.buttonText}>Resolve ₹{amount}</Text>
        )}
      </TouchableOpacity>

      {/* Suggestions Modal */}
      <Modal visible={showSuggestions} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Match Suggestions</Text>
              <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.suggestionsList}>
              {result?.suggestions?.map((suggestion, index) => (
                <TouchableOpacity
                  key={`${suggestion.saleEntry._id}-${index}`}
                  style={[
                    styles.suggestionCard,
                    selectedSaleId === suggestion.saleEntry._id && styles.suggestionCardSelected,
                  ]}
                  onPress={() => handleSelectSuggestion(suggestion.saleEntry._id)}
                >
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionAmount}>
                      ₹{suggestion.saleEntry.totalAmount.toFixed(2)}
                    </Text>
                    <View
                      style={[
                        styles.confidenceBadge,
                        {
                          backgroundColor:
                            suggestion.confidence >= 90
                              ? colors.success
                              : suggestion.confidence >= 70
                                ? colors.warning
                                : colors.error,
                        },
                      ]}
                    >
                      <Text style={styles.confidenceText}>{Math.round(suggestion.confidence)}%</Text>
                    </View>
                  </View>
                  <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
                  <Text style={styles.suggestionTime}>
                    {new Date(suggestion.saleEntry.timestamp).toLocaleTimeString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmButton, !selectedSaleId && styles.buttonDisabled]}
              onPress={handleConfirmSelection}
              disabled={!selectedSaleId || confirmMatchMutation.isPending}
            >
              {confirmMatchMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Match</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
  },
  closeButton: {
    fontSize: 24,
    color: colors.onSurface,
    opacity: 0.6,
  },

  suggestionsList: {
    marginBottom: 16,
    maxHeight: '70%',
  },
  suggestionCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suggestionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(11, 87, 208, 0.05)',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionReason: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  suggestionTime: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
  },

  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
