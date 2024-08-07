/**
 * Author: Jamis Buck <jamis@jamisbuck.org>
 * License: Public domain, baby. Knock yourself out.
 *
 * The original CoffeeScript sources are always available on GitHub:
 * http://github.com/jamis/csmazes
 */


  
  class MazeWidget {
    private mazeStepInterval: number | null = null;
    private quickStep: boolean = false;
  
    static createWidget(algorithm: string, width: number, height: number, options: MazeOptions = {}): void {
      const updateWalls = (maze: any, x: number, y: number, classes: string[]): void => {
        if (maze.isEast(x, y)) classes.push("e");
        if (maze.isWest(x, y)) classes.push("w");
        if (maze.isSouth(x, y)) classes.push("s");
        if (maze.isNorth(x, y)) classes.push("n");
        if (maze.isUnder(x, y)) classes.push("u");
      };
  
      const ACTIONS: any = {
        AldousBroder: (maze: any, x: number, y: number, classes: string[]): void => {
          if (maze.algorithm.isCurrent(x, y)) {
            classes.push("cursor");
          } else if (!maze.isBlank(x, y)) {
            classes.push("in");
            updateWalls(maze, x, y, classes);
          }
        },
  
        GrowingTree: (maze: any, x: number, y: number, classes: string[]): void => {
          if (!maze.isBlank(x, y)) {
            if (maze.algorithm.inQueue(x, y)) {
              classes.push("f");
            } else {
              classes.push("in");
            }
            updateWalls(maze, x, y, classes);
          }
        },
  
        GrowingBinaryTree: (maze: any, x: number, y: number, classes: string[]): void => {
          ACTIONS.GrowingTree(maze, x, y, classes);
        },
  
        HuntAndKill: (maze: any, x: number, y: number, classes: string[]): void => {
          if (maze.algorithm.isCurrent(x, y)) {
            classes.push("cursor");
          }
          if (!maze.isBlank(x, y)) {
            classes.push("in");
            updateWalls(maze, x, y, classes);
          }
        },
  
        Prim: (maze: any, x: number, y: number, classes: string[]): void => {
          if (maze.algorithm.isFrontier(x, y)) {
            classes.push("f");
          } else if (maze.algorithm.isInside(x, y)) {
            classes.push("in");
            updateWalls(maze, x, y, classes);
          }
        },
  
        RecursiveBacktracker: (maze: any, x: number, y: number, classes: string[]): void => {
          if (maze.algorithm.isStack(x, y)) {
            classes.push("f");
          } else {
            classes.push("in");
          }
          updateWalls(maze, x, y, classes);
        },
  
        RecursiveDivision: (maze: any, x: number, y: number, classes: string[]): void => {
          updateWalls(maze, x, y, classes);
        },
  
        Wilson: (maze: any, x: number, y: number, classes: string[]): void => {
          if (maze.algorithm.isCurrent(x, y)) {
            classes.push("cursor");
            updateWalls(maze, x, y, classes);
          } else if (!maze.isBlank(x, y)) {
            classes.push("in");
            updateWalls(maze, x, y, classes);
          } else if (maze.algorithm.isVisited(x, y)) {
            classes.push("f");
          }
        },
  
        Houston: (maze: any, x: number, y: number, classes: string[]): void => {
          if (maze.algorithm.worker?.isVisited) {
            ACTIONS.Wilson(maze, x, y, classes);
          } else {
            ACTIONS.AldousBroder(maze, x, y, classes);
          }
        },
  
        default: (maze: any, x: number, y: number, classes: string[]): void => {
          if (!maze.isBlank(x, y)) {
            classes.push("in");
            updateWalls(maze, x, y, classes);
          }
        }
      };
  
      const updateCallback = (maze: any, x: number, y: number): void => {
        const classes: string[] = [];
        (ACTIONS[algorithm] || ACTIONS.default)(maze, x, y, classes);
        const cell = document.getElementById(`${maze.element.id}_y${y}x${x}`);
        if (cell) cell.className = classes.join(" ");
      };
  
      const eventCallback = (maze: any, x: number, y: number): void => {
        if (maze.element.quickStep) maze.element.mazePause();
      };
  
      const id = options.id || algorithm.toLowerCase();
      options.interval = options.interval ?? 50;
  
      let mazeClass = "maze";
      if (options.class) mazeClass += ` ${options.class}`;
  
      let gridClass = "grid";
      if (options.wallwise) gridClass += " invert";
      if (options.padded) gridClass += " padded";
  
      const watch = options.watch !== false ? `<a id='${id}_watch' href='#' onclick='document.getElementById("${id}").mazeQuickStep(); return false;'>Watch</a>` : "";
  
      const html = `
        <div id="${id}" class="${mazeClass}">
          <div id="${id}_grid" class="${gridClass}"></div>
          <div class="operations">
            <a id="${id}_reset" href="#" onclick="document.getElementById('${id}').mazeReset(); return false;">Reset</a>
            <a id="${id}_step" href="#" onclick="document.getElementById('${id}').mazeStep(); return false;">Step</a>
            ${watch}
            <a id="${id}_run" href="#" onclick="document.getElementById('${id}').mazeRun(); return false;">Run</a>
          </div>
        </div>
      `;
  
      document.write(html);
      const element = document.getElementById(id);
  
      element.addClassName = (el: HTMLElement, name: string): void => {
        const classNames = el.className.split(" ");
        if (!classNames.includes(name)) {
          el.className += ` ${name}`;
        }
      };
  
      element.removeClassName = (el: HTMLElement, name: string): void => {
        if (el.className.length > 0) {
          const classNames = el.className.split(" ").filter(className => className !== name);
          el.className = classNames.join(" ");
        }
      };
  
      element.mazePause = (): boolean => {
        if (this.mazeStepInterval) {
          clearInterval(this.mazeStepInterval);
          this.mazeStepInterval = null;
          this.quickStep = false;
          return true;
        }
        return false;
      };
  
      element.mazeRun = (): void => {
        if (!element.mazePause()) {
          this.mazeStepInterval = setInterval(() => element.mazeStep(), options.interval);
        }
      };
  
      element.mazeStep = (): void => {
        if (!element.maze.step()) {
          element.mazePause();
          element.addClassName(document.getElementById(`${id}_step`), "disabled");
          if (options.watch !== false) element.addClassName(document.getElementById(`${id}_watch`), "disabled");
          element.addClassName(document.getElementById(`${id}_run`), "disabled");
        }
      };
  
      element.mazeQuickStep = (): void => {
        this.quickStep = true;
        element.mazeRun();
      };
  
      element.mazeReset = (): void => {
        element.mazePause();
  
        const value = typeof options.input === "function" ? options.input() : options.input;
  
        element.maze = new Maze(width, height, Maze.Algorithms[algorithm], {
          seed: options.seed,
          rng: options.rng,
          input: value,
          weave: options.weave,
          weaveMode: options.weaveMode,
          weaveDensity: options.weaveDensity
        });
  
        element.maze.element = element;
        element.maze.onUpdate(updateCallback);
        element.maze.onEvent(eventCallback);
  
        let grid = "";
        for (let y = 0; y < element.maze.height; y++) {
          const row_id = `${id}_y${y}`;
          grid += `<div class='row' id='${row_id}'>`;
          for (let x = 0; x < element.maze.width; x++) {
            grid += `<div id='${row_id}x${x}'>`;
            if (options.padded) {
              grid += "<div class='np'></div>";
              grid += "<div class='wp'></div>";
              grid += "<div class='ep'></div>";
              grid += "<div class='sp'></div>";
              grid += "<div class='c'></div>";
            }
            grid += "</div>";
          }
          grid += "</div>";
        }
  
        const gridElement = document.getElementById(`${id}_grid`);
        if (gridElement) gridElement.innerHTML = grid;
  
        element.removeClassName(document.getElementById(`${id}_step`), "disabled");
        if (options.watch !== false) element.removeClassName(document.getElementById(`${id}_watch`), "disabled");
        element.removeClassName(document.getElementById(`${id}_run`), "disabled");
      };
  
      element.mazeReset();
    }
  
    static createCanvasWidget(algorithm: string, width: number, height: number, options: MazeOptions = {}): void {
      const styles = options.styles || {};
      styles.blank = styles.blank || "#ccc";
      styles.f = styles.f || "#faa";
      styles.a = styles.a || "#faa";
      styles.b = styles.b || "#afa";
      styles.in = styles.in || "#fff";
      styles.cursor = styles.cursor || "#7f7";
      styles.wall = styles.wall || "#000";
  
      const COLORS: any = {
        AldousBroder: (maze: any, x: number, y: number): string => {
          if (maze.algorithm.isCurrent(x, y)) return styles.cursor;
          if (!maze.isBlank(x, y)) return styles.in;
          return "";
        },
  
        GrowingTree: (maze: any, x: number, y: number): string => {
          if (!maze.isBlank(x, y)) {
            if (maze.algorithm.inQueue(x, y)) return styles.f;
            return styles.in;
          }
          return "";
        },
  
        GrowingBinaryTree: (maze: any, x: number, y: number): string => {
          return COLORS.GrowingTree(maze, x, y);
        },
  
        HuntAndKill: (maze: any, x: number, y: number): string => {
          if (maze.algorithm.isCurrent(x, y)) return styles.cursor;
          if (!maze.isBlank(x, y)) return styles.in;
          return "";
        },
  
        Prim: (maze: any, x: number, y: number): string => {
          if (maze.algorithm.isFrontier(x, y)) return styles.f;
          if (maze.algorithm.isInside(x, y)) return styles.in;
          return "";
        },
  
        RecursiveBacktracker: (maze: any, x: number, y: number): string => {
          if (maze.algorithm.isStack(x, y)) return styles.f;
          if (!maze.isBlank(x, y)) return styles.in;
          return "";
        },
  
        ParallelBacktracker: (maze: any, x: number, y: number): string => {
          const cell = maze.algorithm.cellAt(x, y);
          if (maze.algorithm.isStack(x, y)) return styles.sets?.[`stack-${cell.set}`] || styles.f;
          if (!maze.isBlank(x, y)) return styles.sets?.[cell.set] || "#fff";
          return "";
        },
  
        RecursiveDivision: (maze: any, x: number, y: number): string => {
          return "";
        },
  
        Wilson: (maze: any, x: number, y: number): string => {
          if (maze.algorithm.isCurrent(x, y)) return styles.cursor;
          if (!maze.isBlank(x, y)) return styles.in;
          if (maze.algorithm.isVisited(x, y)) return styles.f;
          return "";
        },
  
        Houston: (maze: any, x: number, y: number): string => {
          if (maze.algorithm.worker?.isVisited) {
            return COLORS.Wilson(maze, x, y);
          } else {
            return COLORS.AldousBroder(maze, x, y);
          }
        },
  
        BlobbyDivision: (maze: any, x: number, y: number): string => {
          switch (maze.algorithm.stateAt(x, y)) {
            case "blank":
              return styles.blank;
            case "in":
              return styles.in;
            case "active":
              return styles.f;
            case "a":
              return styles.a;
            case "b":
              return styles.b;
            default:
              return "";
          }
        },
  
        default: (maze: any, x: number, y: number): string => {
          if (!maze.isBlank(x, y)) return styles.in;
          return "";
        }
      };
  
      const drawLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void => {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      };
  
      const drawCell = (maze: any, x: number, y: number): void => {
        const px = x * maze.cellWidth;
        const py = y * maze.cellHeight;
  
        const wmpx = x === 0 ? px + 0.5 : px - 0.5;
        const nmpy = y === 0 ? py + 0.5 : py - 0.5;
        const empx = px - 0.5;
        const smpy = py - 0.5;
  
        const colors = COLORS[algorithm] || COLORS.default;
        let color = colors(maze, x, y);
        if (!color) color = options.wallwise ? styles.in : styles.blank;
  
        maze.context.fillStyle = color;
        maze.context.fillRect(px, py, maze.cellWidth, maze.cellHeight);
  
        maze.context.beginPath();
  
        if (maze.isWest(x, y) === options.wallwise) drawLine(maze.context, wmpx, py, wmpx, py + maze.cellHeight);
        if (maze.isEast(x, y) === options.wallwise) drawLine(maze.context, empx + maze.cellWidth, py, empx + maze.cellWidth, py + maze.cellHeight);
        if (maze.isNorth(x, y) === options.wallwise) drawLine(maze.context, px, nmpy, px + maze.cellWidth, nmpy);
        if (maze.isSouth(x, y) === options.wallwise) drawLine(maze.context, px, smpy + maze.cellHeight, px + maze.cellWidth, smpy + maze.cellHeight);
  
        maze.context.closePath();
        maze.context.stroke();
      };
  
      const drawCellPadded = (maze: any, x: number, y: number): void => {
        const px1 = x * maze.cellWidth;
        const px2 = px1 + maze.insetWidth - 0.5;
        const px4 = px1 + maze.cellWidth - 0.5;
        const px3 = px4 - maze.insetWidth;
  
        const py1 = y * maze.cellHeight;
        const py2 = py1 + maze.insetHeight - 0.5;
        const py4 = py1 + maze.cellHeight - 0.5;
        const py3 = py4 - maze.insetHeight;
  
        const adjustedPx1 = x === 0 ? px1 + 0.5 : px1 - 0.5;
        const adjustedPy1 = y === 0 ? py1 + 0.5 : py1 - 0.5;
  
        const colors = COLORS[algorithm] || COLORS.default;
        let color = colors(maze, x, y);
        if (!color) color = options.wallwise ? styles.in : styles.blank;
  
        maze.context.fillStyle = color;
        maze.context.fillRect(px2 - 0.5, py2 - 0.5, px3 - px2 + 1, py3 - py2 + 1);
  
        maze.context.beginPath();
  
        if (maze.isWest(x, y) || maze.isUnder(x, y)) {
          maze.context.fillRect(adjustedPx1 - 0.5, py2 - 0.5, px2 - adjustedPx1 + 1, py3 - py2 + 1);
          drawLine(maze.context, adjustedPx1 - 1, py2, px2, py2);
          drawLine(maze.context, adjustedPx1 - 1, py3, px2, py3);
        }
        if (!maze.isWest(x, y)) drawLine(maze.context, px2, py2, px2, py3);
  
        if (maze.isEast(x, y) || maze.isUnder(x, y)) {
          maze.context.fillRect(px3 - 0.5, py2 - 0.5, px4 - px3 + 1, py3 - py2 + 1);
          drawLine(maze.context, px3, py2, px4 + 1, py2);
          drawLine(maze.context, px3, py3, px4 + 1, py3);
        }
        if (!maze.isEast(x, y)) drawLine(maze.context, px3, py2, px3, py3);
  
        if (maze.isNorth(x, y) || maze.isUnder(x, y)) {
          maze.context.fillRect(px2 - 0.5, adjustedPy1 - 0.5, px3 - px2 + 1, py2 - adjustedPy1 + 1);
          drawLine(maze.context, px2, adjustedPy1 - 1, px2, py2);
          drawLine(maze.context, px3, adjustedPy1 - 1, px3, py2);
        }
        if (!maze.isNorth(x, y)) drawLine(maze.context, px2, py2, px3, py2);
  
        if (maze.isSouth(x, y) || maze.isUnder(x, y)) {
          maze.context.fillRect(px2 - 0.5, py3 - 0.5, px3 - px2 + 1, py4 - py3 + 1);
          drawLine(maze.context, px2, py3, px2, py4 + 1);
          drawLine(maze.context, px3, py3, px3, py4 + 1);
        }
        if (!maze.isSouth(x, y)) drawLine(maze.context, px2, py3, px3, py3);
  
        maze.context.closePath();
        maze.context.stroke();
      };
  
      const drawMaze = (maze: any): void => {
        for (let row = 0; row < maze.height; row++) {
          for (let col = 0; col < maze.width; col++) {
            if (options.padded) {
              drawCellPadded(maze, col, row);
            } else {
              drawCell(maze, col, row);
            }
          }
        }
      };
  
      const updateCallback = (maze: any, x: number, y: number): void => {
        if (options.padded) {
          drawCellPadded(maze, x, y);
        } else {
          drawCell(maze, x, y);
        }
      };
  
      const eventCallback = (maze: any, x: number, y: number): void => {
        if (maze.element.quickStep) maze.element.mazePause();
      };
  
      const id = options.id || algorithm.toLowerCase();
      options.interval = options.interval ?? 50;
  
      let mazeClass = "maze";
      if (options.class) mazeClass += ` ${options.class}`;
  
      let gridClass = "grid";
      if (options.wallwise) gridClass += " invert";
      if (options.padded) gridClass += " padded";
  
      const watch = options.watch !== false ? `<a id='${id}_watch' href='#' onclick='document.getElementById("${id}").mazeQuickStep(); return false;'>Watch</a>` : "";
  
      const html = `
        <div id="${id}" class="${mazeClass}">
          <canvas id="${id}_canvas" width="210" height="210" class="${gridClass}"></canvas>
          <div class="operations">
            <a id="${id}_reset" href="#" onclick="document.getElementById('${id}').mazeReset(); return false;">Reset</a>
            <a id="${id}_step" href="#" onclick="document.getElementById('${id}').mazeStep(); return false;">Step</a>
            ${watch}
            <a id="${id}_run" href="#" onclick="document.getElementById('${id}').mazeRun(); return false;">Run</a>
          </div>
        </div>
      `;
  
      document.write(html);
      const element = document.getElementById(id);
  
      element.addClassName = (el: HTMLElement, name: string): void => {
        const classNames = el.className.split(" ");
        if (!classNames.includes(name)) {
          el.className += ` ${name}`;
        }
      };
  
      element.removeClassName = (el: HTMLElement, name: string): void => {
        if (el.className.length > 0) {
          const classNames = el.className.split(" ").filter(className => className !== name);
          el.className = classNames.join(" ");
        }
      };
  
      element.mazePause = (): boolean => {
        if (this.mazeStepInterval) {
          clearInterval(this.mazeStepInterval);
          this.mazeStepInterval = null;
          this.quickStep = false;
          return true;
        }
        return false;
      };
  
      element.mazeRun = (): void => {
        if (!element.mazePause()) {
          this.mazeStepInterval = setInterval(() => element.mazeStep(), options.interval);
        }
      };
  
      element.mazeStep = (): void => {
        if (!element.maze.step()) {
          element.mazePause();
          element.addClassName(document.getElementById(`${id}_step`), "disabled");
          if (options.watch !== false) element.addClassName(document.getElementById(`${id}_watch`), "disabled");
          element.addClassName(document.getElementById(`${id}_run`), "disabled");
        }
      };
  
      element.mazeQuickStep = (): void => {
        this.quickStep = true;
        element.mazeRun();
      };
  
      element.mazeReset = (): void => {
        element.mazePause();
  
        const value = typeof options.input === "function" ? options.input() : options.input;
  
        const threshold = typeof options.threshold === "function" ? options.threshold() : options.threshold;
  
        const growSpeed = Math.round(Math.sqrt(width * height));
        const wallSpeed = Math.round(Math.min(width, height) / 2);
  
        element.maze = new Maze(width, height, Maze.Algorithms[algorithm], {
          seed: options.seed,
          rng: options.rng,
          input: value,
          weave: options.weave,
          weaveMode: options.weaveMode,
          weaveDensity: options.weaveDensity,
          threshold: threshold,
          growSpeed: growSpeed,
          wallSpeed: wallSpeed
        });
  
        const canvas = document.getElementById(`${id}_canvas`) as HTMLCanvasElement;
  
        element.maze.element = element;
        element.maze.canvas = canvas;
        element.maze.context = canvas.getContext('2d')!;
        element.maze.cellWidth = Math.floor(canvas.width / element.maze.width);
        element.maze.cellHeight = Math.floor(canvas.height / element.maze.height);
  
        if (options.padded) {
          const inset = options.inset ?? 0.1;
          element.maze.insetWidth = Math.ceil(inset * element.maze.cellWidth);
          element.maze.insetHeight = Math.ceil(inset * element.maze.cellHeight);
        }
  
        element.maze.onUpdate(updateCallback);
        element.maze.onEvent(eventCallback);
  
        element.maze.context.clearRect(0, 0, canvas.width, canvas.height);
  
        element.removeClassName(document.getElementById(`${id}_step`), "disabled");
        if (options.watch !== false) element.removeClassName(document.getElementById(`${id}_watch`), "disabled");
        element.removeClassName(document.getElementById(`${id}_run`), "disabled");
  
        drawMaze(element.maze);
      };
  
      element.mazeReset();
    }
  }
  