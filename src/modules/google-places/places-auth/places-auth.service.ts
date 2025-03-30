// src/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class PlacesAuthService {
  private readonly logger = new Logger(PlacesAuthService.name);
  private readonly oauth2Client: any;
  private readonly tokenPath: string;

  constructor(private configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );

    this.tokenPath = path.join(process.cwd(), 'tokens.json');

    // Crear directorio de tokens si no existe
    fs.ensureFileSync(this.tokenPath);
    if (!fs.existsSync(this.tokenPath)) {
      fs.writeJsonSync(this.tokenPath, {});
    }
  }

  getAuthUrl(): string {
    const scopes = ['https://www.googleapis.com/auth/business.manage'];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Forzar mostrar pantalla de consentimiento
    });
  }

  async getTokensFromCode(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.logger.log('Tokens obtenidos correctamente');
      return tokens;
    } catch (error) {
      this.logger.error(`Error al obtener tokens: ${error.message}`);
      throw error;
    }
  }

  async storeTokens(tokens: any): Promise<void> {
    try {
      await fs.writeJson(this.tokenPath, tokens);
      this.logger.log(`Tokens almacenados en: ${this.tokenPath}`);
    } catch (error) {
      this.logger.error(`Error al almacenar tokens: ${error.message}`);
      throw error;
    }
  }

  async getStoredTokens(): Promise<any> {
    try {
      if (await fs.pathExists(this.tokenPath)) {
        const tokens = await fs.readJson(this.tokenPath);
        return tokens;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error al leer tokens: ${error.message}`);
      return null;
    }
  }

  async refreshTokensIfNeeded(): Promise<any> {
    try {
      const tokens = await this.getStoredTokens();

      if (!tokens || !tokens.refresh_token) {
        this.logger.warn('No hay tokens almacenados o falta refresh_token');
        return null;
      }

      this.oauth2Client.setCredentials(tokens);

      // Si el token de acceso está a punto de expirar o ya expiró
      if (!tokens.expiry_date || tokens.expiry_date <= Date.now() + 60000) {
        this.logger.log('Renovando tokens...');
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        await this.storeTokens(credentials);
        return credentials;
      }

      return tokens;
    } catch (error) {
      this.logger.error(`Error al renovar tokens: ${error.message}`);
      throw error;
    }
  }

  getOAuth2Client(): any {
    return this.oauth2Client;
  }
}
