type QueueTask = () => Promise<void>;

class VaultWriteQueue {
  private chain: Promise<void> = Promise.resolve();

  enqueue(task: QueueTask): Promise<void> {
    this.chain = this.chain.then(task).catch((error) => {
      this.chain = Promise.resolve();
      throw error;
    });

    return this.chain;
  }
}

export const vaultWriteQueue = new VaultWriteQueue();
