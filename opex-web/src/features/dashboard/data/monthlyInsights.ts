import { normalizeLanguage, type AppLanguage } from '../../../i18n/constants';

export type MonthlyInsightAreaKey =
  | 'tax'
  | 'vat'
  | 'cashflow'
  | 'income'
  | 'budget'
  | 'behaviour'
  | 'spending'
  | 'risk'
  | 'subscriptions'
  | 'savings'
  | 'taxSavings'
  | 'efficiency'
  | 'safety'
  | 'insight';

export interface MonthlyInsightItem {
  id: string;
  areaKey: MonthlyInsightAreaKey;
  area: string;
  name: string;
  description: string;
}

type MonthlyInsightCopy = Pick<MonthlyInsightItem, 'area' | 'name' | 'description'>;

const MONTHLY_INSIGHT_DEFINITIONS: Array<{
  id: string;
  areaKey: MonthlyInsightAreaKey;
  copy: Record<AppLanguage, MonthlyInsightCopy>;
}> = [
  {
    id: 'TAX_LOW_BUFFER',
    areaKey: 'tax',
    copy: {
      it: { area: 'Tasse', name: 'Tax buffer troppo basso', description: 'Hai accantonato meno del necessario rispetto alle imposte stimate' },
      en: { area: 'Tax', name: 'Tax buffer too low', description: "You're underfunded vs estimated taxes" }
    }
  },
  {
    id: 'TAX_ON_TRACK',
    areaKey: 'tax',
    copy: {
      it: { area: 'Tasse', name: 'Tax buffer in linea', description: 'Il tuo accantonamento fiscale è in linea con il fabbisogno stimato' },
      en: { area: 'Tax', name: 'Tax buffer on track', description: 'Your tax buffer roughly matches tax need' }
    }
  },
  {
    id: 'TAX_OVERFUNDED',
    areaKey: 'tax',
    copy: {
      it: { area: 'Tasse', name: 'Tax buffer troppo alto', description: 'Probabilmente hai messo da parte troppo nel tax buffer' },
      en: { area: 'Tax', name: 'Tax buffer overfunded', description: "You've likely parked too much in tax buffer" }
    }
  },
  {
    id: 'TAX_BUFFER_SPENT',
    areaKey: 'tax',
    copy: {
      it: { area: 'Tasse', name: 'Hai speso dal tax buffer', description: 'Hai usato fondi che erano destinati alle imposte' },
      en: { area: 'Tax', name: 'You spent from tax buffer', description: 'You dipped into money meant for taxes' }
    }
  },
  {
    id: 'TAX_SPIKE',
    areaKey: 'tax',
    copy: {
      it: { area: 'Tasse', name: 'Picco di imposte stimate', description: 'La previsione delle tue imposte è salita bruscamente' },
      en: { area: 'Tax', name: 'Estimated tax spike', description: 'Your forecast tax bill jumped sharply' }
    }
  },
  {
    id: 'VAT_BUFFER_LOW',
    areaKey: 'vat',
    copy: {
      it: { area: 'IVA', name: 'Buffer IVA troppo basso', description: "L'IVA accantonata è sotto l'importo atteso" },
      en: { area: 'VAT', name: 'VAT buffer too low', description: 'VAT set aside is below expected amount' }
    }
  },
  {
    id: 'VAT_REFUND',
    areaKey: 'vat',
    copy: {
      it: { area: 'IVA', name: 'Rimborso IVA atteso', description: 'È probabile che tu abbia diritto a un rimborso IVA' },
      en: { area: 'VAT', name: 'VAT refund expected', description: "You're likely due a VAT refund" }
    }
  },
  {
    id: 'VAT_INCONSISTENT',
    areaKey: 'vat',
    copy: {
      it: { area: 'IVA', name: 'Pattern IVA incoerente', description: 'Le spese IVA e non IVA sembrano poco coerenti' },
      en: { area: 'VAT', name: 'Inconsistent VAT pattern', description: 'VAT vs non-VAT spending looks suspicious' }
    }
  },
  {
    id: 'TAX_BRACKET_CHANGE',
    areaKey: 'tax',
    copy: {
      it: { area: 'Tasse', name: 'Cambio di scaglione probabile', description: 'Il tuo reddito potrebbe portarti in uno scaglione più alto' },
      en: { area: 'Tax', name: 'Tax bracket likely changing', description: 'Your income may push you into a new bracket' }
    }
  },
  {
    id: 'CF_RUNWAY_LOW',
    areaKey: 'cashflow',
    copy: {
      it: { area: 'Liquidità', name: 'Runway sotto il target', description: 'Hai meno mesi di autonomia rispetto al tuo obiettivo' },
      en: { area: 'Cashflow', name: 'Runway below target', description: "You don't have enough months of survival" }
    }
  },
  {
    id: 'CF_RUNWAY_UP',
    areaKey: 'cashflow',
    copy: {
      it: { area: 'Liquidità', name: 'Runway migliorato', description: 'La tua autonomia di cassa è aumentata in modo significativo' },
      en: { area: 'Cashflow', name: 'Runway improved', description: 'Your runway has increased meaningfully' }
    }
  },
  {
    id: 'CF_BURN_STREAK',
    areaKey: 'cashflow',
    copy: {
      it: { area: 'Liquidità', name: 'Cash burn costante', description: 'Stai bruciando cassa per più mesi consecutivi' },
      en: { area: 'Cashflow', name: 'Consistent cash burn', description: "You're burning cash several months in a row" }
    }
  },
  {
    id: 'CF_BREAKEVEN',
    areaKey: 'cashflow',
    copy: {
      it: { area: 'Liquidità', name: 'Mese in pareggio', description: 'Questo mese hai finalmente coperto tutte le spese' },
      en: { area: 'Cashflow', name: 'Break-even month', description: 'You finally covered expenses this month' }
    }
  },
  {
    id: 'CF_BIG_INFLOW',
    areaKey: 'cashflow',
    copy: {
      it: { area: 'Liquidità', name: 'Grande entrata di cassa', description: 'Un forte afflusso di liquidità è arrivato sul conto' },
      en: { area: 'Cashflow', name: 'Major cash inflow', description: 'A big inflow hit your account' }
    }
  },
  {
    id: 'CF_BIG_OUTFLOW',
    areaKey: 'cashflow',
    copy: {
      it: { area: 'Liquidità', name: 'Grande uscita di cassa', description: 'Una spesa importante è uscita dal tuo conto' },
      en: { area: 'Cashflow', name: 'Major cash outflow', description: 'A big expense left your account' }
    }
  },
  {
    id: 'CF_BALANCE_LOW',
    areaKey: 'cashflow',
    copy: {
      it: { area: 'Liquidità', name: 'Saldo vicino allo zero', description: 'Il tuo saldo di cassa è pericolosamente basso' },
      en: { area: 'Cashflow', name: 'Balance close to zero', description: 'Your cash balance is dangerously low' }
    }
  },
  {
    id: 'CF_LIQ_MISMATCH',
    areaKey: 'cashflow',
    copy: {
      it: { area: 'Liquidità', name: 'Conti sbilanciati', description: 'Un conto è sovraccarico mentre un altro è in sofferenza' },
      en: { area: 'Cashflow', name: 'Accounts unbalanced', description: 'One account is bloated, another starving' }
    }
  },
  {
    id: 'INC_NEW_CLIENT',
    areaKey: 'income',
    copy: {
      it: { area: 'Entrate', name: 'Nuovo cliente rilevato', description: 'Un nuovo pagatore sta diventando un cliente reale' },
      en: { area: 'Income', name: 'New client detected', description: 'A new payer is becoming a real client' }
    }
  },
  {
    id: 'INC_CLIENT_CONC',
    areaKey: 'income',
    copy: {
      it: { area: 'Entrate', name: 'Rischio concentrazione clienti', description: 'Troppo reddito dipende da un solo cliente' },
      en: { area: 'Income', name: 'Client concentration risk', description: 'Too much income from a single client' }
    }
  },
  {
    id: 'INC_CLIENT_INACT',
    areaKey: 'income',
    copy: {
      it: { area: 'Entrate', name: 'Cliente inattivo', description: 'Un cliente prima attivo ha smesso di generare movimenti' },
      en: { area: 'Income', name: 'Client inactivity', description: 'A previously active client went silent' }
    }
  },
  {
    id: 'INC_DROP',
    areaKey: 'income',
    copy: {
      it: { area: 'Entrate', name: 'Calo entrate rispetto alla base', description: 'Le entrate di questo mese sono molto sotto la norma' },
      en: { area: 'Income', name: 'Income drop vs baseline', description: "This month's income is far below normal" }
    }
  },
  {
    id: 'INC_RECORD',
    areaKey: 'income',
    copy: {
      it: { area: 'Entrate', name: 'Mese record di entrate', description: 'Questo è il tuo miglior mese di entrate dell’ultimo anno' },
      en: { area: 'Income', name: 'Record income month', description: 'This is your best income month in a year' }
    }
  },
  {
    id: 'INC_RECURRING',
    areaKey: 'income',
    copy: {
      it: { area: 'Entrate', name: 'Pattern di entrate ricorrenti', description: 'Stai costruendo un flusso di entrate semi-ricorrente' },
      en: { area: 'Income', name: 'Recurring income pattern', description: "You've got semi-regular recurring income" }
    }
  },
  {
    id: 'INC_MISSING_PAY',
    areaKey: 'income',
    copy: {
      it: { area: 'Entrate', name: 'Pagamento atteso mancante', description: 'Probabilmente c’è una fattura che non è stata ancora pagata' },
      en: { area: 'Income', name: 'Missing expected payment', description: "A likely invoice hasn't been paid yet" }
    }
  },
  {
    id: 'BUD_CAT_OVER',
    areaKey: 'budget',
    copy: {
      it: { area: 'Budget', name: 'Categoria fuori budget', description: 'Hai superato il budget previsto in una categoria' },
      en: { area: 'Budget', name: 'Category overspent', description: 'You blew past your budget in a category' }
    }
  },
  {
    id: 'BUD_CAT_UNDER',
    areaKey: 'budget',
    copy: {
      it: { area: 'Budget', name: 'Categoria sotto budget', description: 'Stai spendendo meno del previsto in quella categoria' },
      en: { area: 'Budget', name: 'Category underspent', description: "You're spending less than planned there" }
    }
  },
  {
    id: 'BUD_TOTAL_OVER',
    areaKey: 'budget',
    copy: {
      it: { area: 'Budget', name: 'Budget totale superato', description: 'La spesa complessiva supera il piano previsto' },
      en: { area: 'Budget', name: 'Total budget overspent', description: 'Overall spending exceeds your plan' }
    }
  },
  {
    id: 'BUD_PERS_BUS_IMB',
    areaKey: 'behaviour',
    copy: {
      it: { area: 'Comportamento', name: 'Squilibrio personale vs business', description: 'Lo stile di vita personale pesa più della crescita del business' },
      en: { area: 'Behaviour', name: 'Personal vs business imbalance', description: 'Personal lifestyle > business investment' }
    }
  },
  {
    id: 'BUD_SPEND_SPIKE',
    areaKey: 'spending',
    copy: {
      it: { area: 'Spese', name: 'Picco di spesa', description: 'Questo mese hai speso molto più del solito' },
      en: { area: 'Spending', name: 'Spending spike', description: 'You spent way more than usual this month' }
    }
  },
  {
    id: 'BUD_UNUSUAL_MERCH',
    areaKey: 'risk',
    copy: {
      it: { area: 'Rischio', name: 'Merchant o paese insolito', description: 'È comparso un merchant o un paese fuori dal normale' },
      en: { area: 'Risk', name: 'Unusual merchant / country', description: 'A weird merchant or country showed up' }
    }
  },
  {
    id: 'BUD_DUPLICATE',
    areaKey: 'risk',
    copy: {
      it: { area: 'Rischio', name: 'Possibile pagamento duplicato', description: 'Potresti aver pagato due volte la stessa voce' },
      en: { area: 'Risk', name: 'Possible duplicate payment', description: 'You might have paid the same thing twice' }
    }
  },
  {
    id: 'BUD_CASH_PATTERN',
    areaKey: 'behaviour',
    copy: {
      it: { area: 'Comportamento', name: 'Cambio nel pattern di prelievo', description: 'Le tue abitudini di prelievo sono cambiate molto' },
      en: { area: 'Behaviour', name: 'Cash withdrawal pattern change', description: 'Your cash withdrawal habits changed a lot' }
    }
  },
  {
    id: 'SUB_NEW',
    areaKey: 'subscriptions',
    copy: {
      it: { area: 'Abbonamenti', name: 'Nuovo abbonamento rilevato', description: 'È comparso un nuovo pagamento ricorrente' },
      en: { area: 'Subscriptions', name: 'New subscription detected', description: 'A new recurring payment has appeared' }
    }
  },
  {
    id: 'SUB_PRICE_UP',
    areaKey: 'subscriptions',
    copy: {
      it: { area: 'Abbonamenti', name: 'Aumento prezzo abbonamento', description: 'Uno dei tuoi abbonamenti è diventato più costoso' },
      en: { area: 'Subscriptions', name: 'Subscription price increase', description: 'A subscription got more expensive' }
    }
  },
  {
    id: 'SUB_UNUSED',
    areaKey: 'subscriptions',
    copy: {
      it: { area: 'Abbonamenti', name: 'Abbonamento forse inutilizzato', description: 'Stai pagando qualcosa che usi molto poco' },
      en: { area: 'Subscriptions', name: 'Possibly unused subscription', description: "You're paying for something you barely use" }
    }
  },
  {
    id: 'SUB_RENEWAL',
    areaKey: 'subscriptions',
    copy: {
      it: { area: 'Abbonamenti', name: 'Rinnovo in arrivo', description: 'Sta per arrivare un rinnovo che peserà sulla tua cassa' },
      en: { area: 'Subscriptions', name: 'Subscription renewal soon', description: 'A renewal is coming that hits your cashflow' }
    }
  },
  {
    id: 'GOAL_EMERG_DONE',
    areaKey: 'savings',
    copy: {
      it: { area: 'Risparmi', name: 'Obiettivo fondo emergenza raggiunto', description: 'Hai raggiunto il traguardo del fondo di emergenza' },
      en: { area: 'Savings', name: 'Emergency fund milestone', description: 'You hit your emergency fund goal' }
    }
  },
  {
    id: 'GOAL_REACHED',
    areaKey: 'savings',
    copy: {
      it: { area: 'Risparmi', name: 'Obiettivo di risparmio raggiunto', description: 'Hai raggiunto uno specifico traguardo di risparmio' },
      en: { area: 'Savings', name: 'Savings goal reached', description: 'You reached a specific savings target' }
    }
  },
  {
    id: 'GOAL_OFF_TRACK',
    areaKey: 'savings',
    copy: {
      it: { area: 'Risparmi', name: 'Obiettivo di risparmio fuori rotta', description: 'Con il ritmo attuale non raggiungerai il tuo obiettivo' },
      en: { area: 'Savings', name: 'Savings goal off track', description: "At current pace you won't hit your goal" }
    }
  },
  {
    id: 'SAVE_NO_TRANSFER',
    areaKey: 'savings',
    copy: {
      it: { area: 'Risparmi', name: 'Nessun risparmio questo mese', description: 'Questo mese non hai messo nulla da parte' },
      en: { area: 'Savings', name: 'No savings this month', description: "You didn't put anything aside this month" }
    }
  },
  {
    id: 'SAVE_PAY_YOURSELF',
    areaKey: 'behaviour',
    copy: {
      it: { area: 'Comportamento', name: 'Suggerimento pay-yourself-first', description: 'Tendi a spendere tutto quello che incassi' },
      en: { area: 'Behaviour', name: 'Pay-yourself-first suggestion', description: 'You always spend everything you earn' }
    }
  },
  {
    id: 'SAVE_IGNORING_TAX',
    areaKey: 'taxSavings',
    copy: {
      it: { area: 'Tasse/Risparmi', name: 'Risparmi ma ignori le tasse', description: 'Metti da parte per te, ma non per il fisco' },
      en: { area: 'Tax/Savings', name: 'Saving but ignoring taxes', description: 'You save for you, not for the tax man' }
    }
  },
  {
    id: 'SAVE_SURPLUS',
    areaKey: 'savings',
    copy: {
      it: { area: 'Risparmi', name: 'Surplus disponibile', description: 'Hai cassa in eccesso che puoi allocare meglio' },
      en: { area: 'Savings', name: 'Surplus available', description: 'You regularly have spare cash to allocate' }
    }
  },
  {
    id: 'RISK_LARGE_UNKNOWN',
    areaKey: 'risk',
    copy: {
      it: { area: 'Rischio', name: 'Grande transazione sconosciuta', description: 'È avvenuta una transazione anomala di importo elevato' },
      en: { area: 'Risk', name: 'Large unknown transaction', description: 'A big suspicious transaction happened' }
    }
  },
  {
    id: 'RISK_HIGH_FEES',
    areaKey: 'efficiency',
    copy: {
      it: { area: 'Efficienza', name: 'Commissioni bancarie elevate', description: 'Stai perdendo margine in costi bancari o FX nascosti' },
      en: { area: 'Efficiency', name: 'High FX / bank fees', description: "You're bleeding in hidden banking costs" }
    }
  },
  {
    id: 'RISK_PATTERN_CHANGE',
    areaKey: 'risk',
    copy: {
      it: { area: 'Rischio', name: 'Pattern carta cambiato', description: 'Il comportamento della carta è cambiato tra online e POS' },
      en: { area: 'Risk', name: 'Card usage pattern changed', description: 'Card behaviour changed (online vs POS)' }
    }
  },
  {
    id: 'RISK_NEAR_OVERDRAFT',
    areaKey: 'safety',
    copy: {
      it: { area: 'Sicurezza', name: 'Vicino allo scoperto', description: 'Sei molto vicino a finire in negativo' },
      en: { area: 'Safety', name: 'Near overdraft / limit', description: "You're flirting with going negative" }
    }
  },
  {
    id: 'INS_SPEND_TREND',
    areaKey: 'insight',
    copy: {
      it: { area: 'Insight', name: 'Trend di spesa', description: 'Il tuo mix o livello di spesa è cambiato in modo visibile' },
      en: { area: 'Insight', name: 'Spending trend insight', description: 'Your spending mix / level shifted' }
    }
  },
  {
    id: 'INS_INCOME_VOL',
    areaKey: 'insight',
    copy: {
      it: { area: 'Insight', name: 'Volatilità delle entrate', description: 'Le tue entrate mostrano una forte variabilità' },
      en: { area: 'Insight', name: 'Income volatility insight', description: 'Your income is highly variable' }
    }
  },
  {
    id: 'INS_SEASONALITY',
    areaKey: 'insight',
    copy: {
      it: { area: 'Insight', name: 'Stagionalità rilevata', description: 'Nei tuoi numeri emerge un pattern stagionale chiaro' },
      en: { area: 'Insight', name: 'Seasonality insight', description: 'Clear seasonal pattern in your finances' }
    }
  },
  {
    id: 'INS_TAX_PLAN',
    areaKey: 'insight',
    copy: {
      it: { area: 'Insight', name: 'Suggerimento di pianificazione fiscale', description: 'I tuoi profitti giustificano una pianificazione fiscale più evoluta' },
      en: { area: 'Insight', name: 'Tax planning suggestion', description: 'Your profits justify smarter tax planning' }
    }
  },
  {
    id: 'INS_LIFESTYLE_BUS',
    areaKey: 'insight',
    copy: {
      it: { area: 'Insight', name: 'Lifestyle vs business', description: 'Spese personali e crescita del business sono in tensione' },
      en: { area: 'Insight', name: 'Lifestyle vs business insight', description: 'Lifestyle spending vs business growth trade-off' }
    }
  }
];

export const resolveMonthlyInsightMessages = (language: string): MonthlyInsightItem[] => {
  const normalizedLanguage = normalizeLanguage(language);

  return MONTHLY_INSIGHT_DEFINITIONS.map(({ copy, ...definition }) => ({
    ...definition,
    ...copy[normalizedLanguage]
  }));
};
