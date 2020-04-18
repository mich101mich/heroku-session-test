// @ts-check

import express from "express"
import expressWs from "express-ws";
import https from "https";
import fs from "fs";
const PORT = process.env.PORT || 5000

/** @type { { [x: string]: { [name: string]: WebSocket} } } */
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

console.log("process.env.LOCAL", process.env.LOCAL);

let server;
if (process.env.LOCAL) {
	const privateKey = fs.readFileSync('ssl/server.key', 'utf8');
	const certificate = fs.readFileSync('ssl/server.cert', 'utf8');

	const credentials = { key: privateKey, cert: certificate };

	server = https.createServer(credentials, app);
} else {
	server = https.createServer(app);
}

console.log(server);

expressWs(app, server);

app.use(express.static("public"))

app.get("/", (req, res) => res.sendFile("views/index.html", { root: "." }));

app.get("/session/:sid/:user", (req, res) => res.sendFile("views/session.html", { root: "." }));

// @ts-ignore
app.ws("/session/:sid/:user", function (ws, req) {
	const sid = req.params.sid;
	const user = req.params.user;
	if (!(sid in sessions)) {
		sessions[sid] = {};
	}
	const session = sessions[sid];
	if (user in session) {
		ws.close();
		console.log(`${user} tried to connect to ${sid} twice`);
		return;
	}
	session[user] = ws;
	console.log(`added ${user} to ${sid} => ${countSession(sid)} participants`);

	ws.on("message", function (msg) {
		msg = `${user}: ${msg}`
		for (const name in sessions[sid]) {
			sessions[sid][name].send(msg);
		}
	});

	ws.on("close", () => {
		delete sessions[sid][user];
		const remaining = countSession(sid);
		console.log(`removed ${user} from ${sid} => ${remaining} participants`);
		if (remaining == 0) {
			delete sessions[sid];
			console.log(`closing ${sid}`);
		}
	})
});

// app.listen(PORT, () => console.log(`Listening on ${PORT}`))

server.listen(PORT, () => console.log(`Listening on ${PORT}`));

