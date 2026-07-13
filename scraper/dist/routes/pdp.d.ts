import type { Request, Response } from "express";
import type { SerialQueue } from "../queue/serialQueue.js";
export declare function createPdpHandler(queue: SerialQueue): (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
