// The Gilded Hour — the two jobs: their floors, loot, patrols and cameras.
// Map legend: # wall   = vault wall   . hard floor   , carpet   ~ street
//             D desk   P pillar       S display case (all three are cover)
//             V vault door (locked; hold F beside it to pick it open)
//             G gold   J jewel        A artwork      C cash    (loot)
//             E the getaway van      @ the thief's way in

export const JOBS = [
  {
    name: 'Job One — The Meridian Bank',
    sub: 'Night deposit. Crack the vault, fill the bag, be gone.',
    quota: 9000,
    theme: 'bank',
    rows: [
      '################################',
      '#.........#==========#.........#',
      '#..C..D...#=..G..G..=#...D..C..#',
      '#.........#=........=#.........#',
      '#..D......#=..G..A..=#......D..#',
      '#.........#=........=#.........#',
      '#####.#####====V=====#####.#####',
      '#..............................#',
      '#..P......................P....#',
      '#..............................#',
      '#.......#................#.....#',
      '#..C....#.,,,,,,,,,,,,,,.#..J..#',
      '#.......#.,..D......D..,.#.....#',
      '#..............................#',
      '#..J....#.,..D......D..,.#..C..#',
      '#.......#.,,,,,,,,,,,,,,.#.....#',
      '##############....##############',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~EEEEE~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    thief: { tx: 15, ty: 17 },
    guards: [
      { waypoints: [[8, 14], [23, 14], [23, 11], [8, 11]], pause: 1.4 },
      { waypoints: [[4, 8], [27, 8]], pause: 1.0 },
      { waypoints: [[12, 7], [19, 7]], pause: 2.2 },
    ],
    cameras: [
      { tx: 1, ty: 9, base: 0.5, sweep: 0.75, speed: 0.45, phase: 0 },
      { tx: 30, ty: 9, base: Math.PI - 0.5, sweep: 0.75, speed: 0.45, phase: 2.4 },
      { tx: 21, ty: 6, base: Math.PI * 0.82, sweep: 0.6, speed: 0.35, phase: 1.1 },
    ],
    // A laser across the vault's waist: the gold above it is timed, not free.
    lasers: [
      { from: [11, 3], to: [20, 3], phase: 0 },
    ],
  },
  {
    name: 'Job Two — The Aurelia Gallery',
    sub: 'Opening night was yesterday. The strongroom is still full.',
    quota: 19000,
    theme: 'gallery',
    rows: [
      '################################',
      '#..........#========#..........#',
      '#..A....S..#=..G...=#..S....A..#',
      '#..........#=......=#..........#',
      '#..S....S..#=..G.A.=#..S....S..#',
      '#####.######====V====######.####',
      '#..............................#',
      '#..P......P..........P......P..#',
      '#..............................#',
      '#....S....S....S....S....S.....#',
      '#....J....J....J....J....J.....#',
      '#..............................#',
      '#..P......P..........P......P..#',
      '#..............................#',
      '#....S....S....S....S....S.....#',
      '#....J....C....J....C....J.....#',
      '##############....##############',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~EEEEE~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    thief: { tx: 15, ty: 17 },
    guards: [
      { waypoints: [[6, 13], [25, 13], [25, 8], [6, 8]], pause: 1.2 },
      { waypoints: [[3, 6], [28, 6]], pause: 0.8 },
      { waypoints: [[13, 6], [18, 6]], pause: 2.4 },
      { waypoints: [[6, 15], [25, 15]], pause: 1.6 },
    ],
    cameras: [
      { tx: 1, ty: 5, base: 0.45, sweep: 0.8, speed: 0.5, phase: 0.6 },
      { tx: 30, ty: 5, base: Math.PI - 0.45, sweep: 0.8, speed: 0.5, phase: 3.4 },
      { tx: 16, ty: 16, base: -Math.PI / 2, sweep: 0.9, speed: 0.4, phase: 1.8 },
    ],
    // The strongroom's laser, blinking out of step with the bank's.
    lasers: [
      { from: [12, 3], to: [19, 3], phase: 1.3 },
    ],
  },
];
