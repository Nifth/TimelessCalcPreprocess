// Random/RandomNumberGenerator.ts
import { PassiveSkill, PassiveSkillNode } from '../Data/Models/PassiveSkill';
import { TimelessJewel } from '../Game/TimelessJewel';

export class RandomNumberGenerator {
  private static readonly INITIAL_STATE_CONSTANT_0 = 0x40336050;
  private static readonly INITIAL_STATE_CONSTANT_1 = 0xCFA3723C;
  private static readonly INITIAL_STATE_CONSTANT_2 = 0x3CAC5F6F;
  private static readonly INITIAL_STATE_CONSTANT_3 = 0x3793FDFF;

  private state: Uint32Array;

  constructor(passiveSkill: PassiveSkillNode, timelessJewel: TimelessJewel) {
    if (!timelessJewel) throw new Error('timelessJewel is required');

    this.state = new Uint32Array(5);
    this.initialize([passiveSkill.GraphIdentifier, timelessJewel.Seed]);
  }

  // --- Public API ---
  public generate(exclusiveMaximumValue: number): number {
    this.logStep('Before generate');
   if (exclusiveMaximumValue <= 0) return 0;
    const max = exclusiveMaximumValue - 1;
    let roundState = 0;
    let value = 0;

    do {
      do {
        value = (this.generateUInt() | (2 * (value << 31))) >>> 0;
        roundState = (0xFFFFFFFF | (2 * (roundState << 31))) >>> 0;
      } while (roundState < max);
    } while (
      (Math.floor(value / exclusiveMaximumValue) >= roundState) &&
      ((roundState % exclusiveMaximumValue) !== max)
    );
    this.logStep('After generate');
    return value % exclusiveMaximumValue;
  }

  public generateRange(min: number, max: number): number {
    let a = min + 0x80000000 >>> 0;
    let b = max + 0x80000000 >>> 0;
    if (min >= 0x80000000) a = (min + 0x80000000) >>> 0;
    if (max >= 0x80000000) b = (max + 0x80000000) >>> 0;

    const roll = this.generate((b - a + 1) >>> 0);
    return ((roll + a + 0x80000000) >>> 0);  // ← + 0x80000000 comme C#
  }

  // --- Private ---
  private static manipulateAlpha(value: number): number {
    return ((value ^ (value >> 27)) * 0x19660D) >>> 0;
  }

  private static manipulateBravo(value: number): number {
    return ((value ^ (value >> 27)) * 0x5D588B65) >>> 0;
  }

  private initialize(seeds: number[]): void {
    this.state[0] = 0;
    this.state[1] = RandomNumberGenerator.INITIAL_STATE_CONSTANT_0;
    this.state[2] = RandomNumberGenerator.INITIAL_STATE_CONSTANT_1;
    this.state[3] = RandomNumberGenerator.INITIAL_STATE_CONSTANT_2;
    this.state[4] = RandomNumberGenerator.INITIAL_STATE_CONSTANT_3;

    let index = 1;
    for (let i = 0; i < seeds.length; i++) {
      const roundState = RandomNumberGenerator.manipulateAlpha(
        this.state[(index % 4) + 1] ^
        this.state[((index + 1) % 4) + 1] ^
        this.state[(((index + 4) - 1) % 4) + 1]
      ) >>> 0;

      this.state[((index + 1) % 4) + 1] = (this.state[((index + 1) % 4) + 1] + roundState) >>> 0;
      const temp = (roundState + seeds[i] + index) >>> 0;
      this.state[(((index + 1) + 1) % 4) + 1] = (this.state[(((index + 1) + 1) % 4) + 1] + temp) >>> 0;
      this.state[(index % 4) + 1] = temp;
      index = (index + 1) % 4;
    }

    for (let i = 0; i < 5; i++) {
      const roundState = RandomNumberGenerator.manipulateAlpha(
        this.state[(index % 4) + 1] ^
        this.state[((index + 1) % 4) + 1] ^
        this.state[(((index + 4) - 1) % 4) + 1]
      ) >>> 0;

      this.state[((index + 1) % 4) + 1] = (this.state[((index + 1) % 4) + 1] + roundState) >>> 0;
      const temp = (roundState + index) >>> 0;
      this.state[(((index + 1) + 1) % 4) + 1] = (this.state[(((index + 1) + 1) % 4) + 1] + temp) >>> 0;
      this.state[(index % 4) + 1] = temp;
      index = (index + 1) % 4;
    }

    for (let i = 0; i < 4; i++) {
      const roundState = RandomNumberGenerator.manipulateBravo(
        this.state[(index % 4) + 1] +
        this.state[((index + 1) % 4) + 1] +
        this.state[(((index + 4) - 1) % 4) + 1]
      ) >>> 0;

      this.state[((index + 1) % 4) + 1] ^= roundState;
      const temp = (roundState - index) >>> 0;
      this.state[(((index + 1) + 1) % 4) + 1] ^= temp;
      this.state[(index % 4) + 1] = temp;
      index = (index + 1) % 4;
    }

    for (let i = 0; i < 8; i++) {
      this.generateNextState();
    }
  }

  private generateNextState(): void {
    let a = this.state[4];
    let b = ((this.state[1] & 0x7FFFFFFF) ^ this.state[2]) ^ this.state[3];

    a ^= (a << 1) >>> 0;
    b ^= ((b >>> 1) ^ a) >>> 0;

    this.state[1] = this.state[2];
    this.state[2] = this.state[3];
    this.state[3] = (a ^ (b << 10)) >>> 0;
    this.state[4] = b;

    const mask1 = (b & 1) ? 0x8F7011EE : 0;
    const mask2 = (b & 1) ? 0xFC78FF1F : 0;

    this.state[2] ^= mask1;
    this.state[3] ^= mask2;

    this.state[0] = (this.state[0] + 1) >>> 0;
  }

  private temper(): number {
    let a = this.state[4];
    let b = (this.state[1] + (this.state[3] >>> 8)) >>> 0;
    a ^= b;
    if ((b & 1) !== 0) {
      a ^= 0x3793FDFF;
    }
    return a;
  }

  private generateUInt(): number {
    this.generateNextState();
    return this.temper();
  }

  // --- DEBUG ---
  public debugState(): string {
    return `[${this.state[0].toString(16)}, ${this.state[1].toString(16)}, ${this.state[2].toString(16)}, ${this.state[3].toString(16)}, ${this.state[4].toString(16)}]`;
  }
  private logStep(msg: string) {
    console.log(msg, this.debugState());
  }
}