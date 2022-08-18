export class Waiter {
  private timeout: any
  private constructor(private maxTimeoutMs?: number) {
    if (maxTimeoutMs) {
      this.timeout = setTimeout(() => {
        throw new Error(`Timed out after ${maxTimeoutMs} ms.`)
      }, maxTimeoutMs)
    } else {
      this.timeout = this.waitLoop()
    }
  }
  private waitLoop() {
    return setTimeout(() => {
      this.timeout = this.waitLoop()
    }, 100 * 1000)
  }
  static create(maxTimeoutMs?: number): Waiter {
    return new Waiter(maxTimeoutMs)
  }
  okToQuit() {
    clearTimeout(this.timeout)
  }
}
