'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

type MatchCandidate = {
  saleEntry: {
    _id: string;
    totalAmount: number;
    timestamp: string;
  };
  confidence: number;
  reason: string;
};

type UnmatchedSale = {
  saleId: string;
  amount: number;
  timestamp: string;
  topSuggestion?: MatchCandidate;
};

type UnknownPayment = {
  paymentId: string;
  amount: number;
  timestamp: string;
  topSuggestion?: MatchCandidate;
};

type BulkSuggestionsResponse = {
  unmatchedSales: UnmatchedSale[];
  unknownPayments: UnknownPayment[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  showroomId: string;
  onSuccess?: () => void;
};

type SelectedMatch = { paymentId: string; saleId: string };

type ResolveMode = 'sales' | 'payments';

export const BulkResolveModal: React.FC<Props> = ({ isOpen, onClose, showroomId, onSuccess }) => {
  const { token } = useAuth();
  const [selectedMatches, setSelectedMatches] = useState<SelectedMatch[]>([]);
  const [resolveMode, setResolveMode] = useState<ResolveMode>('sales');

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['bulk-suggestions', showroomId],
    enabled: isOpen && Boolean(token) && Boolean(showroomId),
    queryFn: async (): Promise<BulkSuggestionsResponse> => {
      const response = await fetch(`${API_URL}/showrooms/${showroomId}/matches/bulk/suggestions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      return response.json();
    },
  });

  const confirmBulkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/showrooms/${showroomId}/matches/bulk/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matches: selectedMatches }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm matches');
      }

      return response.json();
    },
    onSuccess: () => {
      setSelectedMatches([]);
      onSuccess?.();
      onClose();
    },
  });

  const currentItems = useMemo(() => {
    if (!suggestions) return [];
    return resolveMode === 'sales' ? suggestions.unmatchedSales : suggestions.unknownPayments;
  }, [suggestions, resolveMode]);

  const toggleSelection = (itemId: string, suggestionId: string) => {
    const exists = selectedMatches.some((match) =>
      resolveMode === 'sales'
        ? match.saleId === itemId && match.paymentId === suggestionId
        : match.paymentId === itemId && match.saleId === suggestionId,
    );

    if (exists) {
      setSelectedMatches((prev) =>
        prev.filter((match) =>
          resolveMode === 'sales'
            ? !(match.saleId === itemId && match.paymentId === suggestionId)
            : !(match.paymentId === itemId && match.saleId === suggestionId),
        ),
      );
      return;
    }

    setSelectedMatches((prev) =>
      resolveMode === 'sales'
        ? [...prev, { saleId: itemId, paymentId: suggestionId }]
        : [...prev, { paymentId: itemId, saleId: suggestionId }],
    );
  };

  const isSelected = (itemId: string, suggestionId: string) =>
    selectedMatches.some((match) =>
      resolveMode === 'sales'
        ? match.saleId === itemId && match.paymentId === suggestionId
        : match.paymentId === itemId && match.saleId === suggestionId,
    );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-[#dbe7ff] overflow-hidden">
          <div className="border-b border-[#dbe7ff] px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#153c74]">Bulk Resolve</h2>
              <p className="text-sm text-[#4f71a5] mt-1">Select and confirm multiple matches at once</p>
            </div>
            <button onClick={onClose} className="text-[#6f8fbe] hover:text-[#153c74] text-xl leading-none">
              ×
            </button>
          </div>

          <div className="border-b border-[#dbe7ff] px-6 pt-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setResolveMode('sales');
                  setSelectedMatches([]);
                }}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 transition-colors ${
                  resolveMode === 'sales'
                    ? 'border-[#0b57d0] text-[#0b57d0]'
                    : 'border-transparent text-[#4f71a5]'
                }`}
              >
                Pending Sales ({suggestions?.unmatchedSales.length ?? 0})
              </button>
              <button
                onClick={() => {
                  setResolveMode('payments');
                  setSelectedMatches([]);
                }}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 transition-colors ${
                  resolveMode === 'payments'
                    ? 'border-[#0b57d0] text-[#0b57d0]'
                    : 'border-transparent text-[#4f71a5]'
                }`}
              >
                Payments Awaiting Match ({suggestions?.unknownPayments.length ?? 0})
              </button>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto p-6 space-y-3 bg-[#f5f9ff]">
            {isLoading ? (
              <div className="py-10 text-center text-[#4f71a5]">Loading suggestions…</div>
            ) : currentItems.length === 0 ? (
              <div className="py-10 text-center text-[#4f71a5]">No unmatched items found</div>
            ) : (
              currentItems.map((item) => {
                const suggestion = 'saleId' in item ? item.topSuggestion : item.topSuggestion;
                const itemId = 'saleId' in item ? item.saleId : item.paymentId;
                return (
                  <label
                    key={itemId}
                    className="block rounded-xl border border-[#dbe7ff] bg-white p-4 hover:border-[#0b57d0] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-[#0b57d0]"
                        checked={suggestion ? isSelected(itemId, suggestion.saleEntry._id) : false}
                        onChange={() => suggestion && toggleSelection(itemId, suggestion.saleEntry._id)}
                        disabled={!suggestion}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="font-semibold text-[#153c74]">₹{item.amount.toFixed(2)}</p>
                            <p className="text-xs text-[#6f8fbe]">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!suggestion && (
                            <span className="rounded-full bg-[#fde8e8] px-2 py-1 text-xs font-medium text-[#d13438]">
                              No suggestions
                            </span>
                          )}
                        </div>

                        {suggestion && (
                          <div className="rounded-lg bg-[#f7fbff] border border-[#dbe7ff] p-3 text-sm">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <span className="font-medium text-[#153c74]">
                                Suggested match: ₹{suggestion.saleEntry.totalAmount.toFixed(2)}
                              </span>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold text-white ${
                                  suggestion.confidence >= 90
                                    ? 'bg-[#0d7c5f]'
                                    : suggestion.confidence >= 70
                                      ? 'bg-[#a05e08]'
                                      : 'bg-[#d13438]'
                                }`}
                              >
                                {Math.round(suggestion.confidence)}%
                              </span>
                            </div>
                            <p className="text-[#4f71a5]">{suggestion.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="border-t border-[#dbe7ff] px-6 py-4 flex items-center justify-between gap-4 bg-white">
            <p className="text-sm text-[#4f71a5]">
              {selectedMatches.length} match{selectedMatches.length === 1 ? '' : 'es'} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-xl border border-[#dbe7ff] px-4 py-2 text-sm font-semibold text-[#153c74] hover:bg-[#f7fbff]"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmBulkMutation.mutate()}
                disabled={selectedMatches.length === 0 || confirmBulkMutation.isPending}
                className="rounded-xl bg-[#0b57d0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0846ab] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirmBulkMutation.isPending ? 'Confirming…' : 'Confirm all'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
