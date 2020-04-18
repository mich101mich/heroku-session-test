// @ts-check

const username = document.getElementById("username");
if (!(username instanceof HTMLInputElement) || username.type != "text") {
	throw new Error("Missing username Element");
}

const session = document.getElementById("session");
if (!(session instanceof HTMLInputElement) || session.type != "text") {
	throw new Error("Missing session Element");
}

const sessionForm = document.getElementById("sessionForm");
if (!(sessionForm instanceof HTMLFormElement)) {
	throw new Error("Missing sessionForm Element");
}

sessionForm.addEventListener("submit", e => {
	sessionForm.action = `/session/${session.value}/${username.value}`;
})

