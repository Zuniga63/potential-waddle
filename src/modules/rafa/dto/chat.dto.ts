import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { RafaIntent } from './rafa-intent.enum';

// Request DTO
export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  conversation_id?: string;

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsOptional()
  user_context?: UserContext;
}

// User context from frontend
export interface UserContext {
  user_id?: string;
  conversation_id: string;
  previous_intent?: string;
  collected_params: Record<string, unknown>;
  pending_questions: string[];
  session_data: Record<string, unknown>;
}

// Response matching frontend SuperAgentResponse
export interface ChatResponseDto {
  message: string;
  intent: RafaIntent;
  cards: ChatCard[];
  follow_up_questions: string[];
  requires_more_info: boolean;
  conversation_complete: boolean;
  context_update?: UserContext;
  conversation_id: string;
}

// Card types supported by frontend
export type CardType =
  | 'restaurant'
  | 'lodging'
  | 'place'
  | 'experience'
  | 'guide'
  | 'transport'
  | 'commerce'
  | 'entity_card'
  | 'budget_card'
  | 'info_card'
  | 'recommendation_card'
  | 'list_card';

// Base card structure
export interface ChatCard {
  id?: string;
  type: CardType;
  title: string;
  subtitle?: string;
  data?: EntityCardData;
  content?: Record<string, unknown>;
  actions?: CardAction[];
  metadata?: Record<string, unknown>;
}

export interface CardAction {
  text: string;
  action: string;
}

// Entity data for cards - matching frontend ModelCardMobile expectations
export interface EntityCardData {
  id: string;
  name?: string;
  title?: string; // For experiences
  slug: string;
  images: EntityImage[];
  rating: number;
  reviewCount?: number;
  reviews?: number; // For experiences
  googleMapsRating?: number;
  googleMapsReviewsCount?: number;
  address?: string;
  whatsappNumbers?: string[];
  phoneNumbers?: string[];
  lowestPrice?: string;
  highestPrice?: string;
  price?: number | string; // For experiences
  urbanCenterDistance?: number;
  googleMapsUrl?: string;
  hasPromotions?: boolean;
  latestPromotionValue?: number;
  difficultyLevel?: number;
  latitude?: number;
  longitude?: number;
  departure?: {
    latitude: number;
    longitude: number;
    description: string;
  };
  // For guides
  firstName?: string;
  lastName?: string;
  languages?: string[];
  biography?: string;
  // For transport
  licensePlate?: string;
  // Common
  description?: string;
  town?: {
    id: string;
    name: string;
    slug: string;
  };
  towns?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  categories?: Array<{ id: string; name: string }>;
}

// Image format expected by frontend
export interface EntityImage {
  imageResource?: {
    url: string;
  };
  url?: string; // Direct URL alternative
}

// Budget card structure
export interface BudgetCardData {
  entity_id: string;
  entity_type: string;
  entity_name: string;
  breakdown: {
    base_price: number;
    nights: number;
    persons: number;
    subtotal: number;
    taxes: number;
    additional_fees: number;
    discounts: number;
    total: number;
  };
  valid_until?: string;
  terms_and_conditions: string[];
  contact_info: {
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
}
