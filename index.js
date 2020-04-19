// @ts-check

import ws from "ws"
import { createServer } from "http"
import express from "express"
import e from "express"
var app = express()
var port = process.env.PORT || 5000

app.use(express.static("public"))

var server = createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var wss = new ws.Server({ server: server })
console.log("websocket server created")

wss.on("connection", function (ws) {
	var id = setInterval(function () {
		ws.send(JSON.stringify(new Date()), function () { })
	}, 1000)

	console.log("websocket connection open")

	ws.on("close", function () {
		console.log("websocket connection close")
		clearInterval(id)
	})
})
