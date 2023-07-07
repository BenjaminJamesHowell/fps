const CLEAR_COLOUR = "white";
const LEVEL_HEIGHT = 500;
const LEVEL_WIDTH = 500;

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

// COLLISION: It's really janky
function movePlayer() {
	if (keys.KeyW) {
		tryMovePlayerY(-3);
	}
	if (keys.KeyS) {
		tryMovePlayerY(3);
	}
	if (keys.KeyA) {
		tryMovePlayerX(-3);
	}
	if (keys.KeyD) {
		tryMovePlayerX(3);
	}
	if (keys.ArrowLeft) {
		player.direction--;
	}
	if (keys.ArrowRight) {
		player.direction++;
	}
}

function tryMovePlayerX(distance) {
	if (distance === 0) {
		return;
	}

	let allowedDistance = 0;

	if (distance > 0) {
		for (let x = player.x; x <= player.x + distance; x++) {
			if (isTouchingLine(x + 1, player.y)) {
				break;
			}

			allowedDistance++;
		}
	} else {
		for (let x = player.x; x >= player.x + distance; x--) {
			if (isTouchingLine(x - 1, player.y)) {
				break;
			}

			allowedDistance--;
		}
	}

	player.x += allowedDistance;
}


function tryMovePlayerY(distance) {
	if (distance === 0) {
		return;
	}

	let allowedDistance = 0;

	if (distance > 0) {
		for (let y = player.y; y <= player.y + distance; y++) {
			if (isTouchingLine(player.x, y + 1)) {
				break;
			}

			allowedDistance++;
		}
	} else {
		for (let y = player.y; y >= player.y + distance; y--) {
			if (isTouchingLine(player.x, y - 1)) {
				break;
			}

			allowedDistance--;
		}
	}

	player.y += allowedDistance;
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
	ctx.fillStyle = "red";
	for (let x = 0; x <= LEVEL_WIDTH; x++) {
		for (const line of lines) {
			const y = line(x);
			ctx.fillRect(x, y, 1, 1);
		}
	}

	ctx.fillStyle = "blue";
	ctx.fillRect(player.x, player.y, 1, 1);
	for (let angle = -60; angle <= 60; angle += 5) {
		raycast(player.x, player.y, angle + player.direction, 1000, isTouchingLine, true);
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
			};
		}

		if (shouldPaint) {
			ctx.fillStyle = "green";
			ctx.fillRect(x, y, 1, 1);
		}
	}

	return { x, y };
}
