// The public shape of "@lettr/api/app". The web app hosts the API in the portfolio
// demo and only needs this much; the API's own source is checked by its own package.
import type { IncomingMessage, ServerResponse } from "node:http";

export function createApp(): (req: IncomingMessage, res: ServerResponse) => void;
