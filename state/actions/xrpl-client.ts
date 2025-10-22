import { Client } from '@transia/xrpl';
import state from '..';

export const rpc = async(...params: Parameters<Client['request']>) => {
    const client = await state.client.isConnected() ? state.client : null;
    return client?.request(...params);
}

export const submitAndWait = async(...params: Parameters<Client['submitAndWait']>) => {
    const client = await state.client.isConnected() ? state.client : null;
    return client?.submitAndWait(...params);
}

export const autofill = async(...params: Parameters<Client['autofill']>) => {
    const client = await state.client.isConnected() ? state.client : null;
    return client?.autofill(...params);
}