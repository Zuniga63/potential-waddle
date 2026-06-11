import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseExpert, ExpertContext, ExpertResponse } from './base.expert';
import { RafaIntent } from '../dto/rafa-intent.enum';
import { TripState } from '../dto/trip-state.dto';
import { ChatCard } from '../dto/chat.dto';
import { LlmService } from '../services/llm.service';
import { RafaLead } from '../entities';
import { Lodging } from 'src/modules/lodgings/entities';
import { Restaurant } from 'src/modules/restaurants/entities';
import { Experience } from 'src/modules/experiences/entities';
import { Guide } from 'src/modules/guides/entities/guide.entity';

/**
 * Lead Expert - Handles lead capture and reservations
 *
 * Specializes in:
 * - Capturing user contact information
 * - Creating leads for selected entities
 * - Managing reservation requests
 * - Following up on incomplete leads
 */
@Injectable()
export class LeadExpert extends BaseExpert {
  private readonly logger = new Logger(LeadExpert.name);

  readonly name = 'Experto en Reservas';
  readonly description = 'Captura información de contacto y crea solicitudes de reserva';

  readonly handledIntents = [RafaIntent.CREATE_LEAD];

  constructor(
    private readonly llmService: LlmService,
    @InjectRepository(RafaLead) private leadRepo: Repository<RafaLead>,
    @InjectRepository(Lodging) private lodgingRepo: Repository<Lodging>,
    @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Experience) private experienceRepo: Repository<Experience>,
    @InjectRepository(Guide) private guideRepo: Repository<Guide>,
  ) {
    super();
  }

  getSystemPrompt(state: TripState): string {
    return `Eres Rafa, asistente de reservas de Binntu.

PERSONALIDAD:
- Profesional pero amigable
- Claro sobre qué información necesitas
- Respetuoso con la privacidad del usuario
- Confirmas antes de procesar

CONTEXTO DEL VIAJE:
${this.formatStateForPrompt(state)}

INFORMACIÓN DE CONTACTO:
- Teléfono: ${state.contactPhone || 'No proporcionado'}
- Email: ${state.contactEmail || 'No proporcionado'}

SELECCIONES PARA RESERVAR:
- Alojamiento: ${state.selectedLodging ? 'Sí' : 'No'}
- Restaurante: ${state.selectedRestaurant ? 'Sí' : 'No'}
- Experiencias: ${state.selectedExperiences.length} seleccionadas
- Guía: ${state.selectedGuide ? 'Sí' : 'No'}

INSTRUCCIONES:
1. Si falta info de contacto, pídela amablemente
2. Confirma los datos antes de crear la reserva
3. Explica qué pasará después (el negocio contactará)
4. Da un resumen de la solicitud`;
  }

  async handle(context: ExpertContext): Promise<ExpertResponse> {
    const { message, state, classification, conversationId, history } = context;
    const extracted = classification.extractedData;

    this.logger.debug('LeadExpert processing reservation request');

    try {
      // Update state with any new contact info
      const stateUpdates: Partial<TripState> = {};
      if (extracted.contactPhone) stateUpdates.contactPhone = extracted.contactPhone;
      if (extracted.contactEmail) stateUpdates.contactEmail = extracted.contactEmail;

      const updatedState = { ...state, ...stateUpdates };

      // Check if we have contact info
      const hasContact = updatedState.contactPhone || updatedState.contactEmail;

      if (!hasContact) {
        return this.requestContactInfo(updatedState, history);
      }

      // Check if we have something to reserve
      const hasSelection =
        updatedState.selectedLodging ||
        updatedState.selectedRestaurant ||
        updatedState.selectedExperiences.length > 0 ||
        updatedState.selectedGuide;

      if (!hasSelection) {
        return this.noSelectionResponse(updatedState, history);
      }

      // Create leads for all selections
      const leads = await this.createLeads(conversationId, updatedState);

      // Generate confirmation response
      const response = await this.generateConfirmation(leads, updatedState, message, history);

      return {
        message: response,
        cards: leads.map(lead => this.createLeadCard(lead)),
        stateUpdates: {
          ...stateUpdates,
          currentGoal: 'Solicitud de reserva enviada',
        },
        followUpQuestions: ['¿Necesitas algo más?', '¿Quieres agregar otra reserva?'],
        suggestedActions: ['Nueva búsqueda', 'Ver itinerario'],
        requiresMoreInfo: false,
      };
    } catch (error) {
      this.logger.error(`LeadExpert error: ${error.message}`);
      return this.createErrorResponse(error.message);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async requestContactInfo(_state: TripState, _history: any[]): Promise<ExpertResponse> {
    const message = `Para procesar tu solicitud de reserva, necesito tu información de contacto.

¿Me puedes proporcionar tu **teléfono** o **email**? El establecimiento te contactará directamente para confirmar disponibilidad y detalles.

Tu información está protegida y solo se compartirá con el negocio seleccionado.`;

    return {
      message,
      cards: [],
      stateUpdates: {},
      followUpQuestions: [],
      suggestedActions: ['Proporcionar teléfono', 'Proporcionar email'],
      requiresMoreInfo: true,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async noSelectionResponse(_state: TripState, _history: any[]): Promise<ExpertResponse> {
    const message = `Para crear una reserva, primero necesitas seleccionar qué quieres reservar.

¿Qué te gustaría reservar?
- 🏨 Un alojamiento
- 🍽️ Un restaurante
- 🎯 Una experiencia
- 🧭 Un guía turístico

¿Buscamos opciones?`;

    return {
      message,
      cards: [],
      stateUpdates: {},
      followUpQuestions: ['Buscar hoteles', 'Ver experiencias'],
      suggestedActions: ['Buscar alojamiento', 'Ver experiencias', 'Buscar restaurantes'],
      requiresMoreInfo: true,
    };
  }

  private async createLeads(conversationId: string, state: TripState): Promise<RafaLead[]> {
    const leads: RafaLead[] = [];

    // Lead for lodging
    if (state.selectedLodging) {
      const lodging = await this.lodgingRepo.findOne({ where: { id: state.selectedLodging } });
      if (lodging) {
        const lead = this.leadRepo.create({
          conversationId,
          entityType: 'lodging',
          entityId: state.selectedLodging,
          contactPhone: state.contactPhone || undefined,
          contactEmail: state.contactEmail || undefined,
          stateSnapshot: state,
          status: 'pending',
          notes: `Reserva para ${state.partySize || 2} personas, ${state.days || 3} noches`,
        });
        leads.push(await this.leadRepo.save(lead));
      }
    }

    // Lead for restaurant
    if (state.selectedRestaurant) {
      const restaurant = await this.restaurantRepo.findOne({ where: { id: state.selectedRestaurant } });
      if (restaurant) {
        const lead = this.leadRepo.create({
          conversationId,
          entityType: 'restaurant',
          entityId: state.selectedRestaurant,
          contactPhone: state.contactPhone || undefined,
          contactEmail: state.contactEmail || undefined,
          stateSnapshot: state,
          status: 'pending',
          notes: `Reserva para ${state.partySize || 2} personas`,
        });
        leads.push(await this.leadRepo.save(lead));
      }
    }

    // Leads for experiences
    for (const expId of state.selectedExperiences) {
      const experience = await this.experienceRepo.findOne({ where: { id: expId } });
      if (experience) {
        const lead = this.leadRepo.create({
          conversationId,
          entityType: 'experience',
          entityId: expId,
          contactPhone: state.contactPhone || undefined,
          contactEmail: state.contactEmail || undefined,
          stateSnapshot: state,
          status: 'pending',
          notes: `Reserva para ${state.partySize || 2} personas`,
        });
        leads.push(await this.leadRepo.save(lead));
      }
    }

    // Lead for guide
    if (state.selectedGuide) {
      const guide = await this.guideRepo.findOne({ where: { id: state.selectedGuide } });
      if (guide) {
        const lead = this.leadRepo.create({
          conversationId,
          entityType: 'guide',
          entityId: state.selectedGuide,
          contactPhone: state.contactPhone || undefined,
          contactEmail: state.contactEmail || undefined,
          stateSnapshot: state,
          status: 'pending',
          notes: `Servicio de guía para ${state.partySize || 2} personas, ${state.days || 3} días`,
        });
        leads.push(await this.leadRepo.save(lead));
      }
    }

    this.logger.log(`Created ${leads.length} leads for conversation ${conversationId}`);
    return leads;
  }

  private createLeadCard(lead: RafaLead): ChatCard {
    const typeEmoji: Record<string, string> = {
      lodging: '🏨',
      restaurant: '🍽️',
      experience: '🎯',
      guide: '🧭',
    };

    const typeLabel: Record<string, string> = {
      lodging: 'Alojamiento',
      restaurant: 'Restaurante',
      experience: 'Experiencia',
      guide: 'Guía',
    };

    return {
      id: lead.id,
      type: 'entity_card',
      title: `Solicitud de reserva`,
      subtitle: `${typeEmoji[lead.entityType] || '📋'} ${typeLabel[lead.entityType] || lead.entityType}`,
      content: {
        status: 'Pendiente de confirmación',
        contact: lead.contactPhone || lead.contactEmail,
        notes: lead.notes,
      },
      actions: [{ text: 'Ver estado', action: `view_lead_${lead.id}` }],
    };
  }

  private async generateConfirmation(
    leads: RafaLead[],
    state: TripState,
    userMessage: string,
    history: any[],
  ): Promise<string> {
    const leadsContext = `
LEADS CREADOS:
${leads.map(l => `- ${l.entityType}: ID ${l.entityId}`).join('\n')}

CONTACTO: ${state.contactPhone || state.contactEmail}
`;

    return this.llmService.generateExpertResponse(
      this.getSystemPrompt(state) +
        leadsContext +
        `

INSTRUCCIONES ESPECIALES:
- Confirma que la solicitud fue enviada
- Explica que el negocio contactará pronto
- Menciona que pueden revisar el estado en su perfil
- Agradece y ofrece más ayuda`,
      userMessage,
      [],
      history,
    );
  }
}
