function onload() {
  window.e = new Engine;
}

var Engine = (function() {

  function Engine() {
    this.stateCode = {
      'empty': 0,
      'black': 1,
      'white': 2,
      'hint': 3
    };
    this.stateName = ['empty', 'black', 'white', 'hint'];
    this.board = [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];
    this.player = 0;  // 1:black, 2:white, 0:undefined
    this.hints = [];
    this.turnedOver = false;
    this.tileLock = true;
    this.info = {};
    
    this.drawBoard();
    this.prepareGame();
  }
  
  Engine.prototype.prepareGame = function() {
    $('#prepare-game').show();
  }
  
  Engine.prototype.selectStone = function(stone) {
    this.player = this.stateCode[stone];
    $('#prepare-game').hide();
    this.init();
    this.play();
  }
  
  Engine.prototype.drawBoard = function() {
    var b = $('#board');
    for (var i=0; i<8; i++)
      for (var j=0; j<8; j++)
        b.append('<div class="tile" id="t_'+i+'_'+j+'" onclick="e.clickTile('+i+','+j+');"><div class="stone"></div></div>');
  };
  
  Engine.prototype.init = function() {
    this.maxDepth = 7;  // 가능?
    this.timeLimit = 4300;    // This setting means that the time limit is less than 5000(ms).
    this.info = {
        scoreBlack: 0,
        scoreWhite: 0,
        countBlack: 0,
        countWhite: 0,
        round: 0
    };
    this.turn = this.stateCode['black'];
    for (var i=0; i<8; i++)
      for (var j=0; j<8; j++)
        this.setStone(i, j, 'empty', this.board, this.info, true);
    this.setStone(3, 3, 'white', this.board, this.info, true);
    this.setStone(3, 4, 'black', this.board, this.info, true);
    this.setStone(4, 3, 'black', this.board, this.info, true);
    this.setStone(4, 4, 'white', this.board, this.info, true);
    this.tileLock = true;
  };
  
  Engine.prototype.updateInfo = function() {
    $('#info').text('black:'+this.info.countBlack+' white:'+this.info.countWhite+' round:'+this.info.round);
  };
  
  Engine.prototype.setStone = function(y, x, state, board, info, toViz) {
    if (toViz)
      $('#t_'+y+'_'+x)[0].className = 'tile'+(state == 0 ? '' : ' '+state);
      
    info.countBlack += (board[y][x] == this.stateCode['black'] ? -1 : 0) + (state == 'black' ? 1 : 0);
    info.countWhite += (board[y][x] == this.stateCode['white'] ? -1 : 0) + (state == 'white' ? 1 : 0);
    var tileValue = (y==0 || y==7 ? 5 : 1) * (x==0 || x==7 ? 5 : 1);
    info.scoreBlack += (board[y][x] == this.stateCode['black'] ? tileValue * -1 : 0) + (state == 'black' ? tileValue : 0);
    info.scoreWhite += (board[y][x] == this.stateCode['white'] ? tileValue * -1 : 0) + (state == 'white' ? tileValue : 0);
    board[y][x] = this.stateCode[state];
  };
  
  Engine.prototype.getHint = function(board, turn) {
    var hintsGroup = [[],[],[]];
    for (var i=0; i<8; i++)
      for (var j=0; j<8; j++)
        if (this.isPossibleTile(board, turn, i, j))
          hintsGroup[(i==0 || i==7 ? 1 : 0) + (j==0 || j==7 ? 1 : 0)].push([i,j]);
    
    return hintsGroup[2].concat(hintsGroup[1]).concat(hintsGroup[0]);
  };
  
  Engine.prototype.getEnemy = function(turn) {
    return 3 - turn;
  };
  
  Engine.prototype.isPossibleTile = function(board, turn, y, x) {
    if (board[y][x] !== 0) return false;
    for (var i=-1; i<=1; i++)
      for (var j=-1; j<=1; j++)
        if (!(i == 0 && j == 0)) {
          var yy=y+i, xx=x+j;
          if (yy>=0 && xx>=0 && yy<8 && xx<8 && board[yy][xx] == this.getEnemy(turn)) {
            for (var k=2, yy=y+k*i, xx=x+k*j; true; k++, yy=y+k*i, xx=x+k*j)
              if (yy<0 || yy>7 || xx<0 || xx>7) break;
              else if (board[yy][xx] == turn) return true;
              else if (board[yy][xx] != this.getEnemy(turn)) break;
          }
        }
    return false;
  };
  
  Engine.prototype.play = function() {
    this.info.round++;
    this.updateInfo();
    this.tileLock = true;
    $('#message').text('Hurry up, Mr. '+this.stateName[this.turn]+'!');
    this.hints = this.getHint(this.board, this.turn);
    if (this.hints.length > 0) {
      this.turnedOver = false;
      if (this.turn == this.player) {
        for (var i=0; i<this.hints.length; i++)
          this.setStone(this.hints[i][0], this.hints[i][1], 'hint', this.board, this.info, true);
        e.playerPlay();
        return;
      }else e.computerPlay();
    }else if (this.turnedOver) {
      $('#message').text('Game Over!');
      // Game Over. To play again, refresh! (TODO: provide a restart button.)
      return;
    }else this.turnedOver = true;
    this.turn = this.getEnemy(this.turn);
    this.play();
  };
  
  Engine.prototype.clearHints = function(hints) {
    if (hints) {
      for (var i=hints.length; i--;)
        if (this.board[hints[i][0]][hints[i][1]] == this.stateCode['hint'])
          this.setStone(hints[i][0], hints[i][1], 'empty', this.board, this.info, true);
    }else
      for (var i=0; i<8; i++)
        for (var j=0; j<8; j++)
          if (this.board[i][j] == this.stateCode['hint'])
            this.setStone(i, j, 'empty', this.board, this.info, true);
  };
  
  Engine.prototype.clickTile = function(y, x) {
    if (this.tileLock || this.board[y][x] != this.stateCode['hint']) return;
    this.tileLock = true;
    this.clearHints(this.hints);
    this.setStone(y, x, this.stateName[this.turn], this.board, this.info, true);
    this.changeStones(this.board, y, x, this.turn, this.info, true);
    this.turn = this.getEnemy(this.turn);
    
    var _this = this;
    setTimeout(function(){_this.play();}, 100);
  };
  
  Engine.prototype.changeStones = function(board, y, x, turn, info, toViz) {
    for (var i=-1; i<=1; i++)
      for (var j=-1; j<=1; j++)
        if (!(i == 0 && j == 0)) {
          var yy=y+i, xx=x+j;
          if (yy>=0 && xx>=0 && yy<8 && xx<8 && board[yy][xx] == this.getEnemy(turn)) {
            for (var k=2, yy=y+k*i, xx=x+k*j; true; k++, yy=y+k*i, xx=x+k*j)
              if (yy<0 || yy>7 || xx<0 || xx>7) break;
              else if (board[yy][xx] == turn) {
                for (var kk=1, yy=y+kk*i, xx=x+kk*j; kk < k; kk++, yy=y+kk*i, xx=x+kk*j)
                  this.setStone(yy, xx, this.stateName[turn], board, info, toViz);
                break;
              }else if (board[yy][xx] != this.getEnemy(turn)) break;
          }
        }
  }
  
  Engine.prototype.deepCopy = function(o) {
    return jQuery.extend(true, {}, o);
  }
  
  Engine.prototype.playerPlay = function() {
    this.tileLock = false;
  };
  
  
  Engine.prototype.computerPlay = function() {
    var bestI = 0, bestScore = -99999;
    var board, info, score, y, x;
    this.currentMaxDepth = this.maxDepth;
    this.startTime = +new Date;
    
    for (var i=0; i < this.hints.length; i++) {
      board = this.deepCopy(this.board);
      info = this.deepCopy(this.info);
      y = this.hints[i][0];
      x = this.hints[i][1];
      this.setStone(y, x, this.stateName[this.turn], board, info, false);
      this.changeStones(board, y, x, this.turn, info, false);
      score = this.traverse(board, this.getEnemy(this.turn), 1, info, false, bestScore);
      if (score > bestScore) {
        bestScore = score;
        bestI = i;
      }
    }
    y = this.hints[bestI][0];
    x = this.hints[bestI][1];
    this.setStone(y, x, this.stateName[this.turn], this.board, this.info, true);
    this.changeStones(this.board, y, x, this.turn, this.info, true);
    $('#t_'+y+'_'+x).addClass('highlight');
    setTimeout(function(){
      var _y = y, _x = x;
      $('#t_'+_y+'_'+_x).removeClass('highlight');
    }, 2500);
  };
  
  Engine.prototype.traverse = function(board0, turn, depth, info0, turnedOver, preBestScore) {
    if (this.startTime + this.timeLimit < +new Date) {
      this.currentMaxDepth = 3;
    }

    var isEnemy = turn != this.turn;
    if (depth >= this.currentMaxDepth) {
      return this.evaluate(info0.scoreBlack, info0.scoreWhite);
    }
    
    var hints = this.getHint(board0, turn);
    var bestScore = 99999 * (isEnemy ? 1 : -1);
    var info;
    
    if (hints.length >=0) {
      var bestI = -1, board, score, y, x;
      for (var i=0; i < hints.length; i++) {
        board = this.deepCopy(board0);
        info = this.deepCopy(info0);
        y = hints[i][0];
        x = hints[i][1];
        this.setStone(y, x, this.stateName[turn], board, info, false);
        this.changeStones(board, y, x, turn, info, false);
        score = this.traverse(board, this.getEnemy(turn), depth+1, info, false, bestScore);
        if ((!isEnemy && score > bestScore) || (isEnemy && score < bestScore)) {
          bestScore = score;
          bestI = i;
        }
        // alpha-beta pruning
        if ((isEnemy && bestScore <= preBestScore) || (!isEnemy && bestScore >= preBestScore)) break;
      }
    }else{
      info = this.deepCopy(info0);
      if (turnedOver) {
        bestScore = this.evaluate(info.scoreBlack, info.scoreWhite) * 1000;
      }else{
        var board = this.deepCopy(board0);
        bestScore = this.traverse(board, this.getEnemy(turn), depth+1, info, true, preBestScore);
      }
    }
    return bestScore;
  };
  
  Engine.prototype.evaluate = function(scoreBlack, scoreWhite) {
    return (scoreBlack - scoreWhite) * (this.turn == this.stateCode['black'] ? 1 : -1);
  };
  
  return Engine;
})();

window.Engine = Engine;

