const CLEAR_COLOUR = "white";
const LEVEL_HEIGHT = innerHeight;
const LEVEL_WIDTH = innerWidth;
const VIEW_LIMIT = 1000;
const FOV = 60;
const SHOULD_RENDER_3D = true;
const LEVEL_URLS = [
	"./levels/test.json",
	"./levels/test2.json",
	"./levels/empty.json",
];
const MENUS = {
	NONE: undefined,
	PAUSE: "pause",
	SELECT_LEVEL: "select_level",
};
const IMAGE_URLS = {
	wall: "./images/wall.png"
};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const fpsCounter = document.getElementById("fps-counter");
const images = {};

const menuElements = {
	dialogueRoot: document.getElementById("dialogue-root"),
	select_level: {
		dialogue: document.getElementById("level-select-dialogue"),
		fileInput: document.getElementById("level-file-select"),
		submitButton: document.getElementById("level-select-submit"),
	},
	pause: {
		dialogue: document.getElementById("pause-dialogue"),
		selectLevelButton: document.getElementById("pause-select-level-button")
	}
};

let deltaTime = 0;
let frameStartTime = 0;
let actualFps = 0;
let frame = 0;
let levelLines = [];
let levelCache = {};
let player = { x: 0, y: 0, direction: 0 };
let keys = {
	KeyW: false,
	KeyA: false,
	KeyS: false,
	KeyD: false,
	ArrowLeft: false,
	ArrowRight: false,
};
let isPaused = false;
let menu = undefined;

canvas.width = LEVEL_WIDTH;
canvas.height = LEVEL_HEIGHT;

startKeyListener();
loadTextures();
loadLevel(LEVEL_URLS[0])
	.then(level => {
		initLevel(level);
		requestAnimationFrame(gameUpdate);
	});

function startKeyListener() {
	addEventListener('keydown', e => {
		if (Object.keys(keys).includes(e.code)) {
			keys[e.code] = true;
			e.preventDefault();
			e.stopPropagation();
		}

		if (e.code === "KeyE") {
			togglePause();
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

function loadTextures() {
	for (const imageName in IMAGE_URLS) {
		const image = new Image();
		image.src = IMAGE_URLS[imageName];
		images[imageName] = image;
	}
}

function togglePause() {
	if (isPaused) {
		unpause();
	} else {
		pause();
	}
}

function pause() {
	isPaused = true;
	openMenu(MENUS.PAUSE);
}

function unpause() {
	isPaused = false;
	requestAnimationFrame(gameUpdate);
	openMenu(MENUS.NONE);
}

function openMenu(newMenu) {
	switch (newMenu) {
		case MENUS.NONE: {
			closeAllMenuElements();
			menu = MENUS.NONE;
			isPaused = false;
			break;
		}
		case MENUS.PAUSE: {
			closeAllMenuElements();
			menu = MENUS.PAUSE;
			openAllMenuElements(MENUS.PAUSE);
			menuElements.pause.selectLevelButton.onclick = _ => {
				openMenu(MENUS.SELECT_LEVEL);
			};
			break;
		}

		case MENUS.SELECT_LEVEL: {
			closeAllMenuElements();
			menu = MENUS.SELECT_LEVEL;
			openAllMenuElements(MENUS.SELECT_LEVEL);
			menuElements.select_level.submitButton.onclick = async _ => {
				const files = menuElements.select_level.fileInput.files;
				if (files.length !== 1) {
					return;
				}
				const file = files[0];
				const contents = await file.text();
				const json = JSON.parse(contents);

				initLevel(json);
				unpause();
			};

			const levelButtons = menuElements.select_level.dialogue.querySelectorAll(".level-select");
			console.log(levelButtons);
			for (const button of levelButtons) {
				button.onclick = async _ => {
					const level = await loadLevel(button.getAttribute("data-level"));
					initLevel(level);
					unpause();
				};
			}
			break;
		}
	}
}

function closeAllMenuElements() {
	menuElements.dialogueRoot.style.display = "none";
	if (menu === MENUS.NONE) {
		return;
	}

	menuElements[menu].dialogue.style.display = "none";
}

function openAllMenuElements(newMenu) {
	menuElements.dialogueRoot.style.display = "block";
	if (newMenu === MENUS.NONE) {
		return;
	}

	menuElements[newMenu].dialogue.style.display = "block";
}

async function loadLevel(path) {
	if (levelCache[path] !== undefined) {
		return JSON.parse(levelCache[path]);
	}

	const file = await (await fetch(path)).text();
	levelCache[path] = file;

	return JSON.parse(file);
}

function initLevel(level) {
	levelLines = [];
	player = { x: level.startingX, y: level.startingY, direction: level.startingDirection };
	for (const [[x1, y1], [x2, y2]] of level.lines) {
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
function gameUpdate(now) {
	deltaTime = now - frameStartTime;
	frameStartTime = now;
	actualFps = (1 / deltaTime) * 1000;

	movePlayer();
	updateUI();
	renderLevel();

	frame++;
	if (!isPaused) {
		requestAnimationFrame(gameUpdate);
	}
}

// COLLISION AND MOVEMENT
function movePlayer() {
	const speed = Math.round(10 * deltaTime * 0.01);
	if (keys.KeyW) {
		const { x, y } = raycast(player.x, player.y, player.direction, speed, isTouchingLine, false);
		player.x = x;
		player.y = y;
	}
	if (keys.KeyS) {
		const { x, y } = raycast(player.x, player.y, player.direction - 180, speed, isTouchingLine, false);
		player.x = x;
		player.y = y;
	}
	if (keys.KeyA) {
		const { x, y } = raycast(player.x, player.y, player.direction - 90, speed, isTouchingLine, false);
		player.x = x;
		player.y = y;
	}
	if (keys.KeyD) {
		const { x, y } = raycast(player.x, player.y, player.direction + 90, speed, isTouchingLine, false);
		player.x = x;
		player.y = y;
	}
	if (keys.ArrowLeft) {
		player.direction -= speed;
	}
	if (keys.ArrowRight) {
		player.direction += speed;
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
			ctx.fillStyle = `hsl(0, 0%, ${Math.max(20, Math.min(80, Math.floor(wallHeight)))}%)`;
			ctx.fillRect(
				x,
				LEVEL_HEIGHT / 2 - wallHeight,
				LEVEL_WIDTH / FOV + 1,
				2 * wallHeight,
			);
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

