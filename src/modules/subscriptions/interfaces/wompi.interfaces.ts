// ============================================================================
// WOMPI API INTERFACES
// Basado en documentación oficial: https://docs.wompi.co/docs/colombia/
// ============================================================================

// ----------------------------------------------------------------------------
// Merchant & Acceptance Tokens
// ----------------------------------------------------------------------------
export interface WompiMerchantResponse {
  data: {
    id: number;
    name: string;
    email: string;
    contact_name: string;
    phone_number: string;
    active: boolean;
    logo_url: string | null;
    legal_name: string;
    legal_id_type: string;
    legal_id: string;
    public_key: string;
    presigned_acceptance: WompiAcceptanceToken;
    presigned_personal_data_auth: WompiAcceptanceToken;
  };
}

export interface WompiAcceptanceToken {
  acceptance_token: string;
  permalink: string;
  type: 'END_USER_POLICY' | 'PERSONAL_DATA_AUTH';
}

// ----------------------------------------------------------------------------
// Card Tokenization
// ----------------------------------------------------------------------------
export interface WompiTokenizeCardRequest {
  number: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
  card_holder: string;
}

export interface WompiTokenizeCardResponse {
  data: {
    id: string; // tok_prod_xxx o tok_test_xxx
    brand: string; // VISA, MASTERCARD, etc.
    name: string;
    last_four: string;
    bin: string;
    exp_month: string;
    exp_year: string;
    created_at: string;
    expires_at: string;
  };
}

// ----------------------------------------------------------------------------
// Payment Sources
// ----------------------------------------------------------------------------
export interface WompiCreatePaymentSourceRequest {
  type: 'CARD' | 'NEQUI' | 'DAVIPLATA' | 'BANCOLOMBIA_TRANSFER';
  token: string;
  customer_email: string;
  acceptance_token: string;
  accept_personal_auth: string;
}

export interface WompiPaymentSourceResponse {
  data: {
    id: number;
    public_data: {
      type: string;
      brand?: string;
      last_four?: string;
      bin?: string;
      exp_month?: string;
      exp_year?: string;
      phone_number?: string;
    };
    token?: string;
    type: string;
    status: 'AVAILABLE' | 'UNAVAILABLE';
    customer_email: string;
  };
}

// ----------------------------------------------------------------------------
// Transactions
// ----------------------------------------------------------------------------
export interface WompiCreateTransactionRequest {
  amount_in_cents: number;
  currency: 'COP';
  customer_email: string;
  reference: string;
  payment_source_id: number;
  payment_method?: {
    installments?: number;
  };
  customer_data?: {
    phone_number?: string;
    full_name?: string;
    legal_id?: string;
    legal_id_type?: string;
  };
  shipping_address?: {
    address_line_1?: string;
    address_line_2?: string;
    country?: string;
    region?: string;
    city?: string;
    name?: string;
    phone_number?: string;
    postal_code?: string;
  };
}

export type WompiTransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'VOIDED'
  | 'ERROR';

export interface WompiTransactionResponse {
  data: WompiTransaction;
}

export interface WompiTransaction {
  id: string;
  created_at: string;
  finalized_at: string | null;
  amount_in_cents: number;
  reference: string;
  customer_email: string;
  currency: string;
  payment_method_type: string;
  payment_method: {
    type: string;
    extra?: Record<string, any>;
    installments?: number;
  };
  status: WompiTransactionStatus;
  status_message: string | null;
  billing_data: Record<string, any> | null;
  shipping_address: Record<string, any> | null;
  redirect_url: string | null;
  payment_source_id: number | null;
  payment_link_id: string | null;
  customer_data: Record<string, any> | null;
  merchant: {
    name: string;
    legal_name: string;
    contact_name: string;
    phone_number: string;
    logo_url: string | null;
    legal_id_type: string;
    email: string;
    legal_id: string;
  };
}

// ----------------------------------------------------------------------------
// Webhooks
// ----------------------------------------------------------------------------
export type WompiWebhookEventType =
  | 'transaction.updated'
  | 'nequi_token.updated'
  | 'bancolombia_transfer_token.updated';

export interface WompiWebhookEvent {
  event: WompiWebhookEventType;
  data: {
    transaction?: WompiTransaction;
    // Otros tipos de datos según el evento
    [key: string]: any;
  };
  environment: 'prod' | 'test';
  signature: {
    properties: string[];
    checksum: string;
  };
  timestamp: number;
  sent_at: string;
}

// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------
export interface WompiErrorResponse {
  error: {
    type: string;
    reason: string;
    messages?: Record<string, string[]>;
  };
}

// ----------------------------------------------------------------------------
// Widget Configuration (Frontend)
// ----------------------------------------------------------------------------
export interface WompiWidgetConfig {
  publicKey: string;
  currency: 'COP';
  amountInCents: number;
  reference: string;
  signatureIntegrity: string;
  redirectUrl?: string;
  expirationTime?: string; // ISO8601
  customerEmail?: string;
  customerFullName?: string;
  customerPhoneNumber?: string;
}
