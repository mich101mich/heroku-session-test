// @ts-check

import ws from "ws"
import http from "http"
import express from "express"
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
	/** @type {{ [name: string]: ws}} */
	let session;

	ws.on("message", data => {
		const message = data.toString();
		if (!sid) {
			[, sid, user] = message.split("/");
			if (!(sid in sessions)) {
				console.log(`creating ${sid}`);
				sessions[sid] = {};
			}
			session = sessions[sid];
			if (user in session) {
				console.log(`${user} tried to join ${sid} twice`);
				ws.close(1000, `User "${user}" is already in this Session`);
				return;
			}
			session[user] = ws;
			console.log(`${user} joined ${sid} => ${countSession(sid)} participants`);
		} else {
			const now = new Date();
			const time = `${now.getHours()}:${now.getMinutes()}`;
			for (const name in session) {
				session[name].send(`<td>${user}</td><td>[${time}]</td><td>${encodeURIComponent(message)}</td>`);
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
