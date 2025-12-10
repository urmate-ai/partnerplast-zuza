import type { ContactInfo } from '../../services/contacts.service';

export class ContactsFormatter {
  static formatForAiContext(contacts: ContactInfo[]): string {
    if (contacts.length === 0) {
      return 'Brak kontaktów w książce adresowej.';
    }

    const formattedContacts = contacts.map((contact, index) => {
      const parts: string[] = [];
      
      parts.push(`${index + 1}. ${contact.name}`);
      
      if (contact.firstName || contact.lastName) {
        const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        if (fullName && fullName !== contact.name) {
          parts.push(`   Imię i nazwisko: ${fullName}`);
        }
      }
      
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        const phones = contact.phoneNumbers
          .map((phone) => `${phone.number}${phone.label ? ` (${phone.label})` : ''}`)
          .join(', ');
        parts.push(`   Telefon: ${phones}`);
      }
      
      if (contact.emails && contact.emails.length > 0) {
        const emails = contact.emails
          .map((email) => `${email.email}${email.label ? ` (${email.label})` : ''}`)
          .join(', ');
        parts.push(`   Email: ${emails}`);
      }

      return parts.join('\n');
    });

    return `Kontakty użytkownika (${contacts.length}):\n\n${formattedContacts.join('\n\n')}`;
  }

  static formatContactForSearch(contact: ContactInfo): string {
    const parts: string[] = [contact.name];
    
    if (contact.firstName) parts.push(contact.firstName);
    if (contact.lastName) parts.push(contact.lastName);
    if (contact.phoneNumbers) {
      contact.phoneNumbers.forEach(phone => parts.push(phone.number));
    }
    if (contact.emails) {
      contact.emails.forEach(email => parts.push(email.email));
    }

    return parts.join(' ');
  }
}

