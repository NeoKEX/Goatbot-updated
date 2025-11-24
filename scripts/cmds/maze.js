const { createCanvas } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

exports.config = {
    name: "maze",
    author: "allou moha",//updated by NeoKEX
    role: 0,
    countDown: 40,
    description: "Play maze with adjustable difficulty.",
    version: "1.0.3",
    guide: "{pn} [1-10] or {pn} [easy|medium|hard]",
    category: "game",
};

function generateMazeImage(difficulty = 15, grid = null, cols = null, highlightPath = null, wrongPath = null, currentPosition = null, progressPath = null) {
    difficulty = Math.max(1, Math.min(difficulty, 15));

    const base = 10;
    const scale = 0.4;
    const size = Math.floor(base + difficulty * scale);
    
    let rows;
    const cellSize = 30;

    if (!grid) {
        cols = size;
        rows = size;
        grid = [];
        const stack = [];

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                grid.push({
                    x,
                    y,
                    walls: { top: true, right: true, bottom: true, left: true },
                    visited: false
                });
            }
        }

        function index(x, y) {
            if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
            return x + y * cols;
        }

        function getNeighbors(cell) {
            const neighbors = [];
            const { x, y } = cell;

            const top = grid[index(x, y - 1)];
            const right = grid[index(x + 1, y)];
            const bottom = grid[index(x, y + 1)];
            const left = grid[index(x - 1, y)];

            if (top && !top.visited) neighbors.push(top);
            if (right && !right.visited) neighbors.push(right);
            if (bottom && !bottom.visited) neighbors.push(bottom);
            if (left && !left.visited) neighbors.push(left);

            return neighbors;
        }

        function removeWalls(a, b) {
            const dx = a.x - b.x;
            const dy = a.y - b.y;

            if (dx === 1) {
                a.walls.left = false;
                b.walls.right = false;
            } else if (dx === -1) {
                a.walls.right = false;
                b.walls.left = false;
            }

            if (dy === 1) {
                a.walls.top = false;
                b.walls.bottom = false;
            } else if (dy === -1) {
                a.walls.bottom = false;
                b.walls.top = false;
            }
        }

        let current = grid[0];
        current.visited = true;

        while (true) {
            const neighbors = getNeighbors(current);

            if (neighbors.length > 0) {
                stack.push(current);
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                removeWalls(current, next);
                next.visited = true;
                current = next;
            } else if (stack.length > 0) {
                current = stack.pop();
            } else {
                break;
            }
        }
    } else {
        rows = grid.length / cols;
    }

    const width = cols * cellSize;
    const height = rows * cellSize;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const start = grid[0];
    const end = grid[grid.length - 1];

    function index(x, y) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
        return x + y * cols;
    }

    function solveMaze() {
        const queue = [start];
        const visited = new Set([index(start.x, start.y)]);
        const parent = {};

        while (queue.length > 0) {
            const cell = queue.shift();
            if (cell === end) break;

            const { x, y, walls } = cell;

            const moves = [
                !walls.top && grid[index(x, y - 1)],
                !walls.right && grid[index(x + 1, y)],
                !walls.bottom && grid[index(x, y + 1)],
                !walls.left && grid[index(x - 1, y)]
            ];

            for (const next of moves) {
                if (!next) continue;
                const idx = index(next.x, next.y);
                if (!visited.has(idx)) {
                    visited.add(idx);
                    parent[idx] = cell;
                    queue.push(next);
                }
            }
        }

        const path = [];
        let cur = end;
        while (cur !== start) {
            path.push(cur);
            const parentIndex = index(cur.x, cur.y);
            if (!parent[parentIndex]) break;
            cur = parent[parentIndex];
        }
        path.push(start);
        return path.reverse();
    }

    const solutionPath = solveMaze();

    function getSolutionCode(path) {
        let code = "";
        for (let i = 0; i < path.length - 1; i++) {
            const a = path[i];
            const b = path[i + 1];
            if (b.x === a.x + 1) code += "r";
            else if (b.x === a.x - 1) code += "l";
            else if (b.y === a.y + 1) code += "d";
            else if (b.y === a.y - 1) code += "u";
        }
        return code;
    }

    const solutionCode = getSolutionCode(solutionPath);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (progressPath && progressPath.length > 1) {
        ctx.strokeStyle = "rgba(255,235,59,0.8)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        for (let i = 0; i < progressPath.length; i++) {
            const cell = progressPath[i];
            const cx = cell.x * cellSize + cellSize / 2;
            const cy = cell.y * cellSize + cellSize / 2;
            
            if (i === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }
    
    if (highlightPath && highlightPath.length > 1) {
        ctx.strokeStyle = "rgba(76,175,80,0.7)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        for (let i = 0; i < highlightPath.length; i++) {
            const cell = highlightPath[i];
            const cx = cell.x * cellSize + cellSize / 2;
            const cy = cell.y * cellSize + cellSize / 2;
            
            if (i === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }

    if (wrongPath && wrongPath.length > 1) {
        ctx.strokeStyle = "rgba(244,67,54,0.7)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        for (let i = 0; i < wrongPath.length; i++) {
            const cell = wrongPath[i];
            const cx = cell.x * cellSize + cellSize / 2;
            const cy = cell.y * cellSize + cellSize / 2;
            
            if (i === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }

    ctx.fillStyle = "#d0d0d0";
    const markerSize = cellSize * 0.15;
    grid.forEach(cell => {
        const cx = cell.x * cellSize + cellSize / 2;
        const cy = cell.y * cellSize + cellSize / 2;
        ctx.fillRect(cx - markerSize / 2, cy - markerSize / 2, markerSize, markerSize);
    });

    ctx.font = `${Math.floor(cellSize * 0.7)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#87a8f2";
    ctx.fillRect(start.x * cellSize, start.y * cellSize, cellSize, cellSize);
    ctx.fillStyle = "#000000";
    ctx.fillText("A", start.x * cellSize + cellSize / 2, start.y * cellSize + cellSize / 2);

    ctx.fillStyle = "#f28b82";
    ctx.fillRect(end.x * cellSize, end.y * cellSize, cellSize, cellSize);
    ctx.fillStyle = "#000000";
    ctx.fillText("B", end.x * cellSize + cellSize / 2, end.y * cellSize + cellSize / 2);

    if (currentPosition) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(currentPosition.x * cellSize + cellSize / 2, currentPosition.y * cellSize + cellSize / 2, cellSize * 0.4, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();
        ctx.stroke();
    }

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    grid.forEach(cell => {
        const x = cell.x * cellSize;
        const y = cell.y * cellSize;
        const w = cell.walls;

        if (w.top) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke();
        }
        if (w.right) {
            ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke();
        }
        if (w.bottom) {
            ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke();
        }
        if (w.left) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); ctx.stroke();
        }
    });

    return {
        image: canvas.createPNGStream(),
        solution: solutionCode,
        solutionPath,
        grid,
        cols
    };
}

function trans(emos) {
    return emos
        .replace(/⬆️/gi, "u")
        .replace(/➡️/gi, "r")
        .replace(/⬇️/gi, "d")
        .replace(/⬅️/gi, "l");
}

function getPathFromCode(code, grid, cols, startCell) {
    const rows = grid.length / cols;
    const path = [startCell];
    let current = startCell;

    function index(x, y) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
        return x + y * cols;
    }

    for (const move of code) {
        let nx = current.x;
        let ny = current.y;

        if (move === "u") ny--;
        if (move === "d") ny++;
        if (move === "l") nx--;
        if (move === "r") nx++;

        const idx = index(nx, ny);
        
        if (idx === -1) return path;

        const next = grid[idx];
        const valid =
            (move === "u" && !current.walls.top) ||
            (move === "d" && !current.walls.bottom) ||
            (move === "l" && !current.walls.left) ||
            (move === "r" && !current.walls.right);

        if (!valid) return path;

        path.push(next);
        current = next;
    }

    return path;
}

function isPartialSolutionCorrect(userPath, solutionPath, fullCode) {
    if (userPath.length !== fullCode.length + 1) return false;

    for (let i = 0; i < userPath.length; i++) {
        if (!solutionPath[i] || userPath[i].x !== solutionPath[i].x || userPath[i].y !== solutionPath[i].y) {
            return false;
        }
    }
    return true;
}

exports.onStart = async ({ args, message, event, commandName }) => {
    let difficultyLevel = 8;
    let difficultyMessage = "Medium";

    if (args.length > 0) {
        const input = args[0].toLowerCase();
        const inputNumber = parseInt(input);

        if (!isNaN(inputNumber)) {
            difficultyLevel = Math.max(1, Math.min(10, inputNumber));
            difficultyMessage = `Level ${difficultyLevel}`;
        } else if (input === 'easy') {
            difficultyLevel = 4;
            difficultyMessage = "Easy (Level 4)";
        } else if (input === 'medium') {
            difficultyLevel = 8;
            difficultyMessage = "Medium (Level 8)";
        } else if (input === 'hard') {
            difficultyLevel = 13;
            difficultyMessage = "Hard (Level 13)";
        }
    }

    const data = generateMazeImage(difficultyLevel);
    
    const imagePath = path.join(__dirname, global.utils.randomString(4) + ".png");
    
    const writeStream = fs.createWriteStream(imagePath);
    data.image.pipe(writeStream);

    await new Promise((resolve) => writeStream.on('finish', resolve));

    const reply = await message.reply({
        body: `🧩 Solve the maze! Difficulty: ${difficultyMessage}\n\n• Send your path in one message (e.g., ➡️➡️⬇️...)\n• A is the start, B is the end.\n• You have 3 attempts for wrong answers.`,
        attachment: fs.createReadStream(imagePath)
    });
    
    fs.unlinkSync(imagePath);

    global.GoatBot.onReply.set(reply.messageID, {
        commandName,
        au: event.senderID,
        solution: data.solution,
        solutionPath: data.solutionPath,
        grid: data.grid,
        cols: data.cols,
        attempts: 0,
        currentProgress: "",
        currentPosition: data.grid[0],
        // Store the final calculated difficulty level for reward scaling
        finalDifficulty: difficultyLevel 
    });
};

exports.onReply = async ({ message, event, Reply, usersData }) => {
    const { au, solution, solutionPath, grid, cols, currentProgress, finalDifficulty } = Reply;
    if (event.senderID !== au) return;

    const userEmoji = event.body.trim();
    const userCode = trans(userEmoji);
    
    if (!/^[urdl⬆️➡️⬇️⬅️]+$/i.test(userEmoji)) {
        return message.reply(`Please only use valid move emojis (⬆️ ➡️ ⬇️ ⬅️) or their corresponding letters (u, r, d, l) in one sequence.`);
    }
    if (!/^[urdl]+$/i.test(userCode)) {
        return message.reply(`Please only use valid move emojis (⬆️ ➡️ ⬇️ ⬅️) or their corresponding letters (u, r, d, l) in one sequence.`);
    }

    const fullCode = currentProgress + userCode;
    const startCell = grid[0];

    const userPath = getPathFromCode(fullCode, grid, cols, startCell);

    const isCorrectContinuation = isPartialSolutionCorrect(userPath, solutionPath, fullCode);

    if (isCorrectContinuation && userPath.length === solutionPath.length) {
        // Dynamic Reward Calculation: Base 20000 / 8 * finalDifficulty
        // Minimum reward is set to 2500 (1 * 2500)
        const baseCoinPerLevel = 2500; 
        const rewardAmount = Math.max(2500, Math.floor(baseCoinPerLevel * (finalDifficulty || 8))); 
        
        try {
            const userData = await usersData.get(event.senderID);
            await usersData.set(event.senderID, {
                money: userData.money + rewardAmount,
                exp: userData.exp,
                data: userData.data
            });
            
            const data = generateMazeImage(15, grid, cols, solutionPath, null);
            
            const imagePath = path.join(__dirname, global.utils.randomString(4) + ".png");
            const writeStream = fs.createWriteStream(imagePath);
            data.image.pipe(writeStream);
            await new Promise((resolve) => writeStream.on('finish', resolve));

            await message.reply({
                body: `🎉 Correct! You solved the maze and earned $${rewardAmount.toLocaleString()}! The solution is shown in green.`,
                attachment: fs.createReadStream(imagePath)
            });
            fs.unlinkSync(imagePath);
            global.GoatBot.onReply.delete(event.messageID);
        } catch (e) {
             message.reply(`🎉 You solved the maze! (Error crediting money: ${e.message})`);
             global.GoatBot.onReply.delete(event.messageID);
        }
        return;
    }
    
    if (isCorrectContinuation) {
        // CORRECT CONTINUATION
        const currentCell = userPath[userPath.length - 1];
        Reply.currentProgress = fullCode;
        Reply.currentPosition = currentCell;
        Reply.attempts = 0;

        const data = generateMazeImage(5, grid, cols, null, null, currentCell, userPath);
        
        const imagePath = path.join(__dirname, global.utils.randomString(4) + ".png");
        const writeStream = fs.createWriteStream(imagePath);
        data.image.pipe(writeStream);
        await new Promise((resolve) => writeStream.on('finish', resolve));

        global.GoatBot.onReply.delete(event.messageID);

        const newReply = await message.reply({
            body: `✅ Correct path! Continue from your position.\n\n📍 Progress: ${fullCode.length}/${solution.length} moves\n🎯 Keep going to reach point B!`,
            attachment: fs.createReadStream(imagePath)
        });
        fs.unlinkSync(imagePath);
        
        global.GoatBot.onReply.set(newReply.messageID, Reply);
        return;
    }
    
    // WRONG PATH/MOVE
    Reply.attempts++;
    if (Reply.attempts >= 3) {
        // GAME OVER
        const data = generateMazeImage(15, grid, cols, solutionPath, userPath);
        
        const imagePath = path.join(__dirname, global.utils.randomString(4) + ".png");
        const writeStream = fs.createWriteStream(imagePath);
        data.image.pipe(writeStream);
        await new Promise((resolve) => writeStream.on('finish', resolve));

        await message.reply({
            body: `❌ Game over! You ran out of attempts.\n\n✅ Correct solution shown in green\n❌ Your incorrect path shown in red`,
            attachment: fs.createReadStream(imagePath)
        });
        fs.unlinkSync(imagePath);
        global.GoatBot.onReply.delete(event.messageID);
    } else {
        // WRONG MOVE, ATTEMPTS REMAINING
        await message.reply(`❌ Wrong path or move! Try again from your last checkpoint.\n\n🔄 Attempts remaining: ${3 - Reply.attempts}`);
    }
};
