// TinyMT32 modified POE
export class PoeTinyMT32 {
  private state = new Uint32Array(4); // Internal state modified (128 bits)
  private mat1 = 0x8f7011ee;
  private mat2 = 0xfc78ff1f;
  private tmat = 0x3793fdff;

  constructor(seed: Uint32Array) { // seed = [graph_id u32, jewel_seed u16 padded]
    this.state[0] = seed[0];
    this.state[1] = seed[1];
    this.state[2] = this.state[3] = 0;
    this.nextState(); // Init
  }

  nextState() {
    let t0 = this.state[0];
    let t1 = this.state[1];
    let t2 = this.state[2];
    let t3 = this.state[3];
    t2 ^= t0 << this.mat1;
    t3 ^= t1 >>> this.mat2; // POE modification
    t1 ^= t2 >>> this.mat2;
    t0 ^= t3 << this.mat1; // POE modification
    this.state[0] = t3;
    this.state[1] = t2;
    this.state[2] = t1;
    this.state[3] = t0;
  }

  rand32(): number { // u32 [0, 2^32-1]
    this.nextState();
    let t = (this.state[3] >>> 9) ^ this.state[0] ^ this.tmat;
    return (t >>> 1) ^ (this.state[0] >>> 32); // POE modification on output
  }

  randRange(min: number, max: number): number {
    return Math.floor((this.rand32() / 0x100000000) * (max - min + 1)) + min;
  }

  randPercent(): number { // [0, 100)
    return (this.rand32() / 0x100000000) * 100;
  }
}