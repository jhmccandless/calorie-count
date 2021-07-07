window.onload = displayClock();
function displayClock() {
  let display = new Date();
  document.querySelector("#date-text").innerHTML = display;
  setTimeout(displayClock, 1000);
}
