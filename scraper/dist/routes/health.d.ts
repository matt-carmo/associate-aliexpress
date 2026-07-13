import type { Request, Response } from "express";
import type { SerialQueue } from "../queue/serialQueue.js";
export declare function createHealthHandler(queue: SerialQueue): (_req: Request, res: Response) => void;
