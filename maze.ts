import { MersenneTwister } from "./mersenne";

export class Maze {
    width: number;
    height: number;
    grid: Grid;
    rand: any; // You might want to define a type for this
    isWeave: boolean;
    algorithm: Algorithm;
  
    constructor(width: number, height: number, algorithm: any, options: any = {}) {
      this.width = width;
      this.height = height;
      this.grid = new Grid(width, height);
      this.rand = options.rng || new MersenneTwister(options.seed);
      this.isWeave = options.weave ?? false;
  
      if (!this.rand.randomElement) {
        this.rand.randomElement = (list: any[]) => list[this.rand.nextInteger(list.length)];
        this.rand.removeRandomElement = (list: any[]) => {
          const index = this.rand.nextInteger(list.length);
          const [removed] = list.splice(index, 1);
          return removed;
        };
        this.rand.randomizeList = (list: any[]) => {
          for (let i = list.length - 1; i > 0; i--) {
            const j = this.rand.nextInteger(i + 1);
            [list[i], list[j]] = [list[j], list[i]];
          }
          return list;
        };
        this.rand.randomDirections = () => this.rand.randomizeList([...Direction.List]);
      }
  
      this.algorithm = new algorithm(this, options);
    }
  
    onUpdate(fn: Function) {
      return this.algorithm.onUpdate(fn);
    }
  
    onEvent(fn: Function) {
      return this.algorithm.onEvent(fn);
    }
  
    generate() {
      while (this.step()) {}
    }
  
    step() {
      return this.algorithm.step();
    }
  
    isEast(x: number, y: number) {
      return this.grid.isMarked(x, y, Direction.E);
    }
  
    isWest(x: number, y: number) {
      return this.grid.isMarked(x, y, Direction.W);
    }
  
    isNorth(x: number, y: number) {
      return this.grid.isMarked(x, y, Direction.N);
    }
  
    isSouth(x: number, y: number) {
      return this.grid.isMarked(x, y, Direction.S);
    }
  
    isUnder(x: number, y: number) {
      return this.grid.isMarked(x, y, Direction.U);
    }
  
    isValid(x: number, y: number) {
      return 0 <= x && x < this.width && 0 <= y && y < this.height;
    }
  
    carve(x: number, y: number, dir: number) {
      this.grid.mark(x, y, dir);
    }
  
    uncarve(x: number, y: number, dir: number) {
      this.grid.clear(x, y, dir);
    }
  
    isSet(x: number, y: number, dir: number) {
      return this.grid.isMarked(x, y, dir);
    }
  
    isBlank(x: number, y: number) {
      return this.grid.at(x, y) === 0;
    }
  
    isPerpendicular(x: number, y: number, dir: number) {
      return (this.grid.at(x, y) & Direction.Mask) === Direction.cross[dir];
    }
  }
  
    export const Algorithms = {};
  
    export abstract class Algorithm {
      maze: Maze;
      rand: any; // You might want to define a type for this
      updateCallback: Function;
      eventCallback: Function;
  
      constructor(maze: Maze, options: any = {}) {
        this.maze = maze;
        this.updateCallback = (maze: Maze, x: number, y: number) => {};
        this.eventCallback = (maze: Maze, x: number, y: number) => {};
        this.rand = this.maze.rand;
      }

      abstract step(): boolean;
  
      onUpdate(fn: Function) {
        this.updateCallback = fn;
      }
  
      onEvent(fn: Function) {
        this.eventCallback = fn;
      }
  
      updateAt(x: number, y: number) {
        this.updateCallback(this.maze, parseInt(x.toString()), parseInt(y.toString()));
      }
  
      eventAt(x: number, y: number) {
        this.eventCallback(this.maze, parseInt(x.toString()), parseInt(y.toString()));
      }
  
      canWeave(dir: number, thruX: number, thruY: number) {
        if (this.maze.isWeave && this.maze.isPerpendicular(thruX, thruY, dir)) {
          const nx = thruX + Direction.dx[dir];
          const ny = thruY + Direction.dy[dir];
          return this.maze.isValid(nx, ny) && this.maze.isBlank(nx, ny);
        }
        return false;
      }
  
      performThruWeave(thruX: number, thruY: number) {
        if (this.rand.nextBoolean()) {
          this.maze.carve(thruX, thruY, Direction.U);
        } else if (this.maze.isNorth(thruX, thruY)) {
          this.maze.uncarve(thruX, thruY, Direction.N | Direction.S);
          this.maze.carve(thruX, thruY, Direction.E | Direction.W | Direction.U);
        } else {
          this.maze.uncarve(thruX, thruY, Direction.E | Direction.W);
          this.maze.carve(thruX, thruY, Direction.N | Direction.S | Direction.U);
        }
      }
  
      performWeave(dir: number, fromX: number, fromY: number, callback?: Function) {
        const thruX = fromX + Direction.dx[dir];
        const thruY = fromY + Direction.dy[dir];
        const toX = thruX + Direction.dx[dir];
        const toY = thruY + Direction.dy[dir];
  
        this.maze.carve(fromX, fromY, dir);
        this.maze.carve(toX, toY, Direction.opposite[dir]);
  
        this.performThruWeave(thruX, thruY);
  
        if (callback) {
          callback(toX, toY);
        }
  
        this.updateAt(fromX, fromY);
        this.updateAt(thruX, thruY);
        this.updateAt(toX, toY);
      }
    }
  
    export class Grid {
      width: number;
      height: number;
      data: number[][];
  
      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.data = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
      }
  
      at(x: number, y: number) {
        return this.data[y][x];
      }
  
      mark(x: number, y: number, bits: number) {
        this.data[y][x] |= bits;
      }
  
      clear(x: number, y: number, bits: number) {
        this.data[y][x] &= ~bits;
      }
  
      isMarked(x: number, y: number, bits: number) {
        return (this.data[y][x] & bits) === bits;
      }
    }
  
    export class Direction {
      static N = 0x01
      static S = 0x02
      static E = 0x04
      static W = 0x08
      static U = 0x10
      static Mask = 0x1F
      static List = [1, 2, 4, 8]
      static dx: Record<number,number> = { 1: 0, 2: 0, 4: 1, 8: -1 };
      static dy: Record<number,number> = { 1: -1, 2: 1, 4: 0, 8: 0 };
      static opposite: Record<number,number> = { 1: 2, 2: 1, 4: 8, 8: 4 };
      static cross: Record<number,number> = { 1: 12, 2: 12, 4: 3, 8: 3 };
    }