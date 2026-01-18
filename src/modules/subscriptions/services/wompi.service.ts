import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { WompiWebhookEvent, WompiTransactionResponse, WompiTransactionStatus } from '../interfaces';

@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);
  private readonly apiUrl: string;
  private readonly privateKey: string;
  private readonly eventsSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('WOMPI_API_URL') || 'https://sandbox.wompi.co/v1';
    this.privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY') || '';
    this.eventsSecret = this.configService.get<string>('WOMPI_EVENTS_SECRET') || '';
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * VALIDAR FIRMA DE WEBHOOK
  // * ----------------------------------------------------------------------------------------------------------------
  validateWebhookSignature(event: WompiWebhookEvent, checksum: string): boolean {
    try {
      const properties = event.signature.properties;
      let concatenated = '';

      // Concatenar los valores de las propiedades en orden
      for (const prop of properties) {
        const value = this.getNestedValue(event.data, prop);
        concatenated += value;
      }

      // Agregar timestamp y secret
      concatenated += event.timestamp + this.eventsSecret;

      // Generar SHA256
      const calculatedChecksum = crypto.createHash('sha256').update(concatenated).digest('hex');

      this.logger.debug(`Webhook validation - Calculated: ${calculatedChecksum}, Received: ${checksum}`);

      return calculatedChecksum === checksum;
    } catch (error) {
      this.logger.error('Error validating webhook signature:', error);
      return false;
    }
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * CONSULTAR TRANSACCIÓN
  // * ----------------------------------------------------------------------------------------------------------------
  async getTransaction(transactionId: string): Promise<WompiTransactionResponse | null> {
    try {
      const response = await fetch(`${this.apiUrl}/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
        },
      });

      if (!response.ok) {
        this.logger.error(`Error fetching transaction ${transactionId}: ${response.status}`);
        return null;
      }

      return (await response.json()) as WompiTransactionResponse;
    } catch (error) {
      this.logger.error(`Error fetching transaction ${transactionId}:`, error);
      return null;
    }
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAPEAR ESTADO DE WOMPI A ESTADO INTERNO
  // * ----------------------------------------------------------------------------------------------------------------
  mapTransactionStatus(wompiStatus: WompiTransactionStatus): 'pending' | 'approved' | 'declined' | 'voided' | 'error' {
    const statusMap: Record<WompiTransactionStatus, 'pending' | 'approved' | 'declined' | 'voided' | 'error'> = {
      PENDING: 'pending',
      APPROVED: 'approved',
      DECLINED: 'declined',
      VOIDED: 'voided',
      ERROR: 'error',
    };
    return statusMap[wompiStatus] || 'error';
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * HELPER: Obtener valor anidado de un objeto
  // * ----------------------------------------------------------------------------------------------------------------
  private getNestedValue(obj: Record<string, any>, path: string): string {
    const keys = path.split('.');
    let value: any = obj;

    for (const key of keys) {
      if (value === undefined || value === null) return '';
      value = value[key];
    }

    // Convertir a string
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
