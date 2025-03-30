// src/auth/auth.controller.ts
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PlacesAuthService } from './places-auth.service';

@Controller('auth')
export class PlacesAuthController {
  constructor(private readonly authService: PlacesAuthService) {}

  @Get('login')
  async login(@Res() res: Response) {
    const authUrl = this.authService.getAuthUrl();
    return res.redirect(authUrl);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Res() res: Response) {
    try {
      const tokens = await this.authService.getTokensFromCode(code);
      await this.authService.storeTokens(tokens);
      console.log('Tokens almacenados:', tokens);
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
            <h1>Autenticación Exitosa</h1>
            <p>Se ha completado la autenticación con Google Business Profile.</p>
            <p>Puedes cerrar esta ventana y volver a la aplicación.</p>
          </body>
        </html>
      `);
    } catch (error) {
      return res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
            <h1>Error de Autenticación</h1>
            <p>Ocurrió un error durante la autenticación: ${error.message}</p>
          </body>
        </html>
      `);
    }
  }

  @Get('status')
  async status() {
    const tokens = await this.authService.getStoredTokens();
    return {
      authenticated: !!tokens,
      hasRefreshToken: !!(tokens && tokens.refresh_token),
      tokenExpiry: tokens ? new Date(tokens.expiry_date).toISOString() : null,
    };
  }
}
