import SafeEventEmitter from '@metamask/safe-event-emitter';
import type { JsonRpcEngine, JsonRpcRequest } from 'json-rpc-engine';

/**
 * Construct an Ethereum provider from the given JSON-RPC engine.
 *
 * @param engine - The JSON-RPC engine to construct a provider from.
 * @returns An Ethereum provider.
 */
export default function providerFromEngine(
  engine: JsonRpcEngine,
): SafeEventEmitterProvider {
  return new SafeEventEmitterProvider({ engine });
}

class SafeEventEmitterProvider extends SafeEventEmitter {
  engine: JsonRpcEngine;

  /**
   * Construct a SafeEventEmitterProvider from a JSON-RPC engine.
   *
   * @param options - Options.
   * @param options.engine - The JSON-RPC engine used to process requests.
   */
  constructor({ engine }: { engine: JsonRpcEngine }) {
    super();
    this.engine = engine;

    if (engine.on) {
      engine.on('notification', (message: string) => {
        this.emit('data', null, message);
      });
    }
  }

  request = (req: JsonRpcRequest<unknown>) => {
    return new Promise((resolve, reject) => {
      this.sendAsync(req, (err: any, res: any) => {
        if (err) 
          reject(res.error);
        else 
          resolve(res.result)
      });
    });
  }

  /**
   * Send a provider request asynchronously.
   *
   * @param req - The request to send.
   * @param callback - A function that is called upon the success or failure of the request.
   */
  sendAsync = (
    req: JsonRpcRequest<unknown>,
    callback: (error: unknown, providerRes?: any) => void,
  ) => {
    this.engine.handle(req, callback);
  };

  /**
   * Send a provider request asynchronously.
   *
   * This method serves the same purpose as `sendAsync`. It only exists for
   * legacy reasons.
   *
   * @deprecated Use `sendAsync` instead.
   * @param req - The request to send.
   * @param callback - A function that is called upon the success or failure of the request.
   */
  send = (
    req: JsonRpcRequest<unknown>,
    callback: (error: unknown, providerRes?: any) => void,
  ) => {
    if (typeof callback !== 'function') {
      throw new Error('Must provide callback to "send" method.');
    }
    this.engine.handle(req, callback);
  };
}