// Global variable initialization
let numRows;
let numColumns;
let numMines;
let unflaggedMines;
let hundredCount;
let mineGrid = [];
let arrGrid = [];
let edgeArr = [];
let firstClick;
let table = document.createElement('table');
let minesRemaining = document.getElementById('minesRemaining');
let body = document.getElementById('body');
let showNonEdge = document.getElementById('nonEdgeProbability');
let flagMode = document.getElementById('flagMode');
let sec;
let timer;
let isWin;

// Return all current variables for debugging
function getVariables() {
    console.log("numMines: " + numMines);
    console.log("unflaggedMines: " + unflaggedMines);
    console.log("firstClick: " + firstClick);
    console.log("flagMode.checked:");
    console.log(flagMode.checked);
    console.log("showNonEdge.checked:");
    console.log(showNonEdge.checked);
    console.log("mineGrid:");
    console.log(mineGrid);
    console.log("hundredCount: " + hundredCount);
    console.log("arrGrid:");
    console.log(arrGrid);
    console.log("edgeArr:");
    console.log(edgeArr);
}

// Format seconds for timer
function padTime(sec) {
    if (sec <= 9) {
        return '0' + sec;
    }
    return sec;
}

// Reset timer for new grid
function resetTimer() {
    clearInterval(timer);
    sec = 0;
    document.getElementById("seconds").innerHTML = '00';
    document.getElementById("minutes").innerHTML = '00';
}

// Toggle flag mode
function toggleFlagMode() {
    flagMode = document.getElementById('flagMode');
    table.innerHTML = '';
    makeTable(mineGrid, table);

}

// Quick toggle flag mode on player click "zero" cell
function quickToggleFlagMode() {
    flagMode = document.getElementById('flagMode');
    flagMode.checked = !flagMode.checked
    table.innerHTML = '';
    makeTable(mineGrid, table);

}

// Shows or hides unborderd probabilities
function toggleShowNonEdge() {
    showNonEdge = document.getElementById('nonEdgeProbability');
    table.innerHTML = '';
    makeTable(mineGrid, table);
}

// Generate grid based on player input
function generateGrid() {
    // Assign First Click Attribute
    firstClick = true;

    // Remove Old Table
    resetTimer();
    hundredCount = 0;
    mineGrid = [];
    arrGrid = [];
    edgeArr = [];
    table.innerHTML = '';
    isWin = false;
    
    // Get New Table Data
    numRows = parseInt(document.getElementById('numRows').value);
    numColumns = parseInt(document.getElementById('numColumns').value);
    numMines = parseInt(document.getElementById('numMines').value);
    if (numRows < 1 || numColumns < 1 || numMines < 1) {
        alert('Rows, columns, and number of mines must be at least 1');
        return false;
    }
    if (numRows * numColumns < numMines) {
        alert('Maximum number of mines allowed for this grid size is ' + numRows*numColumns);
        return false;
    }
    if (numRows * numColumns > 480 || numMines > 99) {
        alert('Maximum grid size is 16x30 and 99 mines');
        return false;
    }
    unflaggedMines = numMines;
    document.getElementById('timerBlock').style.display = 'block';
    minesRemaining.textContent = 'Mines Remaining: ' + numMines;

    // Initiate Grid
    for (let i = 0; i < numRows; i++) {
        mineGrid[i] = [];
        for (let j = 0; j < numColumns; j++) {
            mineGrid[i][j] = {mine: false, open: false, neighbors: 0, flag: false, edge: false, edgeCount: 0, mineArr: 0, probability: -1};
        }
    }
    makeTable(mineGrid, table);
    body.appendChild(table);
}

// Run all probablity calculations
function generateProbability(isAllProbability) {
    // Reset old probability values
    for (let i = 0; i < mineGrid.length; i++) {
        for (let j = 0; j < mineGrid[i].length; j++) {
            mineGrid[i][j].mineArr = 0;
            mineGrid[i][j].probability = -1;
        }
    }
    hundredCount = 0;
    arrGrid = [];
    edgeArr = [];

    // Run basic logic rules
    edgeCount(mineGrid);
    let ret1 = true;
    let ret2 = true;
    while (ret1 == true || ret2 == true) {
        ret1 = ruleOne(mineGrid);
        ret2 = ruleTwo(mineGrid);
    }
    ruleThree(mineGrid);

    // Calculate arrangements and probabilities
    let index = findNextEdge(mineGrid, 0, 0);
    let i = index[0];
    let j = index[1];
    while (i > -1) {
        arrGrid.push({mine: null, r: i, c: j});
        if (j == numColumns - 1) {
            index = findNextEdge(mineGrid, i+1, 0);
            i = index[0];
            j = index[1];
        }
        else {
            index = findNextEdge(mineGrid, i, j+1);
            i = index[0];
            j = index[1];
        }
    }
    if (arrGrid.length > 0) {
        generateArrangements(mineGrid, arrGrid, 0);
        probabilityCalculation(edgeArr, mineGrid, isAllProbability);
    }
    else {
        let nonEdge = nonEdgeCount(mineGrid);
        let remainingMines = numMines - hundredCount;
        for (let i = 0; i < mineGrid.length; i++) {
            for (let j = 0; j < mineGrid[i].length; j++) {
                if (mineGrid[i][j].open == false && mineGrid[i][j].edge == false) {
                    mineGrid[i][j].probability = Math.round(remainingMines / nonEdge * 100);
                }
            }
        }

    }

    // Display table
    table.innerHTML = '';
    makeTable(mineGrid, table);
}

// Randomly place mines on grid
function placeMine(mineGrid, numRows, numColumns, numMines, x, y) {
    for (k = 0; k < numMines; k++) {
        let i = Math.floor(Math.random() * numRows);
        let j = Math.floor(Math.random() * numColumns);
        if (i >= x-1 && i <= x+1 && j >= y-1 && j <= y+1) {
            k--;
        }
        else {
            if (mineGrid[i][j].mine == true) {
                k--;
            }
            else {
                mineGrid[i][j].mine = true;
            }
        }
    }
}

// Place mines in specific locations for bugfixing
function placeMineTwo(mineGrid) {

}

// Calculate and display how many mines are nearby each cell
function neighborCount(mineGrid) {
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numColumns; j++) {
            let count = 0;
            // Left
            if (j > 0) {
                if (mineGrid[i][j-1].mine == true) {
                    count++;
                }
            }
            // Upper Left
            if (i > 0 && j > 0) {
                if (mineGrid[i-1][j-1].mine == true) {
                    count++;
                }
            }
            // Up
            if (i > 0) {
                if (mineGrid[i-1][j].mine == true) {
                    count++;
                }
            }
            // Upper Right
            if (i > 0 && j < (numColumns-1)) {
                if(mineGrid[i-1][j+1].mine == true) {
                    count++;
                }
            }
            // Right
            if (j < (numColumns-1)) {
                if (mineGrid[i][j+1].mine == true) {
                    count++;
                }
            }
            // Bottom Right
            if (i < (numRows-1) && j < (numColumns-1)) {
                if (mineGrid[i+1][j+1].mine == true) {
                    count++;
                }
            }
            // Bottom
            if (i < (numRows-1)) {
                if (mineGrid[i+1][j].mine == true) {
                    count++;
                }
            }
            // Bottom Left
            if (i < (numRows-1) && j > 0) {
                if (mineGrid[i+1][j-1].mine == true) {
                    count++;
                }
            }
            if (mineGrid[i][j].mine == true) {
                mineGrid[i][j].neighbors = -1;
            }
            else {
                mineGrid[i][j].neighbors = count;
            }
        }
    }
    
}

// Run all related functions upon player click
function revealCell(e) {
    // Prevent content menu pop up
    if (flagMode.checked == true) {
        e.preventDefault();
    }

    // Get cell index
    let id = (this.id).split('_');
    let i = parseInt(id[0]);
    let j = parseInt(id[1]);

    // Run related functions for player first click
    if (firstClick == true) {
        firstClick = false;
        placeMine(mineGrid, numRows, numColumns, numMines, i, j);
        // placeMineTwo(mineGrid);
        neighborCount(mineGrid);
        timer = setInterval(function() {
            document.getElementById('seconds').innerHTML = padTime(++sec%60);
            document.getElementById('minutes').innerHTML = padTime(parseInt(sec/60));
        }, 1000);
    }

    // Reveal appropriate cells
    mineGrid[i][j].open = true;
    if (mineGrid[i][j].neighbors == 0) {
        revealNeighbors(mineGrid, i, j);
    }

    // Detect loss
    if (mineGrid[i][j].mine == true) {
        clearInterval(timer);
        for (let r = 0; r < mineGrid.length; r++) {
            for (let c = 0; c < mineGrid[r].length; c++) {
                if (mineGrid[r][c].flag == false && mineGrid[r][c].mine == true) {
                    mineGrid[r][c].open = true;
                }
            }
        }
        // Reset old probability values
        for (let r = 0; r < mineGrid.length; r++) {
            for (let c = 0; c < mineGrid[i].length; c++) {
                mineGrid[r][c].mineArr = 0;
                mineGrid[r][c].probability = -1;
            }
        }
        hundredCount = 0;
        arrGrid = [];
        edgeArr = [];

        // Display table
        table.innerHTML = '';
        makeTable(mineGrid, table);
        return;
    }

    // Reset old probability values
    for (let r = 0; r < mineGrid.length; r++) {
        for (let c = 0; c < mineGrid[i].length; c++) {
            mineGrid[r][c].mineArr = 0;
            mineGrid[r][c].probability = -1;
        }
    }
    hundredCount = 0;
    arrGrid = [];
    edgeArr = [];
    
    // generateProbability(true);

    // Display table
    table.innerHTML = '';
    makeTable(mineGrid, table);

    // Detect win
    if (isWin == true) {
        for (let r = 0; r < mineGrid.length; r++) {
            for (let c = 0; c < mineGrid[r].length; c++) {
                if (mineGrid[r][c].flag == false && mineGrid[r][c].mine == true) {
                    mineGrid[r][c].flag = true;
                    unflaggedMines--;
                }
            }
        }
        minesRemaining.textContent = 'Mines Remaining: ' + unflaggedMines;
        table.innerHTML = '';
        makeTable(mineGrid, table);
    }
}

// Run all related functions upon player flag
function flag(e) {
    // Prevent content menu pop up
    if (flagMode.checked == false) {
        e.preventDefault();
    }

    // Flag or unflag selected cell
    let id = (this.id).split('_');
    i = parseInt(id[0]);
    j = parseInt(id[1]);
    if(mineGrid[i][j].flag == true) {
        mineGrid[i][j].flag = false;
        unflaggedMines++;
    }
    else {
        mineGrid[i][j].flag = true;
        unflaggedMines--;
    }

    // Display table
    minesRemaining.textContent = 'Mines Remaining: ' + unflaggedMines;
    table.innerHTML = '';
    makeTable(mineGrid, table);
}

// Run all related functions upon player neighbor click
function revealFlagged() {
    // Reveal appropriate cells or detect loss
    let id = (this.id).split('_');
    i = parseInt(id[0]);
    j = parseInt(id[1]);
    if (correctlyFlagged(mineGrid, i, j) == true) {
        revealNeighbors(mineGrid, i, j);
    }
    else if (correctlyFlagged(mineGrid, i, j) == false) {
        for (let r = 0; r < mineGrid.length; r++) {
            for (let c = 0; c < mineGrid[r].length; c++) {
                if (mineGrid[r][c].flag == false && mineGrid[r][c].mine == true) {
                    mineGrid[r][c].open = true;
                }
            }
        }
        // Reset old probability values
        for (let r = 0; r < mineGrid.length; r++) {
            for (let c = 0; c < mineGrid[i].length; c++) {
                mineGrid[r][c].mineArr = 0;
                mineGrid[r][c].probability = -1;
            }
        }
        hundredCount = 0;
        arrGrid = [];
        edgeArr = [];

        // Display table
        table.innerHTML = '';
        makeTable(mineGrid, table);
        return;
    }

    // Reset old probability values
    for (let i = 0; i < mineGrid.length; i++) {
        for (let j = 0; j < mineGrid[i].length; j++) {
            mineGrid[i][j].mineArr = 0;
            mineGrid[i][j].probability = -1;
        }
    }
    hundredCount = 0;
    arrGrid = [];
    edgeArr = [];

    // generateProbability(false);

    // Display table
    table.innerHTML = '';
    makeTable(mineGrid, table);

    // Detect win
    if (isWin == true) {
        for (let r = 0; r < mineGrid.length; r++) {
            for (let c = 0; c < mineGrid[r].length; c++) {
                if (mineGrid[r][c].flag == false && mineGrid[r][c].mine == true) {
                    mineGrid[r][c].flag = true;
                    unflaggedMines--;
                }
            }
        }
        minesRemaining.textContent = 'Mines Remaining: ' + unflaggedMines;
        table.innerHTML = '';
        makeTable(mineGrid, table);
    }
}

// Prevent content menu popup on flag misclicks
function preventMenu(e) {
    e.preventDefault();
}

// Generate HTML table from grid
function makeTable(mineGrid, table) {
    let cellsOpen = 0;
    for (let i = 0; i < mineGrid.length; i++) {
        let row = document.createElement('tr');
        for (let j = 0; j < mineGrid[i].length; j++) {
            let cell = document.createElement('td');
            cell.id = i + '_' + j;
            if (mineGrid[i][j].open == false) {
                if (flagMode.checked == true) {
                    cell.addEventListener('click', flag);
                }
                else {
                    cell.addEventListener('contextmenu', flag);
                }
                if (mineGrid[i][j].flag == false) {
                    if (flagMode.checked == true) {
                        cell.addEventListener('contextmenu', revealCell);
                    }
                    else {
                        cell.addEventListener('click', revealCell);
                    }
                    cell.className = 'hidden' + flagMode.checked;
                }
            }
            else {
                cellsOpen++;
                cell.addEventListener('contextmenu', preventMenu);
            }
            if (mineGrid[i][j].mine == false && mineGrid[i][j].open == true) {
                if (mineGrid[i][j].neighbors > 0) {
                    cell.addEventListener('click', revealFlagged);
                    cell.textContent = mineGrid[i][j].neighbors;
                    cell.className = mineGrid[i][j].neighbors;
                }
                else {
                    cell.addEventListener('click', quickToggleFlagMode);
                }
            }
            if (mineGrid[i][j].mine == true && mineGrid[i][j].open == true) {
                cell.className = 'mine';
            }
            if (mineGrid[i][j].flag == true) {
                cell.className = 'flag';
            }
            else if (mineGrid[i][j].probability >= 0) {
                if (showNonEdge.checked == true) {
                    cell.textContent = mineGrid[i][j].probability;
                    cell.className = 'hidden' + flagMode.checked;
                }
                else if (mineGrid[i][j].edge == true) {
                    cell.textContent = mineGrid[i][j].probability;
                    cell.className = 'hidden' + flagMode.checked;
                }
            }
            row.appendChild(cell);
        }
    table.appendChild(row);
    }

    // Detect win
    if (cellsOpen == numRows * numColumns - numMines) {
        clearInterval(timer);
        isWin = true;
    }
}

// Recursively opens nearby cells that do not have mines nearby
function revealNeighbors(mineGrid, i, j) {
    // Left
    if (j > 0) {
        if (mineGrid[i][j-1].neighbors == 0 && mineGrid[i][j-1].open == false && mineGrid[i][j-1].flag == false) {
            mineGrid[i][j-1].open = true;
            revealNeighbors(mineGrid, i, j-1);
        }
        if (mineGrid[i][j-1].flag == false) {
            mineGrid[i][j-1].open = true;
        }
    }
    // Upper Left
    if (i > 0 && j > 0) {
        if (mineGrid[i-1][j-1].neighbors == 0 && mineGrid[i-1][j-1].open == false && mineGrid[i-1][j-1].flag == false) {
            mineGrid[i-1][j-1].open = true;
            revealNeighbors(mineGrid, i-1, j-1);
        }
        if (mineGrid[i-1][j-1].flag == false) {
            mineGrid[i-1][j-1].open = true;
        }
    }
    // Up
    if (i > 0) {
        if (mineGrid[i-1][j].neighbors == 0 && mineGrid[i-1][j].open == false && mineGrid[i-1][j].flag == false) {
            mineGrid[i-1][j].open = true;
            revealNeighbors(mineGrid, i-1, j);
        }
        if (mineGrid[i-1][j].flag == false) {
            mineGrid[i-1][j].open = true;
        }
    }
    // Upper Right
    if (i > 0 && j < (numColumns-1)) {
        if(mineGrid[i-1][j+1].neighbors == 0 && mineGrid[i-1][j+1].open == false && mineGrid[i-1][j+1].flag == false) {
            mineGrid[i-1][j+1].open = true;
            revealNeighbors(mineGrid, i-1, j+1);
        }
        if (mineGrid[i-1][j+1].flag == false) {
            mineGrid[i-1][j+1].open = true;
        }
    }
    // Right
    if (j < (numColumns-1)) {
        if (mineGrid[i][j+1].neighbors == 0 && mineGrid[i][j+1].open == false && mineGrid[i][j+1].flag == false) {
            mineGrid[i][j+1].open = true;
            revealNeighbors(mineGrid, i, j+1);
        }
        if (mineGrid[i][j+1].flag == false) {
            mineGrid[i][j+1].open = true;
        }
    }
    // Bottom Right
    if (i < (numRows-1) && j < (numColumns-1)) {
        if (mineGrid[i+1][j+1].neighbors == 0 && mineGrid[i+1][j+1].open == false && mineGrid[i+1][j+1].flag == false) {
            mineGrid[i+1][j+1].open = true;
            revealNeighbors(mineGrid, i+1, j+1);
        }
        if (mineGrid[i+1][j+1].flag == false) {
            mineGrid[i+1][j+1].open = true;
        }
    }
    // Bottom
    if (i < (numRows-1)) {
        if (mineGrid[i+1][j].neighbors == 0 && mineGrid[i+1][j].open == false && mineGrid[i+1][j].flag == false) {
            mineGrid[i+1][j].open = true;
            revealNeighbors(mineGrid, i+1, j);
        }
        if (mineGrid[i+1][j].flag == false) {
            mineGrid[i+1][j].open = true;
        }
    }
    // Bottom Left
    if (i < (numRows-1) && j > 0) {
        if (mineGrid[i+1][j-1].neighbors == 0 && mineGrid[i+1][j-1].open == false && mineGrid[i+1][j-1].flag == false) {
            mineGrid[i+1][j-1].open = true;
            revealNeighbors(mineGrid, i+1, j-1);
        }
        if (mineGrid[i+1][j-1].flag == false) {
            mineGrid[i+1][j-1].open = true;
        }
    }
}

// Count how many mines are around a cell to check if mines are flagged
function realMineCount(mineGrid, i, j) {
    let count = 0;
    // Left
    if (j > 0) {
        if (mineGrid[i][j-1].mine == true) {
            count++;
        }
    }
    // Upper Left
    if (i > 0 && j > 0) {
        if (mineGrid[i-1][j-1].mine == true) {
            count++;
        }
    }
    // Up
    if (i > 0) {
        if (mineGrid[i-1][j].mine == true) {
            count++;
        }
    }
    // Upper Right
    if (i > 0 && j < (numColumns-1)) {
        if (mineGrid[i-1][j+1].mine == true) {
            count++;
        }
    }
    // Right
    if (j < (numColumns-1)) {
        if (mineGrid[i][j+1].mine == true) {
            count++;
        }
    }
    // Bottom Right
    if (i < (numRows-1) && j < (numColumns-1)) {
        if (mineGrid[i+1][j+1].mine == true) {
            count++;
        }
    }
    // Bottom
    if (i < (numRows-1)) {
        if (mineGrid[i+1][j].mine == true) {
            count++;
        }
    }
    // Bottom Left
    if (i < (numRows-1) && j > 0) {
        if (mineGrid[i+1][j-1].mine == true) {
            count++;
        }
    }
    return count;
}

// Check if cell has correctly its mines correctly flagged
function correctlyFlagged(mineGrid, i, j) {
    let oughtToBeFlagged = realMineCount(mineGrid, i, j);
    let count = 0;
    let misCount = 0;
    // Left
    if (j > 0) {
        if (mineGrid[i][j-1].mine == true && mineGrid[i][j-1].flag == true) {
            count++;
        }
        if (mineGrid[i][j-1].mine == false && mineGrid[i][j-1].flag == true) {
            misCount++;
        }
    }
    // Upper Left
    if (i > 0 && j > 0) {
        if (mineGrid[i-1][j-1].mine == true && mineGrid[i-1][j-1].flag == true) {
            count++;
        }
        if (mineGrid[i-1][j-1].mine == false && mineGrid[i-1][j-1].flag == true) {
            misCount++;
        }
    }
    // Up
    if (i > 0) {
        if (mineGrid[i-1][j].mine == true && mineGrid[i-1][j].flag == true) {
            count++;
        }
        if (mineGrid[i-1][j].mine == false && mineGrid[i-1][j].flag == true) {
            misCount++;
        }
    }
    // Upper Right
    if (i > 0 && j < (numColumns-1)) {
        if (mineGrid[i-1][j+1].mine == true && mineGrid[i-1][j+1].flag == true) {
            count++;
        }
        if (mineGrid[i-1][j+1].mine == false && mineGrid[i-1][j+1].flag == true) {
            misCount++;
        }
    }
    // Right
    if (j < (numColumns-1)) {
        if (mineGrid[i][j+1].mine == true && mineGrid[i][j+1].flag == true) {
            count++;
        }
        if (mineGrid[i][j+1].mine == false && mineGrid[i][j+1].flag == true) {
            misCount++;
        }
    }
    // Bottom Right
    if (i < (numRows-1) && j < (numColumns-1)) {
        if (mineGrid[i+1][j+1].mine == true && mineGrid[i+1][j+1].flag == true) {
            count++;
        }
        if (mineGrid[i+1][j+1].mine == false && mineGrid[i+1][j+1].flag == true) {
            misCount++;
        }
    }
    // Bottom
    if (i < (numRows-1)) {
        if (mineGrid[i+1][j].mine == true && mineGrid[i+1][j].flag == true) {
            count++;
        }
        if (mineGrid[i+1][j].mine == false && mineGrid[i+1][j].flag == true) {
            misCount++;
        }
    }
    // Bottom Left
    if (i < (numRows-1) && j > 0) {
        if (mineGrid[i+1][j-1].mine == true && mineGrid[i+1][j-1].flag == true) {
            count++;
        }
        if (mineGrid[i+1][j-1].mine == false && mineGrid[i+1][j-1].flag == true) {
            misCount++;
        }
    }
    if (oughtToBeFlagged == count && misCount == 0) {
        return true;
    }
    else if (oughtToBeFlagged == count + misCount) {
        return false;
    }
}

// Label cells that border open cells and count how many "edges" are next to each cell
function edgeCount(mineGrid) {
    for (let i = 0; i < mineGrid.length; i++) {
        for (let j = 0; j < mineGrid[i].length; j++) {
            let count = 0;
            if (mineGrid[i][j].open == true) {
                mineGrid[i][j].edge = false;
                // Left
                if (j > 0) {
                    if (mineGrid[i][j-1].open == false) {
                        mineGrid[i][j-1].edge = true;
                        count++;
                    }
                }
                // Upper Left
                if (i > 0 && j > 0) {
                    if (mineGrid[i-1][j-1].open == false) {
                        mineGrid[i-1][j-1].edge = true;
                        count++;
                    }
                }
                // Up
                if (i > 0) {
                    if (mineGrid[i-1][j].open == false) {
                        mineGrid[i-1][j].edge = true;
                        count++;
                    }
                }
                // Upper Right
                if (i > 0 && j < (numColumns-1)) {
                    if(mineGrid[i-1][j+1].open == false) {
                        mineGrid[i-1][j+1].edge = true;
                        count++;
                    }
                }
                // Right
                if (j < (numColumns-1)) {
                    if (mineGrid[i][j+1].open == false) {
                        mineGrid[i][j+1].edge = true;
                        count++;
                    }
                }
                // Bottom Right
                if (i < (numRows-1) && j < (numColumns-1)) {
                    if (mineGrid[i+1][j+1].open == false) {
                        mineGrid[i+1][j+1].edge = true;
                        count++;
                    }
                }
                // Bottom
                if (i < (numRows-1)) {
                    if (mineGrid[i+1][j].open == false) {
                        mineGrid[i+1][j].edge = true;
                        count++;
                    }
                }
                // Bottom Left
                if (i < (numRows-1) && j > 0) {
                    if (mineGrid[i+1][j-1].open == false) {
                        mineGrid[i+1][j-1].edge = true;
                        count++;
                    }
                }
            }
            mineGrid[i][j].edgeCount = count;
        }
    }
}

// Count how many cells with zero probability are around a cell
function probabilityZeroCount(mineGrid, i, j) {
    let count = 0;
    // Left
    if (j > 0) {
        if (mineGrid[i][j-1].probability == 0) {
            count++;
        }
    }
    // Upper Left
    if (i > 0 && j > 0) {
        if (mineGrid[i-1][j-1].probability == 0) {
            count++;
        }
    }
    // Up
    if (i > 0) {
        if (mineGrid[i-1][j].probability == 0) {
            count++;
        }
    }
    // Upper Right
    if (i > 0 && j < (numColumns-1)) {
        if (mineGrid[i-1][j+1].probability == 0) {
            count++;
        }
    }
    // Right
    if (j < (numColumns-1)) {
        if (mineGrid[i][j+1].probability == 0) {
            count++;
        }
    }
    // Bottom Right
    if (i < (numRows-1) && j < (numColumns-1)) {
        if (mineGrid[i+1][j+1].probability == 0) {
            count++;
        }
    }
    // Bottom
    if (i < (numRows-1)) {
        if (mineGrid[i+1][j].probability == 0) {
            count++;
        }
    }
    // Bottom Left
    if (i < (numRows-1) && j > 0) {
        if (mineGrid[i+1][j-1].probability == 0) {
            count++;
        }
    }
    return count;
}

// Label cells that must be a mine by basic logic rules
function ruleOne(mineGrid) {
    let ret = false;
    for (let i = 0; i < mineGrid.length; i++) {
        for (let j = 0; j < mineGrid[i].length; j++) {
            if (mineGrid[i][j].edgeCount > 0 && mineGrid[i][j].neighbors == mineGrid[i][j].edgeCount - probabilityZeroCount(mineGrid, i, j)) {
                // Left
                if (j > 0) {
                    if (mineGrid[i][j-1].edge == true && mineGrid[i][j-1].probability < 0) {
                        mineGrid[i][j-1].probability = 100;
                        hundredCount++;
                        ret = true;
                    }
                }
                // Upper Left
                if (i > 0 && j > 0) {
                    if (mineGrid[i-1][j-1].edge == true && mineGrid[i-1][j-1].probability < 0) {
                        mineGrid[i-1][j-1].probability = 100;
                        hundredCount++;
                        ret = true;
                    }
                }
                // Up
                if (i > 0) {
                    if (mineGrid[i-1][j].edge == true && mineGrid[i-1][j].probability < 0) {
                        mineGrid[i-1][j].probability = 100;
                        hundredCount++;
                        ret = true;
                    }
                }
                // Upper Right
                if (i > 0 && j < (numColumns-1)) {
                    if(mineGrid[i-1][j+1].edge == true && mineGrid[i-1][j+1].probability < 0) {
                        mineGrid[i-1][j+1].probability = 100;
                        hundredCount++;
                        ret = true;
                    }
                }
                // Right
                if (j < (numColumns-1)) {
                    if (mineGrid[i][j+1].edge == true && mineGrid[i][j+1].probability < 0) {
                        mineGrid[i][j+1].probability = 100;
                        hundredCount++;
                        ret = true;
                    }
                }
                // Bottom Right
                if (i < (numRows-1) && j < (numColumns-1)) {
                    if (mineGrid[i+1][j+1].edge == true && mineGrid[i+1][j+1].probability < 0) {
                        mineGrid[i+1][j+1].probability = 100;
                        hundredCount++;
                        ret = true;
                    }
                }
                // Bottom
                if (i < (numRows-1)) {
                    if (mineGrid[i+1][j].edge == true && mineGrid[i+1][j].probability < 0) {
                        mineGrid[i+1][j].probability = 100;
                        hundredCount++;
                        ret = true;
                    }
                }
                // Bottom Left
                if (i < (numRows-1) && j > 0) {
                    if (mineGrid[i+1][j-1].edge == true && mineGrid[i+1][j-1].probability < 0) {
                        mineGrid[i+1][j-1].probability = 100;
                        hundredCount++;
                        ret = true;
                    }
                }
            }
        }
    }
    return ret;
}

// Count how many cells with one hundred probability are around a cell
function probabilityHundredCount(mineGrid, i, j) {
    let count = 0;
    // Left
    if (j > 0) {
        if (mineGrid[i][j-1].probability == 100) {
            count++;
        }
    }
    // Upper Left
    if (i > 0 && j > 0) {
        if (mineGrid[i-1][j-1].probability == 100) {
            count++;
        }
    }
    // Up
    if (i > 0) {
        if (mineGrid[i-1][j].probability == 100) {
            count++;
        }
    }
    // Upper Right
    if (i > 0 && j < (numColumns-1)) {
        if (mineGrid[i-1][j+1].probability == 100) {
            count++;
        }
    }
    // Right
    if (j < (numColumns-1)) {
        if (mineGrid[i][j+1].probability == 100) {
            count++;
        }
    }
    // Bottom Right
    if (i < (numRows-1) && j < (numColumns-1)) {
        if (mineGrid[i+1][j+1].probability == 100) {
            count++;
        }
    }
    // Bottom
    if (i < (numRows-1)) {
        if (mineGrid[i+1][j].probability == 100) {
            count++;
        }
    }
    // Bottom Left
    if (i < (numRows-1) && j > 0) {
        if (mineGrid[i+1][j-1].probability == 100) {
            count++;
        }
    }
    return count;
}

// Label cells that must not be a mine by basic logic rules
function ruleTwo(mineGrid) {
    let ret = false;
    for (let i = 0; i < mineGrid.length; i++) {
        for (let j = 0; j < mineGrid[i].length; j++) {
            if (mineGrid[i][j].edgeCount > 0 && mineGrid[i][j].neighbors == probabilityHundredCount(mineGrid, i, j)) {
                // Left
                if (j > 0) {
                    if (mineGrid[i][j-1].edge == true && mineGrid[i][j-1].probability < 0) {
                        mineGrid[i][j-1].probability = 0;
                        ret = true;
                    }
                }
                // Upper Left
                if (i > 0 && j > 0) {
                    if (mineGrid[i-1][j-1].edge == true && mineGrid[i-1][j-1].probability < 0) {
                        mineGrid[i-1][j-1].probability = 0;
                        ret = true;
                    }
                }
                // Up
                if (i > 0) {
                    if (mineGrid[i-1][j].edge == true && mineGrid[i-1][j].probability < 0) {
                        mineGrid[i-1][j].probability = 0;
                        ret = true;
                    }
                }
                // Upper Right
                if (i > 0 && j < (numColumns-1)) {
                    if(mineGrid[i-1][j+1].edge == true && mineGrid[i-1][j+1].probability < 0) {
                        mineGrid[i-1][j+1].probability = 0;
                        ret = true;
                    }
                }
                // Right
                if (j < (numColumns-1)) {
                    if (mineGrid[i][j+1].edge == true && mineGrid[i][j+1].probability < 0) {
                        mineGrid[i][j+1].probability = 0;
                        ret = true;
                    }
                }
                // Bottom Right
                if (i < (numRows-1) && j < (numColumns-1)) {
                    if (mineGrid[i+1][j+1].edge == true && mineGrid[i+1][j+1].probability < 0) {
                        mineGrid[i+1][j+1].probability = 0;
                        ret = true;
                    }
                }
                // Bottom
                if (i < (numRows-1)) {
                    if (mineGrid[i+1][j].edge == true && mineGrid[i+1][j].probability < 0) {
                        mineGrid[i+1][j].probability = 0;
                        ret = true;
                    }
                }
                // Bottom Left
                if (i < (numRows-1) && j > 0) {
                    if (mineGrid[i+1][j-1].edge == true && mineGrid[i+1][j-1].probability < 0) {
                        mineGrid[i+1][j-1].probability = 0;
                        ret = true;
                    }
                }
            }
        }
    }
    return ret;
}

// Count how many cells that are open are around a cell
function openCount(mineGrid, i, j) {
    let count = 0;
    // Left
    if (j > 0) {
        if (mineGrid[i][j-1].open == true) {
            count++;
        }
    }
    // Upper Left
    if (i > 0 && j > 0) {
        if (mineGrid[i-1][j-1].open == true) {
            count++;
        }
    }
    // Up
    if (i > 0) {
        if (mineGrid[i-1][j].open == true) {
            count++;
        }
    }
    // Upper Right
    if (i > 0 && j < (numColumns-1)) {
        if (mineGrid[i-1][j+1].open == true) {
            count++;
        }
    }
    // Right
    if (j < (numColumns-1)) {
        if (mineGrid[i][j+1].open == true) {
            count++;
        }
    }
    // Bottom Right
    if (i < (numRows-1) && j < (numColumns-1)) {
        if (mineGrid[i+1][j+1].open == true) {
            count++;
        }
    }
    // Bottom
    if (i < (numRows-1)) {
        if (mineGrid[i+1][j].open == true) {
            count++;
        }
    }
    // Bottom Left
    if (i < (numRows-1) && j > 0) {
        if (mineGrid[i+1][j-1].open == true) {
            count++;
        }
    }
    return count;
}

// Label isolated cells that have independently determined probabilities
function ruleThree(mineGrid) {
    for (let i = 0; i < mineGrid.length; i++) {
        for (let j = 0; j < mineGrid[i].length; j++) {
            if (mineGrid[i][j].edgeCount > 2) {
                let count = 0;
                // Left
                if (j > 0) {
                    if (mineGrid[i][j-1].edge == true && openCount(mineGrid, i, j-1) == 1) {
                        count++;
                    }
                }
                // Upper Left
                if (i > 0 && j > 0) {
                    if (mineGrid[i-1][j-1].edge == true && openCount(mineGrid, i-1, j-1) == 1) {
                        count++;
                    }
                }
                // Up
                if (i > 0) {
                    if (mineGrid[i-1][j].edge == true && openCount(mineGrid, i-1, j) == 1) {
                        count++;
                    }
                }
                // Upper Right
                if (i > 0 && j < (numColumns-1)) {
                    if(mineGrid[i-1][j+1].edge == true && openCount(mineGrid, i-1, j+1) == 1) {
                        count++;
                    }
                }
                // Right
                if (j < (numColumns-1)) {
                    if (mineGrid[i][j+1].edge == true && openCount(mineGrid, i, j+1) == 1) {
                        count++;
                    }
                }
                // Bottom Right
                if (i < (numRows-1) && j < (numColumns-1)) {
                    if (mineGrid[i+1][j+1].edge == true && openCount(mineGrid, i+1, j+1) == 1) {
                        count++;
                    }
                }
                // Bottom
                if (i < (numRows-1)) {
                    if (mineGrid[i+1][j].edge == true && openCount(mineGrid, i+1, j) == 1) {
                        count++;
                    }
                }
                // Bottom Left
                if (i < (numRows-1) && j > 0) {
                    if (mineGrid[i+1][j-1].edge == true && openCount(mineGrid, i+1, j-1) == 1) {
                        count++;
                    }
                }
                if (count == mineGrid[i][j].edgeCount) {
                    let probability = Math.round(mineGrid[i][j].neighbors / mineGrid[i][j].edgeCount * 100);
                    // Left
                    if (j > 0) {
                        mineGrid[i][j-1].probability = probability;
                    }
                    // Upper Left
                    if (i > 0 && j > 0) {
                        mineGrid[i-1][j-1].probability = probability;
                    }
                    // Up
                    if (i > 0) {
                        mineGrid[i-1][j].probability = probability;
                    }
                    // Upper Right
                    if (i > 0 && j < (numColumns-1)) {
                        mineGrid[i-1][j+1].probability = probability;
                    }
                    // Right
                    if (j < (numColumns-1)) {
                        mineGrid[i][j+1].probability = probability;
                    }
                    // Bottom Right
                    if (i < (numRows-1) && j < (numColumns-1)) {
                        mineGrid[i+1][j+1].probability = probability;
                    }
                    // Bottom
                    if (i < (numRows-1)) {
                        mineGrid[i+1][j].probability = probability;
                    }
                    // Bottom Left
                    if (i < (numRows-1) && j > 0) {
                        mineGrid[i+1][j-1].probability = probability;
                    }
                }
            }
        }
    }
}

// Find the next "edge" cell with an assigned logical probability starting from the given index
function findNextEdge(mineGrid, x, y) {
    for (let i = x; i < numRows; i++) {
        for (let j = y; j < numColumns; j++) {
            if (mineGrid[i][j].edge == true && mineGrid[i][j].probability < 0) {
                return [i,j];
            }
        }
        y = 0;
    }
    return [-1, -1];
}

// Count how many theoretical mines are placed around a cell when generating arrangements
function mineCount(grid, i, j) {
    let count = 0;
    for (k = 0; k < grid.length; k++) {
        if (grid[k].r >= i-1 && grid[k].r <= i+1 && grid[k].c >= j-1 && grid[k].c <= j+1) {
            if (grid[k].mine == true) {
                count++;
            }
        }
    }
    return count;
}

// Determine if a cell can be a mine by looking at open nearby numbers
function canBeMine(mineGrid, grid, i, j) {
    // Left
    if (j > 0) {
        if (mineGrid[i][j-1].open == true && mineGrid[i][j-1].neighbors <= mineCount(grid, i, j-1) + probabilityHundredCount(mineGrid, i, j-1)) {
            return false;
        }
    }
    // Upper Left
    if (i > 0 && j > 0) {
        if (mineGrid[i-1][j-1].open == true && mineGrid[i-1][j-1].neighbors <= mineCount(grid, i-1, j-1) + probabilityHundredCount(mineGrid, i-1, j-1)) {
            return false;
        }
    }
    // Up
    if (i > 0) {
        if (mineGrid[i-1][j].open == true && mineGrid[i-1][j].neighbors <= mineCount(grid, i-1, j) + probabilityHundredCount(mineGrid, i-1, j)) {
            return false;
        }
    }
    // Upper Right
    if (i > 0 && j < (numColumns-1)) {
        if(mineGrid[i-1][j+1].open == true && mineGrid[i-1][j+1].neighbors <= mineCount(grid, i-1, j+1) + probabilityHundredCount(mineGrid, i-1, j+1)) {
            return false;
        }
    }
    // Right
    if (j < (numColumns-1)) {
        if (mineGrid[i][j+1].open == true && mineGrid[i][j+1].neighbors <= mineCount(grid, i, j+1) + probabilityHundredCount(mineGrid, i, j+1)) {
            return false;
        }
    }
    // Bottom Right
    if (i < (numRows-1) && j < (numColumns-1)) {
        if (mineGrid[i+1][j+1].open == true && mineGrid[i+1][j+1].neighbors <= mineCount(grid, i+1, j+1) + probabilityHundredCount(mineGrid, i+1, j+1)) {
            return false;
        }
    }
    // Bottom
    if (i < (numRows-1)) {
        if (mineGrid[i+1][j].open == true && mineGrid[i+1][j].neighbors <= mineCount(grid, i+1, j) + probabilityHundredCount(mineGrid, i+1, j)) {
            return false;
        }
    }
    // Bottom Left
    if (i < (numRows-1) && j > 0) {
        if (mineGrid[i+1][j-1].open == true && mineGrid[i+1][j-1].neighbors <= mineCount(grid, i+1, j-1) + probabilityHundredCount(mineGrid, i+1, j-1)) {
            return false;
        }
    }
    return true;
}

// Count how many theoretical nonmines are placed around a cell when generating arrangements
function noMineCount(grid, i, j) {
    let count = 0;
    for (k = 0; k < grid.length; k++) {
        if (grid[k].r >= i-1 && grid[k].r <= i+1 && grid[k].c >= j-1 && grid[k].c <= j+1) {
            if (grid[k].mine == false) {
                count++;
            }
        }
    }
    return count;
}

// Determine if a cell can be not a mine by looking at open nearby numbers
function canNotBeMine(mineGrid, grid, i, j) {
    // Left
    if (j > 0) {
        if (mineGrid[i][j-1].open == true && mineGrid[i][j-1].neighbors >= mineGrid[i][j-1].edgeCount - noMineCount(grid, i, j-1) - probabilityZeroCount(mineGrid, i, j-1)) {
            return false;
        }
    }
    // Upper Left
    if (i > 0 && j > 0) {
        if (mineGrid[i-1][j-1].open == true && mineGrid[i-1][j-1].neighbors >= mineGrid[i-1][j-1].edgeCount - noMineCount(grid, i-1, j-1) - probabilityZeroCount(mineGrid, i-1, j-1)) {
            return false;
        }
    }
    // Up
    if (i > 0) {
        if (mineGrid[i-1][j].open == true && mineGrid[i-1][j].neighbors >= mineGrid[i-1][j].edgeCount - noMineCount(grid, i-1, j) - probabilityZeroCount(mineGrid, i-1, j)) {
            return false;
        }
    }
    // Upper Right
    if (i > 0 && j < (numColumns-1)) {
        if (mineGrid[i-1][j+1].open == true && mineGrid[i-1][j+1].neighbors >= mineGrid[i-1][j+1].edgeCount - noMineCount(grid, i-1, j+1) - probabilityZeroCount(mineGrid, i-1, j+1)) {
            return false;
        }
    }
    // Right
    if (j < (numColumns-1)) {
        if (mineGrid[i][j+1].open == true && mineGrid[i][j+1].neighbors >= mineGrid[i][j+1].edgeCount - noMineCount(grid, i, j+1) - probabilityZeroCount(mineGrid, i, j+1)) {
            return false;
        }
    }
    // Bottom Right
    if (i < (numRows-1) && j < (numColumns-1)) {
        if (mineGrid[i+1][j+1].open == true && mineGrid[i+1][j+1].neighbors >= mineGrid[i+1][j+1].edgeCount - noMineCount(grid, i+1, j+1) - probabilityZeroCount(mineGrid, i+1, j+1)) {
            return false;
        }
    }
    // Bottom
    if (i < (numRows-1)) {
        if (mineGrid[i+1][j].open == true && mineGrid[i+1][j].neighbors >= mineGrid[i+1][j].edgeCount - noMineCount(grid, i+1, j) - probabilityZeroCount(mineGrid, i+1, j)) {
            return false;
        }
    }
    // Bottom Left
    if (i < (numRows-1) && j > 0) {
        if (mineGrid[i+1][j-1].open == true && mineGrid[i+1][j-1].neighbors >= mineGrid[i+1][j-1].edgeCount - noMineCount(grid, i+1, j-1) - probabilityZeroCount(mineGrid, i+1, j-1)) {
            return false;
        }
    }
    return true;
}

// Recursively generate all possible mine arrangements for open edges
function generateArrangements(mineGrid, grid, index) {
    let i = grid[index].r;
    let j = grid[index].c;
    if (canBeMine(mineGrid, grid, i, j) == true) {
        let patternYes = JSON.parse(JSON.stringify(grid));
        patternYes[index].mine = true;
        if (index < grid.length - 1) {
            generateArrangements(mineGrid, patternYes, index+1);
        }
        else {
            edgeArr.push(patternYes);
        }
    }
    if (canNotBeMine(mineGrid, grid, i, j) == true) {
        let patternNo = JSON.parse(JSON.stringify(grid));
        patternNo[index].mine = false;
        if (index < grid.length - 1) {
            generateArrangements(mineGrid, patternNo, index+1);
        }
        else {
            edgeArr.push(patternNo);
        }
    }
}

// Count how many cells are neither open nor bordering open cells
function nonEdgeCount(mineGrid) {
    let count = 0;
    for (i = 0; i < mineGrid.length; i++) {
        for (j = 0; j < mineGrid[i].length; j++) {
            if (mineGrid[i][j].open == false && mineGrid[i][j].edge == false) {
                count++;
            }
        }
    }
    return count;
}

// Function used for combinations calculation
function productRange(a, b) {
    let prd = a
    let i = a;
   
    while (i++ < b) {
      prd*=i;
    }
    return prd;
  }
  
// Calculate combinations math
  function combinations(n, r) 
  {
    if (n == r || r == 0) 
    {
      return 1;
    } 
    else 
    {
      if (r < n - r) {
          r = n - r;
      }
      return productRange(r + 1, n) / productRange(1, n - r);
    }
}

// Calculate probabilities from given mine arrangements
function probabilityCalculation(edgeArr, mineGrid, allProbability) {
    // Store where mines are placed in each arrangement and find the total number of arrangements
    let arrCount = 0;
    let nonEdge = nonEdgeCount(mineGrid);
    for (let k = 0; k < edgeArr.length; k++) {
        let minesPlaced = 0;
        for (let i = 0; i < edgeArr[k].length; i++) {
            if (edgeArr[k][i].mine == true) {
                minesPlaced++;
            }
        }
        let remainingMines = numMines - minesPlaced - hundredCount;
        if (remainingMines >= 0 && remainingMines <= nonEdge) {
            let nonEdgeCombinations = combinations(nonEdge, remainingMines);
            for (let i = 0; i < edgeArr[k].length; i++) {
                if (edgeArr[k][i].mine == true) {
                    mineGrid[edgeArr[k][i].r][edgeArr[k][i].c].mineArr += nonEdgeCombinations;
                }
            }
            arrCount += nonEdgeCombinations;
            for (let i = 0; i < mineGrid.length; i++) {
                for (let j = 0; j < mineGrid[i].length; j++) {
                    if (mineGrid[i][j].open == false && mineGrid[i][j].edge == false) {
                        mineGrid[i][j].mineArr += remainingMines / nonEdge * nonEdgeCombinations
                    }
                }
            }
        }
    }

    // Calculate probability of each cell by dividing the number of arrangements with mines in each cell by total arrangements
    for (i = 0; i < mineGrid.length; i++) {
        for (j = 0; j < mineGrid[i].length; j++) {
            if (mineGrid[i][j].edge == true && mineGrid[i][j].probability < 0) {
                let edgeProbability = Math.round(mineGrid[i][j].mineArr / arrCount * 100);
                if (allProbability == false && (edgeProbability == 100 || edgeProbability == 0)) {
                    mineGrid[i][j].probability = edgeProbability;
                }
                if (allProbability == true) {
                    mineGrid[i][j].probability = edgeProbability;
                }
            }
            if (mineGrid[i][j].open == false && mineGrid[i][j].edge == false && mineGrid[i][j].probability < 0) {
                let nonEdgeProbability = Math.round(mineGrid[i][j].mineArr / arrCount * 100);
                if (allProbability == false && (nonEdgeProbability == 100 || nonEdgeProbability == 0)) {
                    mineGrid[i][j].probability = nonEdgeProbability;
                }
                if (allProbability == true) {
                    mineGrid[i][j].probability = nonEdgeProbability;
                }
            }
        }
    }
    // console.log("arrCount:");
    // console.log(arrCount);
    // console.log("nonEdge:");
    // console.log(nonEdge);
}