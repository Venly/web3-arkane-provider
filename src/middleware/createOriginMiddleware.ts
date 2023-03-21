/**
 * Returns a middleware that appends the DApp origin to request
 *
 * @param {{ origin: string }} opts - The middleware options
 * @returns {Function}
 */
export default function createOriginMiddleware(opts: { origin: string }): Function {
  return function originMiddleware(
    /** @type {any} */ req: any,
    /** @type {any} */ _: any,
    /** @type {Function} */ next: Function,
  ) {
    req.origin = opts.origin;
    next();
  };
}
