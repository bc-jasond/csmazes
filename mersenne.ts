/**
 * This implementation of the Mersenne Twister is a port of the JavaScript
 * version by Y. Okada. The JavaScript version was itself a port of a
 * C implementation, by Takuji Nishimura and Makoto Matsumoto.
 *
 * CoffeeScript port by: Jamis Buck <jamis@jamisbuck.org>
 * License: Public domain, baby. Knock yourself out.
 *
 * The original CoffeeScript sources are always available on GitHub:
 * http://github.com/jamis/csmazes
 */

export class MersenneTwister {
    private N: number = 624;
    private M: number = 397;
    private MATRIX_A: number = 0x9908b0df;
    private UPPER_MASK: number = 0x80000000;
    private LOWER_MASK: number = 0x7fffffff;
  
    private mt: number[] = new Array(this.N);
    private mti: number = 0;
    private seed: number | number[] = 0;
  
    constructor(seed?: number | number[]) {
      this.setSeed(seed);
    }
  
    // makes the argument into an unsigned integer, if it is not already one
    private unsigned32(n1: number): number {
      return n1 < 0 ? (n1 ^ this.UPPER_MASK) + this.UPPER_MASK : n1;
    }
  
    // emulates underflow of subtracting two 32-bit unsigned integers. both arguments
    // must be non-negative 32-bit integers.
    private subtraction32(n1: number, n2: number): number {
      if (n1 < n2) {
        return this.unsigned32((0x100000000 - (n2 - n1)) % 0xffffffff);
      } else {
        return n1 - n2;
      }
    }
  
    // emulates overflow of adding two 32-bit integers. both arguments must be
    // non-negative 32-bit integers.
    private addition32(n1: number, n2: number): number {
      return this.unsigned32((n1 + n2) & 0xffffffff);
    }
  
    // emulates overflow of multiplying two 32-bit integers. both arguments must
    // be non-negative 32-bit integers.
    private multiplication32(n1: number, n2: number): number {
      let sum = 0;
      for (let i = 0; i < 32; i++) {
        if ((n1 >>> i) & 0x1) {
          sum = this.addition32(sum, this.unsigned32(n2 << i));
        }
      }
      return sum;
    }
  
    setSeed(seed?: number | number[]): void {
      if (!seed || typeof seed === "number") {
        this.seedWithInteger(seed);
      } else {
        this.seedWithArray(seed);
      }
    }
  
    private defaultSeed(): number {
      const currentDate = new Date();
      return (
        currentDate.getMinutes() * 60000 +
        currentDate.getSeconds() * 1000 +
        currentDate.getMilliseconds()
      );
    }
  
    private seedWithInteger(seed?: number): void {
      this.seed = seed ?? this.defaultSeed();
      this.mt[0] = this.unsigned32(this.seed & 0xffffffff);
      this.mti = 1;
  
      while (this.mti < this.N) {
        this.mt[this.mti] = this.addition32(
          this.multiplication32(
            1812433253,
            this.unsigned32(this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30))
          ),
          this.mti
        );
        this.mt[this.mti] = this.unsigned32(this.mt[this.mti] & 0xffffffff);
        this.mti++;
      }
    }
  
    private seedWithArray(key: number[]): void {
      this.seedWithInteger(19650218);
  
      let i = 1;
      let j = 0;
      let k = this.N > key.length ? this.N : key.length;
  
      while (k > 0) {
        let _m = this.multiplication32(
          this.unsigned32(this.mt[i - 1] ^ (this.mt[i - 1] >>> 30)),
          1664525
        );
        this.mt[i] = this.addition32(
          this.addition32(this.unsigned32(this.mt[i] ^ _m), key[j]),
          j
        );
        this.mt[i] = this.unsigned32(this.mt[i] & 0xffffffff);
  
        i++;
        j++;
  
        if (i >= this.N) {
          this.mt[0] = this.mt[this.N - 1];
          i = 1;
        }
  
        if (j >= key.length) {
          j = 0;
        }
        k--;
      }
  
      k = this.N - 1;
      while (k > 0) {
        this.mt[i] = this.subtraction32(
          this.unsigned32(
            this.mt[i] ^ this.multiplication32(
              this.unsigned32(this.mt[i - 1] ^ (this.mt[i - 1] >>> 30)),
              1566083941
            )
          ),
          i
        );
        this.mt[i] = this.unsigned32(this.mt[i] & 0xffffffff);
        i++;
        if (i >= this.N) {
          this.mt[0] = this.mt[this.N - 1];
          i = 1;
        }
        k--;
      }
  
      this.mt[0] = 0x80000000;
    }
  
    nextInteger(upper?: number): number {
      if ((upper ?? 1) < 1) {
        return 0;
      }
  
      const mag01 = [0, this.MATRIX_A];
  
      if (this.mti >= this.N) {
        let kk = 0;
  
        while (kk < this.N - this.M) {
          let y = this.unsigned32(
            (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK)
          );
          this.mt[kk] = this.unsigned32(
            this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1]
          );
          kk++;
        }
  
        while (kk < this.N - 1) {
          let y = this.unsigned32(
            (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK)
          );
          this.mt[kk] = this.unsigned32(
            this.mt[kk + this.M - this.N] ^ (y >>> 1) ^ mag01[y & 0x1]
          );
          kk++;
        }
  
        let y = this.unsigned32(
          (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK)
        );
        this.mt[this.N - 1] = this.unsigned32(
          this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1]
        );
        this.mti = 0;
      }
  
      let y = this.mt[this.mti++];
  
      y = this.unsigned32(y ^ (y >>> 11));
      y = this.unsigned32(y ^ ((y << 7) & 0x9d2c5680));
      y = this.unsigned32(y ^ ((y << 15) & 0xefc60000));
  
      return this.unsigned32(y ^ (y >>> 18)) % (upper ?? 0x100000000);
    }
  
    nextFloat(): number {
      return this.nextInteger() / 0xffffffff;
    }
  
    nextBoolean(): boolean {
      return this.nextInteger() % 2 === 0;
    }
  }