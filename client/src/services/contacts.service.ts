import * as Contacts from 'expo-contacts';

export type ContactInfo = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers?: Array<{ number: string; label?: string }>;
  emails?: Array<{ email: string; label?: string }>;
};

export type ContactsConnectionStatus = {
  isAvailable: boolean;
  hasPermission: boolean;
};

export async function getContactsStatus(): Promise<ContactsConnectionStatus> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return {
      isAvailable: true,
      hasPermission: status === 'granted',
    };
  } catch (error) {
    console.error('[Contacts] Error checking status:', error);
    return {
      isAvailable: false,
      hasPermission: false,
    };
  }
}

export async function getAllContacts(): Promise<ContactInfo[]> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('[Contacts] Permission not granted');
      return [];
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
      ],
    });

    return data.map((contact) => ({
      id: contact.id,
      name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Bez nazwy',
      firstName: contact.firstName,
      lastName: contact.lastName,
      phoneNumbers: contact.phoneNumbers?.map((phone) => ({
        number: phone.number || '',
        label: phone.label,
      })),
      emails: contact.emails?.map((email) => ({
        email: email.email || '',
        label: email.label,
      })),
    }));
  } catch (error) {
    console.error('[Contacts] Error fetching contacts:', error);
    return [];
  }
}

export async function searchContacts(query: string): Promise<ContactInfo[]> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('[Contacts] Permission not granted');
      return [];
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
      ],
      name: query,
    });

    return data.map((contact) => ({
      id: contact.id,
      name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Bez nazwy',
      firstName: contact.firstName,
      lastName: contact.lastName,
      phoneNumbers: contact.phoneNumbers?.map((phone) => ({
        number: phone.number || '',
        label: phone.label,
      })),
      emails: contact.emails?.map((email) => ({
        email: email.email || '',
        label: email.label,
      })),
    }));
  } catch (error) {
    console.error('[Contacts] Error searching contacts:', error);
    return [];
  }
}

export async function findContactByName(name: string): Promise<ContactInfo | null> {
  try {
    const allContacts = await getAllContacts();
    const lowerName = name.toLowerCase().trim();
    
    let contact = allContacts.find(
      (c) =>
        c.name.toLowerCase() === lowerName ||
        c.firstName?.toLowerCase() === lowerName ||
        c.lastName?.toLowerCase() === lowerName ||
        `${c.firstName?.toLowerCase()} ${c.lastName?.toLowerCase()}`.trim() === lowerName
    );

    if (!contact) {
      contact = allContacts.find(
        (c) =>
          c.name.toLowerCase().includes(lowerName) ||
          c.firstName?.toLowerCase().includes(lowerName) ||
          c.lastName?.toLowerCase().includes(lowerName) ||
          lowerName.includes(c.firstName?.toLowerCase() || '') ||
          lowerName.includes(c.lastName?.toLowerCase() || '')
      );
    }

    return contact || null;
  } catch (error) {
    console.error('[Contacts] Error finding contact by name:', error);
    return null;
  }
}

export async function findContactByPhone(phoneNumber: string): Promise<ContactInfo | null> {
  try {
    const allContacts = await getAllContacts();
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    
    for (const contact of allContacts) {
      if (contact.phoneNumbers) {
        for (const phone of contact.phoneNumbers) {
          const normalizedContactPhone = phone.number.replace(/\D/g, '');
          if (
            normalizedContactPhone === normalizedPhone ||
            normalizedContactPhone.endsWith(normalizedPhone) ||
            normalizedPhone.endsWith(normalizedContactPhone)
          ) {
            return contact;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[Contacts] Error finding contact by phone:', error);
    return null;
  }
}

