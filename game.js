'use strict';
'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(vector) {
    if(!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }
  times(dig) {
    return new Vector(this.x * dig, this.y * dig);
  }
}


class Actor {
  constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
    if(!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error('Не задан нужный аргумент!(23)');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }
    get type() {
      return 'actor';
    }
    get left() {
      return this.pos.x;
    }
    get right() {
      return this.pos.x + this.size.x;
    }
    get top() {
      return this.pos.y;
    }
    get bottom() {
      return this.pos.y + this.size.y;
    }
    
    isIntersect(actor) {
      if(!(actor instanceof Actor)) {
        throw new Error('Не задан нужный аргумент!(48)');
      }
      if(this === actor) {
        return false;
      }
      if (this.top >= actor.bottom) {
        return false;
      } 
		  if (this.right <= actor.left) {
		    return false;
		  }
		  if (this.left >= actor.right) {
		    return false;
		  }
		  if (this.bottom <= actor.top) {
		    return false;
		  }
		  return true;
    }
    
    act() {}
  }
 
 
class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    
    for(let play of actors) {
      if(play.type === 'player') {
        this.player = play;
        break;
      }
    }
    
    this.height = grid.length;
    this.width = 0;

    for(let i of this.grid) {
      if(i !== undefined) {
        if(i.length > this.width) {
          this.width = i.length;
        } 
      }
    }
    
    this.status = null;
    this.finishDelay = 1;
  }
  
  isFinished() {
    if((this.status !== null) && (this.finishDelay < 0)) {
      return true;
    } else {
      return false;
    }
  }
  
  actorAt(actor) {
    if(!(actor instanceof Actor)) {
      throw new Error('Не задан нужный аргумент!(109)');
    }
    if(this.grid === undefined) {
			return undefined;
		}
		for(let newAct of this.actors) {
			if((typeof(newAct) !== undefined) && (actor.isIntersect(newAct))) {
				return newAct;
			}
		}
  }

  obstacleAt(pos, size) {
    if(!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Не задан нужный аргумент!(123)');
    }
    if((pos.y + size.y) > this.height) {
      return 'lava';
    }
    if((pos.x < 0) || (pos.y <0) || ((pos.x + size.x) > this.width)) {
      return 'wall';
    }
    for(let i = Math.round(pos.x); i < Math.round(pos.x + size.x); i++) {
      for(let d = Math.round(pos.y); d < Math.round(pos.y + size.y); d++) {
        if(this.grid[d][i] !== undefined) {
          return this.grid[d][i];
        }
      }
    }
    return undefined;
  }
  
  removeActor(actor) {
    let deletActor = this.actors.indexOf(actor);
    if(deletActor > -1) {
      this.actors.splice(deletActor, 1);
    } 
  }
  
  noMoreActors(obj) {
    if(this.actors !== undefined) {
      for(let moreActors of this.actors) {
        if(moreActors.type !== obj) {
          return true;
        } else {
          return false;
        }
      }
    }
    return true;
  }
  
  playerTouched(type, activeObj) {
    if(this.status === null) {
      if((type === 'lava') || (type === 'fireball')) {
        this.status = 'lost';
      } else if((type === 'coin') && (activeObj.type === 'coin')) {
        this.removeActor(activeObj);
        if(this.noMoreActors('coin') === true) {
          this.status = 'won';
        }
      }
    }
    return;
  }
}


class LevelParser {
  constructor(activeActors = {}) {
    this.activeActors = activeActors;
  }
  
  actorFromSymbol(sym) {
  	if(typeof(sym) === 'undefined') {
  		return undefined;
  	}
    if(sym in this.activeActors) {
      return this.activeActors[sym];
    }
    return undefined;
  }

  obstacleFromSymbol(sym) {
    if(sym === 'x') {
      return 'wall';
    } else if(sym === '!') {
      return 'lava';
    } else {
      return undefined;
    }
  }

  createGrid(grid) {
    let newGrid = [];
    for(let i = 0; i < grid.length; i++) {
      let newArray = [];
      for(let d = 0; d < grid[i].length; d++) {
        newArray.push(this.obstacleFromSymbol(grid[i].charAt(d)));
      }
      newGrid.push(newArray);
    }
    return newGrid;
  }

  createActors(actor) {
    let newActor = [];
    for(let i = 0; i < actor.length; i++) {
      for(let d = 0; d < actor[i].length; d++) {
        let Act = this.activeActors[actor[i][d]];
          if(typeof(Act) === 'function') {
          let option = new Act(new Vector(d, i));
          if(option instanceof Actor) {
            newActor.push(option);
          }
        }
      }
    }
    return newActor;
  }
  
   parse(arrayStr) {
    let grid = this.createGrid(arrayStr);
    let actors = this.createActors(arrayStr);
    return new Level(grid, actors);
  }
}


class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed);
  }
  
  get type() {
    return 'fireball';
  }
  
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  
  handleObstacle() {
    this.speed = new Vector(-this.speed.x, -this.speed.y);
  }
  
  act(time, level) {
    let newPos = this.getNextPosition(time);
    if (level.obstacleAt(newPos, this.size)) {
      this.handleObstacle();
      return;
    }
    this.pos = newPos;
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.newPos = pos;
  }
  
  handleObstacle() {
    this.pos = this.newPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector()) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * (2 * Math.PI);
    this.newVector = this.pos;
  }
  
  get type() {
    return 'coin';
  }
  
  updateSpring(timeJump = 1) {
    this.spring += this.springSpeed * timeJump;
  }
  
  getSpringVector() {
    let y = Math.sin(this.spring) * this.springDist;
    return new Vector(0, y);
  }
  
  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.newVector.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector()) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
  }
  
  get type() {
    return 'player';
  }
}


/*const levels =  [
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |xxx       w         ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @    *  xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |                    ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @       xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "        |           |  ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "     |                 ",
    "                       ",
    "         =      |      ",
    " @ |  o            o   ",
    "xxxxxxxxx!!!!!!!xxxxxxx",
    "                       "
  ],
  [
    "                       ",
    "                       ",
    "                       ",
    "    o                  ",
    "    x      | x!!x=     ",
    "         x             ",
    "                      x",
    "                       ",
    "                       ",
    "                       ",
    "               xxx     ",
    "                       ",
    "                       ",
    "       xxx  |          ",
    "                       ",
    " @                     ",
    "xxx                    ",
    "                       "
  ], [
    "   v         v",
    "              ",
    "         !o!  ",
    "              ",
    "              ",
    "              ",
    "              ",
    "         xxx  ",
    "          o   ",
    "        =     ",
    "  @           ",
    "  xxxx        ",
    "  |           ",
    "      xxx    x",
    "              ",
    "          !   ",
    "              ",
    "              ",
    " o       x    ",
    " x      x     ",
    "       x      ",
    "      x       ",
    "   xx         ",
    "              "
  ]
];

const actorDict = {
  '@': Player,
  '=': HorizontalFireball,
  'v': FireRain,
  '|': VerticalFireball,
  'o': Coin
};
const parser = new LevelParser(actorDict);
runGame(levels, parser, DOMDisplay)
  .then(() => alert('Вы выиграли приз!'));

const level = new Level();
runLevel(level, DOMDisplay);
*/

const actorDict = {
  "@": Player,
  "=": HorizontalFireball,
  "|": VerticalFireball,
  "v": FireRain,
  "o": Coin
};

const parser = new LevelParser(actorDict);
loadLevels()
  .then(schemas => runGame(JSON.parse(schemas), parser, DOMDisplay))
  .then(() => alert('Вы выиграли приз!'));