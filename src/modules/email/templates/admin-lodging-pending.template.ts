import { EmailTemplate } from './welcome.template';

export const getAdminLodgingPendingTemplate = (
  lodgingName: string,
  ownerEmail: string,
  adminPanelUrl: string,
): EmailTemplate => {
  const subject = 'Nuevo lodging pendiente de validación';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo lodging pendiente - Binntu Admin</title>
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
              <p style="color: #10b981; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Binntu Admin — Notificación interna</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Nuevo lodging para validar</h2>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Un propietario ha enviado un lodging para su publicación en Binntu y está esperando tu revisión.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; margin: 0 0 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #374151; font-size: 15px; margin: 0 0 10px 0;">
                      <strong>Lodging:</strong> ${lodgingName}
                    </p>
                    <p style="color: #374151; font-size: 15px; margin: 0;">
                      <strong>Propietario:</strong> ${ownerEmail}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Revisa la información del lodging en el panel de administración y aprueba o rechaza la solicitud:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${adminPanelUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Revisar en el panel
                </a>
              </div>

              <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Este es un correo automático del sistema Binntu. No responder.
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
                Binntu, Colombia
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
