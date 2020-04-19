// @ts-check

const text = document.getElementById("text");
if (!(text instanceof HTMLInputElement) || text.type != "text") {
	throw new Error("Missing text Element");
}

const form = document.getElementById("form");
if (!(form instanceof HTMLFormElement)) {
	throw new Error("Missing form Element");
}

const messages = document.getElementById("messages");
if (!(messages instanceof HTMLTableElement)) {
	throw new Error("Missing messages Element");
}

const socket = new WebSocket(location.origin.replace(/^http/, 'ws'));
socket.onopen = function () {
	socket.send(location.pathname.substr(1));
}

socket.onmessage = function (e) {
	const tr = document.createElement("tr");
	tr.innerHTML = e.data;
	messages.appendChild(tr);
}

socket.onclose = function (event) {
	console.log("event", event);
	if (event.reason) {
		alert(event.reason);
	} else {
		alert("Session was closed");
	}
	location.pathname = "";
}

form.addEventListener("submit", e => {
	socket.send(text.value);

	e.preventDefault();
	return false;
})
