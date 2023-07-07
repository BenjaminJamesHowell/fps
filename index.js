const CLEAR_COLOUR = "white";
const LEVEL_HEIGHT = 500;
const LEVEL_WIDTH = 500;
const VIEW_LIMIT = 1000;
const FOV = 60;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const fps = 30;

canvas.width = LEVEL_WIDTH;
canvas.height = LEVEL_HEIGHT;

// y = 5x + 1
const lines = [
	x => x - 100,
	x => x + 100,
	_ => 50,
	_ => 400,
];
let player = { x: 150, y: 200, direction: 0 };
const keys = {
	KeyW: false,
	KeyA: false,
	KeyS: false,
	KeyD: false,
	ArrowLeft: false,
	ArrowRight: false,
};

startKeyListener();
setInterval(gameUpdate, 1000 / fps);

function startKeyListener() {
	addEventListener('keydown', ({code}) => {
		if (Object.keys(keys).includes(code)) {
			keys[code] = true;
		}
	});

	addEventListener('keyup', ({code}) => {
		if (Object.keys(keys).includes(code)) {
			keys[code] = false;
		}
	});
}

// GAME UPDATE: Called every frame
// Any drawing to the canvas before renderLevel() is called will be cleared.
function gameUpdate() {
	movePlayer();
	renderLevel();
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

function isTouchingLine(x, y) {
	for (const line of lines) {
		const lineY = line(x);
		const isTouchingLine = lineY < y + 3 && lineY > y - 3;

		if (isTouchingLine) {
			return true;
		}
	}

	return false;
}

// RENDER: Called every frame after calculating movement.
function renderLevel() {
	ctx.clearRect(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
	let x = 0;
	for (let angle = -(FOV / 2); angle <= FOV / 2; angle += 1) {
		const { distance } = raycast(player.x, player.y, angle + player.direction, VIEW_LIMIT, isTouchingLine);
		const wallHeight = 4000 / distance;
		ctx.fillStyle = "blue";
		ctx.fillRect(x, wallHeight, LEVEL_WIDTH / FOV + 1, 2 * wallHeight);

		x += LEVEL_WIDTH / FOV;
	}
}

function isTouchingLine(x, y) {
	for (const line of lines) {
		const lineY = line(x);
		if (lineY + 1 > y && lineY - 1 < y) {
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
			};
		}

		if (shouldPaint) {
			ctx.fillStyle = "green";
			ctx.fillRect(x, y, 1, 1);
		}
	}

	return { x, y, distance: maxDistance };
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

