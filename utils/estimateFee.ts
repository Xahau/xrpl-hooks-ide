import toast from 'react-hot-toast'
import { IAccount } from '../state'
import { encode, TransactionMetadata, TxResponse } from '@transia/xrpl'
import { rpc } from '../state/actions/xrpl-client'


const createByteMultiplier = 500;
const feeCalculationFailed = -1;

function contractCreateFee(byteCount: number): number {
  const mul = createByteMultiplier;
  if (byteCount > Number.MAX_SAFE_INTEGER / mul) return feeCalculationFailed; // overflow
  const uf = byteCount * mul;
  if (uf > Number.MAX_SAFE_INTEGER) return feeCalculationFailed;
  return uf;
}

export const estimateDeployFee = async (
  tx: Record<string, unknown>,
  opts: { silent?: boolean } = {}
): Promise<number | null> => {
  try {
    let createFee = 0;
    let byteCount = 0;

    if (tx.ContractCode && typeof tx.ContractCode === 'string') {
      byteCount = tx.ContractCode.length / 2;
    }
  
    if (byteCount > 0) {
      createFee = contractCreateFee(byteCount);
      if (createFee === feeCalculationFailed) {
        throw new Error('Fee calculation overflow');
      }
    }

    const baseFee = 10;
    const increment = 200000;
    const maxAmount = Number.MAX_SAFE_INTEGER;

    if (createFee > maxAmount - increment) {
      throw new Error('Create fee overflow detected');
    }

    createFee += increment;

    if (baseFee > maxAmount - createFee) {
      throw new Error('Total fee overflow detected');
    }

    const totalFee = createFee + baseFee;

    return totalFee;
  } catch (err) {
    if (!opts.silent) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error estimating fee!';
      toast.error(msg);
    }
    return null;
  }
}

export const estimateCallFee = async (
  tx: Record<string, unknown>,
  account: IAccount,
  opts: { silent?: boolean } = {}
): Promise<null | {
  base_fee: string
  median_fee: string
  minimum_fee: string
  open_ledger_fee: string
}> => {
  try {
    const copyTx = JSON.parse(JSON.stringify(tx))
    delete copyTx['SigningPubKey']
    copyTx.Fee = '10000000'

    const encodedTx = encode(copyTx)

    const res = await rpc({ command: 'simulate', tx_blob: encodedTx }) as TxResponse
    const meta = res.result.meta as TransactionMetadata

    // @ts-expect-error -- ignore
    const gasUsed = meta.GasUsed
    
    // @ts-expect-error -- ignore
    if (res.result.error) {
      // @ts-expect-error -- ignore
      throw new Error(`[${res.result.error}] ${res.result.error_exception}.`);
    }
    if (gasUsed) {
      return {
        base_fee: String(gasUsed),
        median_fee: '12',
        minimum_fee: '8',
        open_ledger_fee: '15'
      }
    }
    return null
  } catch (err) {
    if (!opts.silent) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Error estimating fee!';
      toast.error(msg);
    }
    return null
  }
}

export const estimateFee = async (
  tx: Record<string, unknown>,
  account: IAccount,
  opts: { silent?: boolean } = {}
): Promise<null | {
  base_fee: string
  median_fee: string
  minimum_fee: string
  open_ledger_fee: string
}> => {
  try {
    // simulate api
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      base_fee: '200000000',
      median_fee: '12',
      minimum_fee: '8',
      open_ledger_fee: '15'
    }
    // const copyTx = JSON.parse(JSON.stringify(tx))
    // delete copyTx['SigningPubKey']
    // copyTx.Fee = '10000000'

    // console.log(copyTx);
    // if (copyTx.Functions) {
    //   copyTx.Functions = (copyTx.Functions as any[]).map(func => {
    //     const ifunc = func.Function
    //     if (ifunc.FunctionName && !isHex(ifunc.FunctionName as string)) {
    //       ifunc.FunctionName = convertStringToHex(ifunc.FunctionName as string)
    //     }
    //     return { Function: ifunc }
    //   })
    // }
    

    // const encodedTx = encode(copyTx)

    // const res = await rpc({ command: 'simulate', tx_blob: encodedTx }) as TxResponse
    // const meta = res.result.meta as TransactionMetadata
    
    // if (res.result.error) {
    //   throw new Error(`[${res.result.error}] ${res.result.error_exception}.`);
    // }
    // if (res && res.drops) {
    //   return res.drops
    // }
    // return null
  } catch (err) {
    if (!opts.silent) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Error estimating fee!';
      toast.error(msg);
    }
    return null
  }
}
