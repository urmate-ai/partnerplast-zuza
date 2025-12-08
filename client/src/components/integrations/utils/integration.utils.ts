export type IntegrationColors = {
  iconColor: string;
  backgroundColor: string;
};

export function getCategoryColor(category?: string): IntegrationColors {
  switch (category?.toLowerCase()) {
    case 'communication':
      return { iconColor: '#2563EB', backgroundColor: '#DBEAFE' };
    case 'productivity':
      return { iconColor: '#16A34A', backgroundColor: '#DCFCE7' };
    case 'social':
      return { iconColor: '#9333EA', backgroundColor: '#F3E8FF' };
    default:
      return { iconColor: '#6B7280', backgroundColor: '#F3F4F6' };
  }
}

