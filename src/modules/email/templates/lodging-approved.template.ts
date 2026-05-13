import { EmailTemplate } from './welcome.template';

export const getLodgingApprovedTemplate = (lodgingName: string, publicUrl: string): EmailTemplate => {
  const subject = '¡Tu negocio ya está publicado en Binntu!';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lodging publicado - Binntu</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 30px 20px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <img src="https://beewo.s3.amazonaws.com/uploads/survey_answer/answer_file/1603390/c4a4440b-1d6d-4bf8-ac94-ef0ead8ebe5e.png" alt="Binntu" style="max-width: 180px; height: auto; margin-bottom: 10px;" />
              <p style="color: #10b981; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">¡Felicitaciones! Tu lodging está en línea</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">¡Tu lodging está publicado!</h2>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Nuestro equipo revisó y aprobó <strong>${lodgingName}</strong>. Tu alojamiento ya está visible para miles de viajeros que buscan experiencias auténticas en Colombia.
              </p>

              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #065f46; font-size: 15px; margin: 0; line-height: 1.6;">
                  <strong>Ahora los viajeros pueden:</strong><br>
                  Ver tu alojamiento en el mapa, conocer tus tarifas y habitaciones, y contactarte directamente por WhatsApp.
                </p>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0 30px 0;">
                Visita tu página pública para ver cómo aparece tu lodging en Binntu:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${publicUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Ver mi lodging
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                ¿Quieres actualizar tu información o agregar más fotos? Ingresa a tu panel de negocios en cualquier momento.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} Binntu. Todos los derechos reservados.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Promoviendo el turismo sostenible en Colombia
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
};
