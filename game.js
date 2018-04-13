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
        throw new Error('Не задан нужный аргумент!(47)');
      }
      if(this === actor) {
        return false;
      }
      if (this.top >= actor.bottom) {
        return false;
      }
      // форматирование
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
    this.grid = grid.slice();
    this.actors = actors.slice();
    this.player = this.actors.find((actor) => actor.type === 'player');
    this.height = grid.length;
    this.width = Math.max(0,...this.grid.map(a => a.length));

    // комментарий
    /*for(let i of this.grid) {
      if(i !== undefined) {
        if(i.length > this.width) {
          this.width = i.length;
        } 
      }
    }
    */

    this.status = null;
    this.finishDelay = 1;
  }
  
  isFinished() {
    return ((this.status !== null) && (this.finishDelay < 0)); 
  }
  
  actorAt(actor) {
    if(!(actor instanceof Actor)) {
      throw new Error('Не задан нужный аргумент!(109)');
    }
    return this.actors.find(newAct => newAct.isIntersect(actor));
  }

  obstacleAt(pos, size) {

    const x1 = Math.floor(pos.x);
    const x2 = Math.ceil(pos.x + size.x);
    const y1 = Math.floor(pos.y);
    const y2 = Math.ceil(pos.y + size.y);

    if(!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Не задан нужный аргумент!(123)');
    }
    if(y2 > this.height) {
      return 'lava';
    }
    if((x1 < 0) || (y1 <0) || (x2 > this.width)) {
      return 'wall';
    }
    for(let i = x1; i < x2; i++) {
      for(let d = y1; d < y2; d++) {
        // this.grid[d][i] лучше записать в переменную
        // и достаточно проверки if (this.grid.[d][i])
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
    return !this.actors.some(a => a.type === obj);
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
    return; // лишняя строчка


    // комментарий
    /* 
    if(this.status !== null) {
      return;
    }
    if(type === 'lava' || type === 'fireball') {
      this.status = 'lost';
    }
    if((type === 'coin') && (activeObj.type === 'coin')) {
      this.removeActor(activeObj);
      if(this.noMoreActors('coin') === true) {
        this.status = 'won';
      }
    }
     */
  }
}


class LevelParser {
  constructor(activeActors = {}) {
    // в ES6 можно использовать оператор ...
    this.activeActors = Object.assign({}, activeActors);
  }
  
  actorFromSymbol(sym) {
  	return this.activeActors[sym];
  }

  obstacleFromSymbol(sym) {
    if(sym === 'x') {
      return 'wall';
    } else if(sym === '!') {
      return 'lava';
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
    // значение присваивается переменой один раз, так что лучше использвать const
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
    const grid = this.createGrid(arrayStr);
    const actors = this.createActors(arrayStr);
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
    this.speed = this.speed.times(-1);
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
  .then(() => alert('Вы победили и выиграли приз!'));
