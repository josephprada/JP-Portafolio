/**
 * Watches frame times and says when the canvas should draw fewer pixels.
 *
 * A dense screen can ask for more pixels than a modest GPU fills in a frame.
 * Over a window of two seconds, if most frames miss 45 fps the page is told
 * to step its resolution down; frames spent making tiles do not count, nor
 * does the window after a step, while the new resolution settles.
 */
const WINDOW = 2;
const SLOW = 1 / 45;
const SHARE = 0.5;

export class FrameBudget {
  private time = 0;
  private slow = 0;
  private frames = 0;
  private grace = 0;

  /** Count a frame; true when the page should draw fewer pixels. */
  push(dt: number, busy: boolean): boolean {
    if (busy || dt <= 0) return false;
    if (this.grace > 0) {
      this.grace -= dt;
      return false;
    }
    this.time += dt;
    this.frames++;
    if (dt > SLOW) this.slow++;
    if (this.time < WINDOW) return false;
    const lower = this.slow / this.frames > SHARE;
    this.time = 0;
    this.slow = 0;
    this.frames = 0;
    if (lower) this.grace = WINDOW;
    return lower;
  }
}
