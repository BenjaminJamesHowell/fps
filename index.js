const CLEAR_COLOUR = "white";
const LEVEL_HEIGHT = 500;
const LEVEL_WIDTH = 500;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const fps = 60;

canvas.width = LEVEL_WIDTH;
canvas.height = LEVEL_HEIGHT;

// y = 5x + 1
const lines = [
	x => x - 100,
	x => x + 100,
	_ => 50,
	_ => 400,
];
let player = { x: 150, y: 200 };
const keys = {
	KeyW: false,
	KeyA: false,
	KeyS: false,
	KeyD: false,
};

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
}

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

function gameUpdate() {
	movePlayer();
	renderLevel();
}

startKeyListener();
setInterval(gameUpdate, 1000 / fps);

