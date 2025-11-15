import { SelectOption } from '../transactions';

interface Flags {
    [key: string]: string;
}

export const transactionFlags: { [key: /* TransactionType */ string]: Flags } = {
    "*": {
        tfFullyCanonicalSig: '0x80000000'
    },
    Payment: {
        tfNoDirectRipple: '0x00010000',
        tfPartialPayment: '0x00020000',
        tfLimitQuality: '0x00040000',
    },
    AccountSet: {
        tfRequireDestTag: '0x00010000',
        tfOptionalDestTag: '0x00020000',
        tfRequireAuth: '0x00040000',
        tfOptionalAuth: '0x00080000',
        tfDisallowXRP: '0x00100000',
        tfAllowXRP: '0x00200000',
    },
    CronSet: {
        tfCronUnset: '0x00000001',
    },
    NFTokenCreateOffer: {
        tfSellNFToken: '0x00000001',
    },
    NFTokenMint: {
        tfBurnable: '0x00000001',
        tfOnlyXRP: '0x00000002',
        tfTrustLine: '0x00000004',
        tfTransferable: '0x00000008',
    },
    OfferCreate: {
        tfPassive: '0x00010000',
        tfImmediateOrCancel: '0x00020000',
        tfFillOrKill: '0x00040000',
        tfSell: '0x00080000',
    },
    PaymentChannelClaim: {
        tfRenew: '0x00010000',
        tfClose: '0x00020000',
    },
    TrustSet: {
        tfSetfAuth: '0x00010000',
        tfSetNoRipple: '0x00020000',
        tfClearNoRipple: '0x00040000',
        tfSetFreeze: '0x00100000',
        tfClearFreeze: '0x00200000',
    },
    URITokenMint: {
        tfBurnable: '0x00000001',
    },
}

export const getFlags = (tt?: string) => {
    if (!tt) return
    const flags = {
        ...transactionFlags['*'],
        ...transactionFlags[tt]
    }

    return flags
}


export function combineFlags(flags?: string[]): string | undefined {
    if (!flags) return

    const num = flags.reduce((cumm, curr) => cumm | BigInt(curr), BigInt(0))
    return num.toString()
}

export function extractFlags(transactionType: string, flags?: string | number,): SelectOption[] {
    const flagsObj = getFlags(transactionType)
    if (!flags || !flagsObj) return []

    const extracted = Object.entries(flagsObj).reduce((cumm, [label, value]) => {
        return (BigInt(flags) & BigInt(value)) ? cumm.concat({ label, value }) : cumm
    }, [] as SelectOption[])

    return extracted
}
