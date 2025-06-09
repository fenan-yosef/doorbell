// utils/initMiddleware.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type Middleware<T = any> = (
    req: NextApiRequest,
    res: NextApiResponse<T>,
    next: (result?: Error | T) => void
) => void;

export default function initMiddleware<T = any>(middleware: Middleware<T>) {
    return (req: NextApiRequest, res: NextApiResponse<T>) =>
        new Promise<T>((resolve, reject) => {
            middleware(req, res, (result) => {
                if (result instanceof Error) {
                    return reject(result);
                }
                return resolve(result as T);
            });
        });
}
