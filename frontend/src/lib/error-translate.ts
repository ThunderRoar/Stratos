type Rule = { match: (raw: string) => boolean; message: string }

const RULES: Rule[] = [
  // Predict, manager DUSDC balance can't cover a mint/redeem withdrawal
  // Fires from balance_manager when withdraw_with_proof asks for more than is held
  {
    match: (r) => r.includes('balance_manager::withdraw_with_proof') && r.includes('abort code: 3'),
    message: 'Insufficient balance in manager. Try depositing more DUSDC, or reduce the strategy quantity.',
  },
  // Predict, strike is too far OTM for the time to expiry, so the pricing model rejects it. Common on short dated oracles with default template strikes
  {
    match: (r) => r.includes('EFairPriceAlreadySettled') || r.includes('FairPriceAlreadySettled'),
    message: "Strike too far from spot for this oracle's time-to-expiry. Pick strikes closer to spot, or use a longer-dated oracle.",
  },
  // Stratos executor, strategy shape validation
  {
    match: (r) => r.includes('::executor::') && r.includes('abort code: 1'),
    message: 'Bull Ladder requires strike1 < strike2.',
  },
  {
    match: (r) => r.includes('::executor::') && r.includes('abort code: 2'),
    message: 'Bear Ladder requires strike1 > strike2.',
  },
  {
    match: (r) => r.includes('::executor::') && r.includes('abort code: 3'),
    message: 'Strangle requires the DOWN strike below the UP strike.',
  },
  {
    match: (r) => r.includes('::executor::') && r.includes('abort code: 4'),
    message: 'Range Bet requires the low strike below the high strike.',
  },

  // Wallet UX, user cancelled the prompt
  {
    match: (r) => /user (rejected|denied|cancelled)/i.test(r) || r.includes('Rejected from user'),
    message: 'Transaction cancelled.',
  },
  {
    match: (r) => /closed the wallet window|popup (closed|was closed)|window (was )?closed/i.test(r),
    message: 'Wallet window closed before confirmation could be read. The transaction may have succeeded — check your balance or the explorer.',
  },
  // Gas, Sui balance too low for the tx, or no SUI coins at all
  {
    match: (r) => /insufficient (gas|sui)/i.test(r) || r.includes('no valid gas coins'),
    message: 'Not enough SUI for gas. Fund your wallet from the testnet faucet (faucet.sui.io).',
  }
]

export function translateError(raw: string | null | undefined): string | null {
  if (!raw) return null
  for (const rule of RULES) {
    if (rule.match(raw)) return rule.message
  }
  return raw
}