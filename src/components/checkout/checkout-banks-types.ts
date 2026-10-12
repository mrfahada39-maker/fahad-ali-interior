import React from 'react';

export type PaymentMethodType = 'cod' | 'jazzcash' | 'easypaisa' | 'card' | 'bank';

export interface BankItem {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  code: string;
  cardTheme: {
    bgGradient: string;
    borderRim: string;
    textColor: string;
    subTextColor: string;
    accentColor: string;
    glowColor: string;
    badgeStyle: string;
    chipGradient: string;
    chipBorder: string;
  };
  renderLogo: (className?: string) => React.ReactNode;
}
