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
if (!(messages instanceof HTMLDivElement)) {
	throw new Error("Missing messages Element");
}

const socket = new WebSocket(location.origin.replace(/^http/, 'ws'));

socket.onmessage = function (e) {
	messages.innerText += e.data + "\n";
}

socket.onclose = function () {
	alert("Session was closed");
	location.pathname = "";
}

form.addEventListener("submit", e => {
	socket.send(text.value);

	e.preventDefault();
	return false;
})
