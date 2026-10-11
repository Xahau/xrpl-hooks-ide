export interface ServerDefinitions {
  TYPES: Record<string, number>
  FIELDS: [string, { nth: number; type: string; isSerialized: boolean }][]
  TRANSACTION_TYPES: Record<string, number>
  HOOK?: {
    API: Record<
      string,
      { return: string; params: { type: string; name: string }[]; amendment?: string }
    >
    KEYLET_TYPES: Record<string, number>
    RETURN_CODES: Record<string, number>
  }
}

// JSON name → tt macro, from xahaud include/xrpl/protocol/detail/transactions.macro; update by hand on new releases. Unknown names fall back to UPPER_SNAKE.
export const TT_MACRO_NAMES: Record<string, string> = {
  Payment: 'ttPAYMENT',
  EscrowCreate: 'ttESCROW_CREATE',
  EscrowFinish: 'ttESCROW_FINISH',
  AccountSet: 'ttACCOUNT_SET',
  EscrowCancel: 'ttESCROW_CANCEL',
  SetRegularKey: 'ttREGULAR_KEY_SET',
  OfferCreate: 'ttOFFER_CREATE',
  OfferCancel: 'ttOFFER_CANCEL',
  TicketCreate: 'ttTICKET_CREATE',
  SignerListSet: 'ttSIGNER_LIST_SET',
  PaymentChannelCreate: 'ttPAYCHAN_CREATE',
  PaymentChannelFund: 'ttPAYCHAN_FUND',
  PaymentChannelClaim: 'ttPAYCHAN_CLAIM',
  CheckCreate: 'ttCHECK_CREATE',
  CheckCash: 'ttCHECK_CASH',
  CheckCancel: 'ttCHECK_CANCEL',
  DepositPreauth: 'ttDEPOSIT_PREAUTH',
  TrustSet: 'ttTRUST_SET',
  AccountDelete: 'ttACCOUNT_DELETE',
  SetHook: 'ttHOOK_SET',
  NFTokenMint: 'ttNFTOKEN_MINT',
  NFTokenBurn: 'ttNFTOKEN_BURN',
  NFTokenCreateOffer: 'ttNFTOKEN_CREATE_OFFER',
  NFTokenCancelOffer: 'ttNFTOKEN_CANCEL_OFFER',
  NFTokenAcceptOffer: 'ttNFTOKEN_ACCEPT_OFFER',
  Clawback: 'ttCLAWBACK',
  AMMClawback: 'ttAMM_CLAWBACK',
  AMMCreate: 'ttAMM_CREATE',
  AMMDeposit: 'ttAMM_DEPOSIT',
  AMMWithdraw: 'ttAMM_WITHDRAW',
  AMMVote: 'ttAMM_VOTE',
  AMMBid: 'ttAMM_BID',
  AMMDelete: 'ttAMM_DELETE',
  URITokenMint: 'ttURITOKEN_MINT',
  URITokenBurn: 'ttURITOKEN_BURN',
  URITokenBuy: 'ttURITOKEN_BUY',
  URITokenCreateSellOffer: 'ttURITOKEN_CREATE_SELL_OFFER',
  URITokenCancelSellOffer: 'ttURITOKEN_CANCEL_SELL_OFFER',
  XChainCreateClaimID: 'ttXCHAIN_CREATE_CLAIM_ID',
  XChainCommit: 'ttXCHAIN_COMMIT',
  XChainClaim: 'ttXCHAIN_CLAIM',
  XChainAccountCreateCommit: 'ttXCHAIN_ACCOUNT_CREATE_COMMIT',
  XChainAddClaimAttestation: 'ttXCHAIN_ADD_CLAIM_ATTESTATION',
  XChainAddAccountCreateAttestation: 'ttXCHAIN_ADD_ACCOUNT_CREATE_ATTESTATION',
  XChainModifyBridge: 'ttXCHAIN_MODIFY_BRIDGE',
  XChainCreateBridge: 'ttXCHAIN_CREATE_BRIDGE',
  DIDSet: 'ttDID_SET',
  DIDDelete: 'ttDID_DELETE',
  OracleSet: 'ttORACLE_SET',
  OracleDelete: 'ttORACLE_DELETE',
  LedgerStateFix: 'ttLEDGER_STATE_FIX',
  MPTokenIssuanceCreate: 'ttMPTOKEN_ISSUANCE_CREATE',
  MPTokenIssuanceDestroy: 'ttMPTOKEN_ISSUANCE_DESTROY',
  MPTokenIssuanceSet: 'ttMPTOKEN_ISSUANCE_SET',
  MPTokenAuthorize: 'ttMPTOKEN_AUTHORIZE',
  CredentialCreate: 'ttCREDENTIAL_CREATE',
  CredentialAccept: 'ttCREDENTIAL_ACCEPT',
  CredentialDelete: 'ttCREDENTIAL_DELETE',
  NFTokenModify: 'ttNFTOKEN_MODIFY',
  PermissionedDomainSet: 'ttPERMISSIONED_DOMAIN_SET',
  PermissionedDomainDelete: 'ttPERMISSIONED_DOMAIN_DELETE',
  SetManifest: 'ttMANIFEST_SET',
  Cron: 'ttCRON',
  CronSet: 'ttCRON_SET',
  SetRemarks: 'ttREMARKS_SET',
  Remit: 'ttREMIT',
  GenesisMint: 'ttGENESIS_MINT',
  Import: 'ttIMPORT',
  ClaimReward: 'ttCLAIM_REWARD',
  Invoke: 'ttINVOKE',
  EnableAmendment: 'ttAMENDMENT',
  SetFee: 'ttFEE',
  UNLModify: 'ttUNL_MODIFY',
  EmitFailure: 'ttEMIT_FAILURE',
  UNLReport: 'ttUNL_REPORT'
}

const ttMacro = (name: string) =>
  TT_MACRO_NAMES[name] ??
  'tt' +
    name
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .toUpperCase()

const header = (script: string) =>
  `// For documentation please see: https://xrpl-hooks.readme.io/reference/\n// Generated using ${script}\n`

const byName = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export const generateHookHeaders = (
  defs: ServerDefinitions,
  defaults: Record<string, string>
): Record<string, string> => {
  const sfcodes =
    header('generate_sfcodes.sh') +
    defs.FIELDS.filter(([, f]) => f.isSerialized)
      .map(([name, f]) => `#define sf${name} ((${defs.TYPES[f.type]}U << 16U) + ${f.nth}U)\n`)
      .join('')

  const tts =
    header('generate_tts.sh') +
    Object.entries(defs.TRANSACTION_TYPES)
      .filter(([, code]) => code >= 0)
      .sort((a, b) => a[1] - b[1])
      .map(([name, code]) => `#define ${ttMacro(name)} ${code}\n`)
      .join('')

  const result: Record<string, string> = {
    ...defaults,
    'sfcodes.h': sfcodes,
    'tts.h': tts
  }

  const hook = defs.HOOK
  if (!hook) return result

  result['error.h'] =
    header('generate_error.sh') +
    '#ifndef HOOK_ERROR_CODES\n' +
    Object.entries(hook.RETURN_CODES)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => `#define ${name} ${value}\n`)
      .join('') +
    '#define HOOK_ERROR_CODES\n#endif //HOOK_ERROR_CODES\n'

  result['extern.h'] =
    header('generate_extern.sh') +
    '#include <stdint.h>\n#ifndef HOOK_EXTERN\n#ifdef __cplusplus\nextern "C" {\n#endif\n\n' +
    Object.keys(hook.API)
      .sort(byName)
      .map(name => {
        const { return: ret, params, amendment } = hook.API[name]
        const fn = name === '_g' ? '__attribute__((noduplicate)) _g' : name
        return (
          (amendment ? `// requires amendment ${amendment}\n` : '') +
          `extern ${ret} ${fn}(${params.map(p => `${p.type} ${p.name}`).join(', ')});\n\n`
        )
      })
      .join('') +
    '#ifdef __cplusplus\n}\n#endif\n#define HOOK_EXTERN\n#endif  // HOOK_EXTERN\n'

  // keylet_code names the emitted-txn keylet EMITTED_TXN; hookapi.h and the docs call it KEYLET_EMITTED
  const keyletAliases: Record<string, string> = { EMITTED_TXN: 'EMITTED' }
  const keylets = Object.entries(hook.KEYLET_TYPES)
    .sort((a, b) => a[1] - b[1])
    .flatMap(([name, value]) =>
      [name, keyletAliases[name]].filter(Boolean).map(n => `#define KEYLET_${n} ${value}\n`)
    )
    .join('')
  result['hookapi.h'] = defaults['hookapi.h'].replace(/(?:#define KEYLET_\w+ .*\n)+/, () => keylets)

  return result
}
