const CLEAR_COLOUR = "white";
const LEVEL_HEIGHT = innerHeight;
const LEVEL_WIDTH = innerWidth;
const VIEW_LIMIT = 1000;
const FOV = 60;
const SHOULD_RENDER_3D = true;
const TARGET_FPS = 30;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const levelSelectDialogue = document.getElementById("level-select-dialogue");
const levelSelectDialogueFile = document.getElementById("level-file-select");
const fpsCounter = document.getElementById("fps-counter");
const levelSelectDialogueSubmit = document.getElementById("level-select-submit");

let deltaTime = 0;
let frameStartTime = 0;
let actualFps = 0;
let frame = 0;
let levelLines = [];
let player = { x: 150, y: 200, direction: 0 };
let keys = {
	KeyW: false,
	KeyA: false,
	KeyS: false,
	KeyD: false,
	ArrowLeft: false,
	ArrowRight: false,
};

canvas.width = LEVEL_WIDTH;
canvas.height = LEVEL_HEIGHT;


startKeyListener();
loadLevel(level => {
	initLevel(level);
	setInterval(() => {
		deltaTime = performance.now() - frameStartTime;
		frameStartTime = performance.now();
		actualFps = (1 / deltaTime)* 1000;
		gameUpdate();
	}, 1000 / TARGET_FPS);
});

function startKeyListener() {
	addEventListener('keydown', e => {
		if (Object.keys(keys).includes(e.code)) {
			keys[e.code] = true;
			e.preventDefault();
			e.stopPropagation();
		}
	});

	addEventListener('keyup', e => {
		if (Object.keys(keys).includes(e.code)) {
			keys[e.code] = false;
			e.preventDefault();
			e.stopPropagation();
		}
	});
}

function loadLevel(callback) {
	const cachedLevel = localStorage.getItem("FPS_MOST_RECENT_LEVEL");
	if (cachedLevel === null) {
		selectLevel(async file => {
			const contents = await file.text();
			const json = JSON.parse(contents);
			localStorage.setItem("FPS_MOST_RECENT_LEVEL", contents);
			callback(json);
		});
		return;
	}

	const json = JSON.parse(cachedLevel);
	callback(json);
}

function selectLevel(callback) {
	levelSelectDialogue.style.display = "block";
	levelSelectDialogueSubmit.onclick = async _ => {
		const files = levelSelectDialogueFile.files;
		if (files.length === 0) {
			return;
		}
		levelSelectDialogue.style.display = "none";
		callback(files[0]);
	};
}

function initLevel(level) {
	for (const [[x1, y1], [x2, y2]] of level) {
		const yChange = y1 - y2;
		const xChange = x1 - x2;
		const gradient = yChange / xChange;
		const yIntercept = y1 - (gradient * x1);
		const xMin = Math.min(x1, x2);
		const xMax = Math.max(x1, x2);
		const yMin = Math.min(y1, y2);
		const yMax = Math.max(y1, y2);

		levelLines.push((x, y) => {
			if (x > xMax + 1 || x < xMin - 1 || y > yMax + 1 || y < yMin - 1) {
				return false;
			}

			if (x1 === x2) {
				return true;
			}
			const lineY = gradient * x + yIntercept;
			return lineY - 3 < y && lineY + 3 > y;
		});
	}
}

// GAME UPDATE: Called every frame
// Any drawing to the canvas before renderLevel() is called will be cleared.
function gameUpdate() {
	movePlayer();
	updateUI();
	renderLevel();

	frame++;
}

// COLLISION AND MOVEMENT
function movePlayer() {
	if (keys.KeyW) {
		const { x, y } = raycast(player.x, player.y, player.direction, 10, isTouchingLine, false);
		player.x = x;
		player.y = y;
	}
	if (keys.KeyS) {
		const { x, y } = raycast(player.x, player.y, player.direction - 180, 10, isTouchingLine, false);
		player.x = x;
		player.y = y;
	}
	if (keys.KeyA) {
		const { x, y } = raycast(player.x, player.y, player.direction - 90, 10, isTouchingLine, false);
		player.x = x;
		player.y = y;
	}
	if (keys.KeyD) {
		const { x, y } = raycast(player.x, player.y, player.direction + 90, 10, isTouchingLine, false);
		player.x = x;
		player.y = y;
	}
	if (keys.ArrowLeft) {
		player.direction -= 10;
	}
	if (keys.ArrowRight) {
		player.direction += 10;
	}
}

// UI
function updateUI() {
	fpsCounter.innerText = `FPS: ${Math.round(actualFps)}`;
}

// RENDER: Called every frame after calculating movement.
function renderLevel() {
	ctx.clearRect(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
	let x = 0;
	for (let angle = -(FOV / 2); angle <= FOV / 2; angle += 1) {
		const { distance, didCollide } = raycast(player.x, player.y, angle + player.direction, VIEW_LIMIT, isTouchingLine, !SHOULD_RENDER_3D);
		ctx.fillStyle = "blue";
		if (!didCollide) {
			x += LEVEL_WIDTH / FOV;
			continue;
		}
		const wallHeight = 10000 / distance;
		if (SHOULD_RENDER_3D) {
			ctx.fillRect(x, LEVEL_HEIGHT / 2 - wallHeight, LEVEL_WIDTH / FOV + 1, 2 * wallHeight);
		}

		x += LEVEL_WIDTH / FOV;
	}
}

function isTouchingLine(x, y) {
	for (const line of levelLines) {
		if (line(x, y)) {
			return true;
		}
	}

	return false;
}

// RAYCAST
function raycast(originX, originY, angle, maxDistance, isColliding, shouldPaint = false) {
	angle = limitDirection(angle);
	let x = originX;
	let y = originY;
	let prevX;
	let prevY;

	for (let distance = 1; distance <= maxDistance; distance++) {
		prevX = x;
		prevY = y;
		// These trig functions turn "move 1 pixel at this angle" into
		// "move x and y by these distances".
		x += Math.cos(angle * Math.PI / 180); // JS trig functions use radians instead of degrees.
		y += Math.sin(angle * Math.PI / 180);

		if (isColliding(x, y)) {
			return {
				x: prevX,
				y: prevY,
				distance: distance - 1,
				didCollide: true,
			};
		}

		if (shouldPaint) {
			ctx.fillStyle = "green";
			ctx.fillRect(x, y, 1, 1);
		}
	}

	return { x, y, distance: maxDistance, didCollide: false };
}

function limitDirection(direction) {
	while (direction < 0) {
		direction += 360;
	}
	while (direction >= 360) {
		direction -= 360;
	}

	return direction;
}

