"use strict";

window.onload = displayClock();
function displayClock() {
  let display = new Date().toLocaleString("en-US", {
    weekday: "long",
    day: "numeric",
    year: "numeric",
    month: "long",
    hour: "numeric",
    minute: "numeric",
  });
  document.querySelector("#date-text").innerHTML = display;
  setTimeout(displayClock, 1000);
}
