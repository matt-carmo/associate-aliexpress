type Job<T> = () => Promise<T>;

export interface SerialQueue {
  enqueue<T>(fn: Job<T>, timeoutMs: number): Promise<T>;
  getDepth(): number;
}

export function createSerialQueue(maxDepth: number): SerialQueue {
  let chain: Promise<unknown> = Promise.resolve();
  let depth = 0;

  return {
    enqueue<T>(fn: Job<T>, timeoutMs: number): Promise<T> {
      if (depth >= maxDepth) {
        return Promise.reject(Object.assign(new Error("Queue full"), { code: "queue_full" }));
      }
      depth++;
      const result = new Promise<T>((resolve, reject) => {
        chain = chain
          .then(() => {
            const timer = setTimeout(() => {
              reject(Object.assign(new Error("Job timed out"), { code: "timeout" }));
            }, timeoutMs);
            return fn()
              .then((val) => { clearTimeout(timer); resolve(val); })
              .catch((err) => { clearTimeout(timer); reject(err); })
              .finally(() => { depth--; });
          })
          .catch(() => { depth--; });
      });
      return result;
    },
    getDepth(): number {
      return depth;
    },
  };
}
