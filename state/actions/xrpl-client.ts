import { Client } from '@transia/xrpl';
import state from '..';

export const rpc = async(...params: Parameters<Client['request']>) => {
    const client = await state.client.isConnected() ? state.client : null;
    return client?.request(...params);
}