/**
 * AI Assistant Integration Boundary
 *
 * Directs voice and text commands to server-side Gemini processing.
 * All state mutations require server authorization, schema validation,
 * and explicit human confirmation before execution.
 */

import { Language } from '../../types/index.ts';

export type AssistantActionType =
  | 'search_products'
  | 'view_shop'
  | 'add_to_cart'
  | 'vendor_update_stock'
  | 'vendor_update_price'
  | 'vendor_update_crowd'
  | 'vendor_toggle_open';

export interface ProposedAction {
  actionId: string;
  actionType: AssistantActionType;
  requiresConfirmation: boolean;
  summaryEn: string;
  summaryHi: string;
  arguments: Record<string, unknown>;
  confirmationToken?: string;
  expiresAt: string;
}

export interface AssistantInterpretResponse {
  spokenReply: string;
  textReply: string;
  proposedAction?: ProposedAction;
}

export interface AssistantExecuteRequest {
  actionId: string;
  confirmationToken: string;
}

export interface AssistantExecuteResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export const assistantConfig = {
  supportedLanguages: ['en', 'hi'] as Language[],
  confirmationTimeoutSeconds: 120,
};
