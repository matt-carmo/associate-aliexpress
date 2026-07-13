type Job<T> = () => Promise<T>;
export interface SerialQueue {
    enqueue<T>(fn: Job<T>, timeoutMs: number): Promise<T>;
    getDepth(): number;
}
export declare function createSerialQueue(maxDepth: number): SerialQueue;
export {};
