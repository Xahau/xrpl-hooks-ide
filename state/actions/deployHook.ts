import { derive, sign } from "xrpl-accountlib";

import state, { IAccount } from "../index";
import calculateHookOn from "../../utils/hookOnCalculator";

function arrayBufferToHex(arrayBuffer?: ArrayBuffer | null) {
  if (!arrayBuffer) {
    return "";
  }
  if (
    typeof arrayBuffer !== "object" ||
    arrayBuffer === null ||
    typeof arrayBuffer.byteLength !== "number"
  ) {
    throw new TypeError("Expected input to be an ArrayBuffer");
  }

  var view = new Uint8Array(arrayBuffer);
  var result = "";
  var value;

  for (var i = 0; i < view.length; i++) {
    value = view[i].toString(16);
    result += value.length === 1 ? "0" + value : value;
  }

  return result;
}

/* deployHook function turns the wasm binary into
 * hex string, signs the transaction and deploys it to
 * Hooks testnet.
 */
export const deployHook = async (account: IAccount & { name?: string }) => {
  if (
    !state.files ||
    state.files.length === 0 ||
    !state.files?.[state.active]?.compiledContent
  ) {
    return;
  }

  if (!state.files?.[state.active]?.compiledContent) {
    return;
  }
  if (!state.client) {
    return;
  }
  if (typeof window !== "undefined") {
    const tx = {
      Account: account.address,
      TransactionType: "SetHook",
      Sequence: account.sequence,
      Fee: "100000",
      Hooks: [
        //   {
        //     Hook: {
        //       CreateCode: 
        //       HookApiVersion: 0,
        //       HookNamespace: "Kissa",
        //       HookOn: calculateHookOn([]),
        //       Flags: 2
        //     }
        //   }
        // ]
        // [  
        {
          Hook: {
            CreateCode: arrayBufferToHex(
              state.files?.[state.active]?.compiledContent
            ).toUpperCase(),
            HookOn: calculateHookOn([]),
            HookNamespace: "DEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF",
            HookApiVersion: 0,
          }
        }
      ]
    };

    console.log(tx)

    const keypair = derive.familySeed(account.secret);
    const { signedTransaction } = sign(tx, keypair);
    const currentAccount = state.accounts.find(
      (acc) => acc.address === account.address
    );
    if (currentAccount) {
      currentAccount.isLoading = true;
    }
    try {
      const submitRes = await state.client.send({
        command: "submit",
        tx_blob: signedTransaction,
      });
      console.log(submitRes)
      if (submitRes.engine_result === "tesSUCCESS") {
        state.deployLogs.push({
          type: "success",
          message: "Hook deployed successfully ✅",
        });
        state.deployLogs.push({
          type: "success",
          message: `[${submitRes.engine_result}] ${submitRes.engine_result_message} Validated ledger index: ${submitRes.validated_ledger_index}`,
        });
      } else {
        state.deployLogs.push({
          type: "error",
          message: `[${submitRes.engine_result || submitRes.error}] ${submitRes.engine_result_message || submitRes.error_exception}`,
        });
      }
    } catch (err) {
      console.log(err);
      state.deployLogs.push({
        type: "error",
        message: "Error occured while deploying",
      });
    }
    if (currentAccount) {
      currentAccount.isLoading = false;
    }
  }
};