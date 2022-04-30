function aStar(map, startLoc, goalLoc, weight, uniformCost) {
    // weight is optional (weighted a star)
    if( weight === undefined ) weight = 1;
    if( uniformCost === undefined ) uniformCost = false;
    // destructure
    const [startLocX, startLocY] = startLoc;
    const [goalLocX, goalLocY] = goalLoc;
    // vars
    const start = map[startLocX][startLocY];
    const goal = map[goalLocX][goalLocY];
    // start A*
    s.g = 0;
    start.parent = start;
    const fringe = new Heap();
    // insert start cell into fringe with g-value + heuristic
    if(uniformCost)
        fringe.push([start, g + weight]);
    else
        fringe.push([start, g + (weight * start.heuristic)]);
    const closed = [];
    while(fringe.length != 0) {
        let s = fringe.pop();
        if(s.isGoal)
            return fringe; // TODO path found
        closed.append(s);
        const successors = getSuccessors(map, s);
        successors.forEach(succ => {
            if(!closed.find(c => c.equals(succ))) {
                if(!fringe.find(f => f.equals(succ))) {
                    succ.g = Number.MAX_SAFE_INTEGER;
                    succ.parent = null;
                }
                updateVertex(s, succ);
            }
        });
    }
    return null; // TODO path not found
}

function updateVertex(s, sPrime, uniformCost) {
    // weight is optional (weighted a star)
    if( uniformCost === undefined ) uniformCost = false;
    // update vertex from pseudo in write-up
    let costS = cost(s, sPrime);
    if(s.g + costS < sPrime.g) {
        sPrime.g = s.g + costS;
        sPrime.parent = s;
        let foundIdx = fringe.findIndex(f => f.equals(sPrime));
        if(foundIdx > -1)
            fringe.splice(foundIdx, 1);
        if(uniformCost)
            fringe.push([sPrime, sPrime.g]);
        else
            fringe.push([sPrime, sPrime.g + sPrime.heuristic]);
    }
}

function key(s, i, wOne) {
    return s.gArr[i] + wOne * s.heuristic;
}

function expandState(s, i, wOne) {
    open[i].remove(s);
    const successors = getSuccessors(map, s);
    successors.forEach(succ => {
        if( true ) { // TODO this says succ was never generated in the ith search. THIS NEEDS TO BE CHANGED
            succ.gArr[i] = Number.MAX_SAFE_INTEGER;
            succ.bp[i] = null;
        }
        if( succ.gArr[i] > s.gArr[i] + cost(s, succ) ) {
            succ.gArr[i] = s.gArr[i] + cost(s, succ);
            succ.bp[i] = s;
            if( !closed.find(cell => cell.equals(succ)) ) {
                succ.sorting = key(succ, i, wOne);
                open.push(succ);
            }
        }
    })
}

const keyComparator = (sOne, sTwo) => sOne.sorting - sTwo.sorting; // may need to be flipped
function seqHeurAStar(map, startLoc, goalLoc, n, wOne, wTwo) {
    // destructure
    const [startLocX, startLocY] = startLoc;
    const [goalLocX, goalLocY] = goalLoc;
    // vars
    const start = map[startLocX][startLocY];
    const goal = map[goalLocX][goalLocY];
    // begin sequential heuristic A*
    const open = [];
    const closed = [];
    for(let i = 0; i <= n; i++) {
        open[i] = new Heap(keyComparator);
        closed[i] = new Heap();
        startLoc.gArr[i] = 0;
        goalLoc.gArr[i] = Number.MAX_SAFE_INTEGER;
        startLoc.bp[i] = null;
        goalLoc.bp[i] = null;
        // push but in a weird way because i hate this library
        start.sorting = key(sTwo, i, wOne);
        open.push(start);
    }

    while(open[0].peek().sorting < Number.MAX_SAFE_INTEGER) {
        for(let i = 1; i <= n; i++) {
            if(open[i].peek().sorting <= (wTwo * open[0].peek().sorting) ) {
                if(goal.gArr[i] <= open[i].peek().sorting ) {
                    if(goal.gArr[i] < Number.MAX_SAFE_INTEGER)
                        return goal.bp[i];
                } else {
                    let s = open[i].top(); // this might not be the same top as the one in the psuedo! If something is wrong check this
                    expandState(s, i, wOne);
                    closed[i].push(s);
                }
            } else {
                if( goal.gArr[i] <= open[0].peek().sorting ) {
                    if( goal.gArr[i] < Number.MAX_SAFE_INTEGER )
                        return goal.bp[0];
                } else {
                    let s = open[i].top();
                    expandState(s, 0, wOne);
                    closed[0].push(s);
                }
            }
        }
    }
}

// TODO **SOMEONE MAKE SURE THESE COSTS ARE OK**
function cost(sFrom, sTo) {
    // figure out direction
    let direction;
    if(sFrom.x-sTo.x == 0 && sFrom.y-sTo.y == 0) return 0; // same cell
    else if(sFrom.x-sTo.x == 0) direction = 'horizontal';
    else if(sFrom.y-sTo.y == 0) direction = 'vertical';
    else if(sFrom.y-sTo.y == sFrom.x-sTo.x) direction = 'diagonal';
    else throw 'Case not caught in cost calculation!';
    // calculate cost
    const fromTerr = sFrom.terrain;
    const toTerr = sTo.terrain;
    //Travelling regular directions
    if((direction == 'horizontal' || direction == 'vertical') && fromTerr == '1' && toTerr == '1' ) return 1;
    if(direction == 'diagonal' && fromTerr == '1' && toTerr == '1') return Math.sqrt(2);
    if((direction == 'horizontal' || direction == 'vertical') && fromTerr == '2' && toTerr == '2') return 2;
    if(direction == 'diagonal' && fromTerr == '2' && toTerr == '2') return Math.sqrt(8);
    if((direction == 'horizontal' || direction == 'vertical') && (fromTerr == '2' && toTerr == '1') || (fromTerr == '1' && toTerr == '2')) return 1.5;
    if(direction == 'diagonal' && (fromTerr == '2' && toTerr == '1') || (fromTerr == '1' && toTerr == '2')) return (Math.sqrt(2) + Math.sqrt(8))/2.0;

    //All non-highway block traversals to or from regular highway blocks
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == '1' && toTerr == 'a')) return 1; 
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == 'a' && toTerr == '1')) return 1;
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == '2' && toTerr == 'a')) return 1.5;
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == 'a' && toTerr == '2')) return 1.5;
    //All non-highway block traversals to or from Hardtraversal highway blocks
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == '2' && toTerr == 'b')) return 2; // Possibly wrong
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == 'b' && toTerr == '2')) return 2;
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == '1' && toTerr == 'b')) return 1.5;
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == 'b' && toTerr == '1')) return 1.5;
    //All highway to highway traversals
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == 'a' && toTerr == 'a')) return .25;
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == 'b' && toTerr == 'b')) return .5;
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == 'a' && toTerr == 'b')) return .375;
    if((direction == 'horizontal'|| direction == 'vertical') && (fromTerr == 'b' && toTerr == 'a')) return .375;
    //
    throw 'UNWRITTEN CASE' // do highway cases pls
}

function getSuccessors(map, s) {
    const succ = [];
    // directions
    const up = map[s.x][s.y+1];
    const down = map[s.x][s.y-1];
    const left = map[s.x-1][s.y];
    const right = map[s.x+1][s.y];
    // up
    if(up) succ.append(up);
    // down
    if(down) succ.append(down);
    // left
    if(left) succ.append(left);
    // right
    if(right) succ.append(right);
    // return
    return succ;
}