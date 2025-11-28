export class EmailTemplates {
  static passwordReset(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px;">
          <h1 style="color: #111827; margin-bottom: 20px;">Reset hasła</h1>
          <p style="color: #4b5563; margin-bottom: 20px;">
            Otrzymaliśmy prośbę o reset hasła dla Twojego konta.
          </p>
          <p style="color: #4b5563; margin-bottom: 30px;">
            Kliknij poniższy przycisk, aby zresetować hasło:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Zresetuj hasło
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość. Link wygaśnie za 1 godzinę.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
            Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:<br>
            <a href="${resetUrl}" style="color: #111827; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  static passwordResetText(resetUrl: string): string {
    return `
      Reset hasła - Zuza Team
        
      Otrzymaliśmy prośbę o reset hasła dla Twojego konta.
        
      Kliknij poniższy link, aby zresetować hasło:
      ${resetUrl}
        
      Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość. Link wygaśnie za 1 godzinę.
    `;
  }

  /**
   * Generates HTML template for welcome email
   */
  static welcome(name: string, appUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px;">
          <h1 style="color: #111827; margin-bottom: 20px;">Witaj, ${name}! 👋</h1>
          <p style="color: #4b5563; margin-bottom: 20px;">
            Dziękujemy za dołączenie do Zuza Team! Cieszymy się, że jesteś z nami.
          </p>
          <p style="color: #4b5563; margin-bottom: 20px;">
            Twoje konto zostało pomyślnie utworzone. Możesz teraz korzystać z wszystkich funkcji naszej aplikacji:
          </p>
          <ul style="color: #4b5563; margin-bottom: 30px; padding-left: 20px;">
            <li style="margin-bottom: 10px;">🎤 Rozmawiaj z AI za pomocą głosu</li>
            <li style="margin-bottom: 10px;">💬 Otrzymuj inteligentne odpowiedzi na swoje pytania</li>
            <li style="margin-bottom: 10px;">📝 Zapisz historię swoich rozmów</li>
            <li style="margin-bottom: 10px;">⚙️ Dostosuj ustawienia do swoich potrzeb</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}" 
               style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Rozpocznij korzystanie
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Jeśli masz pytania lub potrzebujesz pomocy, skontaktuj się z nami. Jesteśmy tutaj, aby pomóc!
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
            Pozdrawiamy,<br>
            <strong>Zespół Zuza Team</strong>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates plain text version for welcome email
   */
  static welcomeText(name: string, appUrl: string): string {
    return `
      Witaj, ${name}!
        
      Dziękujemy za dołączenie do Zuza Team! Cieszymy się, że jesteś z nami.
        
      Twoje konto zostało pomyślnie utworzone. Możesz teraz korzystać z wszystkich funkcji naszej aplikacji:
      - Rozmawiaj z AI za pomocą głosu
      - Otrzymuj inteligentne odpowiedzi na swoje pytania
      - Zapisz historię swoich rozmów
      - Dostosuj ustawienia do swoich potrzeb
        
      Rozpocznij korzystanie: ${appUrl}
        
      Jeśli masz pytania lub potrzebujesz pomocy, skontaktuj się z nami. Jesteśmy tutaj, aby pomóc!
        
      Pozdrawiamy,
      Zespół Zuza Team
    `;
  }
}

