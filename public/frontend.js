"use strict";

if (document.querySelector("#date-text")) {
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
}

if (document.querySelector("#food-form-div")) {
  let currentYear = new Date().toLocaleString("en-US", {
    year: "numeric",
  });

  for (let i = 1; i <= 12; i++) {
    let updatedNumber = i.toLocaleString("en-US", {
      minimumIntegerDigits: 2,
    });
    document.querySelector(
      "#user_input_month"
    ).innerHTML += `<option value="${updatedNumber}">${updatedNumber}</option>`;
  }
  for (let i = 1; i <= 31; i++) {
    let updatedNumber = i.toLocaleString("en-US", {
      minimumIntegerDigits: 2,
    });
    document.querySelector(
      "#user_input_day"
    ).innerHTML += `<option value="${updatedNumber}">${updatedNumber}</option>`;
  }
  for (let i = 2019; i <= currentYear; i++) {
    document.querySelector(
      "#user_input_year"
    ).innerHTML += `<option value="${i}">${i}</option>`;
  }
  for (let i = 1; i <= 12; i++) {
    let updatedNumber = i.toLocaleString("en-US", {
      minimumIntegerDigits: 2,
    });
    document.querySelector(
      "#user_input_hour"
    ).innerHTML += `<option value="${updatedNumber}">${updatedNumber}</option>`;
  }
  for (let i = 0; i <= 59; i++) {
    let updatedNumber = i.toLocaleString("en-US", {
      minimumIntegerDigits: 2,
    });
    document.querySelector(
      "#user_input_minute"
    ).innerHTML += `<option value="${updatedNumber}">${updatedNumber}</option>`;
  }
  document.querySelector(
    "#user_input_ap"
  ).innerHTML += `<option value="AM">AM</option>`;
  document.querySelector(
    "#user_input_ap"
  ).innerHTML += `<option value="PM">PM</option>`;
}
