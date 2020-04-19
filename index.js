// @ts-check

import ws from "ws"
import http from "http"
import express from "express"
import xssEscape from "xss-escape";
const port = process.env.PORT || 5000;

/** @type { { [x: string]: { [name: string]: ws} } } */
const sessions = {};
/**
 * @param {string} sid
 * @returns {number}
 */
function countSession(sid) {
	let count = 0;
	for (const _user in sessions[sid]) {
		count += 1;
	}
	return count;
}

const app = express();
app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile("views/index.html", { root: "." }));

app.get("/session/:sid/:user", (req, res) => res.sendFile("views/session.html", { root: "." }));

const server = http.createServer(app);
server.listen(port, () => console.log("http server listening on %d", port));

const wss = new ws.Server({ server: server });
console.log("websocket server created");

wss.on("connection", function (ws) {
	/** @type {string} */
	let sid;
	/** @type {string} */
	let user;
	/** @type {string} */
	let color;
	/** @type {{ [name: string]: ws}} */
	let session;

	ws.on("message", data => {
		const message = data.toString();
		if (!sid) {
			[, sid, user] = message.split("/");
			color = colorFromName(user);
			if (!(sid in sessions)) {
				console.log(`creating ${sid}`);
				sessions[sid] = {};
			}
			session = sessions[sid];
			if (user in session) {
				console.log(`${user} tried to join ${sid} twice`);
				sid = undefined;
				ws.close(1000, `User "${user}" is already in this Session`);
				return;
			}
			session[user] = ws;
			console.log(`${user} joined ${sid} => ${countSession(sid)} participants`);
		} else {
			const now = new Date();
			const time = `[${leftPad(now.getHours(), "0", 2)}:${leftPad(now.getMinutes(), "0", 2)}]`;
			for (const name in session) {
				session[name].send(`<td style="color:${color}">${user}</td><td>${time}</td><td>${xssEscape(message)}</td>`);
			}
		}
	});

	ws.on("close", function () {
		if (sid) {
			delete session[user];
			const count = countSession(sid);
			console.log(`${user} left ${sid} => ${count} participants remaining`);
			if (count == 0) {
				console.log(`closing ${sid}`);
				delete sessions[sid];
			}
		}
	});
});

/**
 * @param {string} name 
 * @returns {string}
 */
function colorFromName(name) {
	const r = name.substr(0, name.length / 3);
	const g = name.substr(name.length / 3, name.length / 3);
	const b = name.substr(2 * name.length / 3);

	return "#" + [r, g, b]
		.map(s => [...s].reduce((col, c) => (col * 3 + parseInt(c, 36) * 13) % 256, 128))
		.map(num => hexNumber(num))
		.join("");
}

/**
 * @param {number} num
 * @returns {string}
 */
function hexNumber(num) {
	return leftPad(num.toString(16), "0", 2);
}

/**
 * @param {any} s
 * @param {string} c
 * @param {number} length
 */
function leftPad(s, c, length) {
	let padding = c;
	for (let i = 0; i < length; i++);
	padding += c;

	const padded = padding + s.toString();
	return padded.substr(padded.length - length);
}
