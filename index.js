function saveSearch(city) {
  if (city == null ||  city.trim() == "") {
    return;
  }
  
  var data = localStorage.getItem("history");
  if (data == null) {
    data = [];
  }
  else {
    data = JSON.parse(data);
  }

  if (!data.find(function (c) {
    return c == city;
  })) {
    data.unshift(city);
  }

  localStorage.setItem("history", JSON.stringify(data));
}

function updateHistory() {
  var data = localStorage.getItem("history");

  if (data == null) {
    return;
  }

  data = JSON.parse(data);

  var $history = $("<div>");
  
  data.forEach(city => {
    var $button = $("<button>");
    $button.attr("class", "btn btn-default");
    $button.append(city);

    $button.on("click", function() {
      $("#search-term").val(city);
      $("#run-search").click();
    });

    $history.append($button);
  });

  $("#history").append($history);
}

/**
 * pulls information from the form and build the query URL
 * @returns {string} URL for NYT API based on form inputs
 */
function buildCurrentWeatherQuery() {
  // queryURL is the url we'll use to query the API
  var queryURL = "https://api.openweathermap.org/data/2.5/weather?";

  // Begin building an object to contain our API call's query parameters
  // Set the API key
  var queryParams = { "appid": "9302ba6e4398083aafb456d5410b963b" };

  // Grab text the user typed into the search input, add to the queryParams object
  queryParams.q = $("#search-term")
    .val()
    .trim();

  saveSearch(queryParams.q);
  updateHistory();

  queryParams.units = "Imperial"

  // Logging the URL so we have access to it for troubleshooting
  console.log("---------------\nURL: " + queryURL + "\n---------------");
  console.log(queryURL + $.param(queryParams));
  return queryURL + $.param(queryParams);
}

function updateCurrentWeather(data) {
  console.log(data);
  console.log("------------------------------------");

  var $name = $("<h2>");
  var dateObj = new Date(parseInt(data.dt) * 1000);
  var month = dateObj.getUTCMonth() + 1; //months from 1-12
  var day = dateObj.getUTCDate();
  var year = dateObj.getUTCFullYear();
  $name.append(data.name + "(" + month + "/" + day + "/" + year + ")");
  $icon = $("<img>");
  $icon.attr('src', "https://openweathermap.org/img/wn/" + data.weather[0].icon + ".png");
  $name.append($icon);

  var $temp = $("<p>");
  $temp.append("Temperature: " + data.main.temp + " °F");

  var $humidity = $("<p>");
  $humidity.append("Humidity: " + data.main.humidity + "%");

  var $wind = $("<p>");
  $wind.append("Wind speed: " + data.wind.speed + "MPH");

  $("#current_weather").append($name);
  $("#current_weather").append($temp);
  $("#current_weather").append($humidity);
  $("#current_weather").append($wind);

  return {"lat": data.coord.lat, "lon": data.coord.lon};
}

function buildUVIndexQuery(coord) {
  // queryURL is the url we'll use to query the API
  var queryURL = "https://api.openweathermap.org/data/2.5/uvi?";

  var queryParams = { "appid": "9302ba6e4398083aafb456d5410b963b" };

  queryParams.lat = coord.lat;
  queryParams.lon = coord.lon;

  // Logging the URL so we have access to it for troubleshooting
  console.log("---------------\nURL: " + queryURL + "\n---------------");
  console.log(queryURL + $.param(queryParams));
  return queryURL + $.param(queryParams);
}

function updateUVIndex(data) {
  console.log(data);
  console.log("------------------------------------");

  var $uv = $("<p>");
  $uv.append("UV Index: " + data.value)

  $("#current_weather").append($uv);
}

function buildForecastQuery(coord) {
  // queryURL is the url we'll use to query the API
  var queryURL = "https://api.openweathermap.org/data/2.5/onecall?";

  // Begin building an object to contain our API call's query parameters
  // Set the API key
  var queryParams = { "appid": "9302ba6e4398083aafb456d5410b963b" };

  queryParams.lat = coord.lat;
  queryParams.lon = coord.lon;

  queryParams.units = "Imperial"

  queryParams.exclude = "current,minutely,hourly";

  // Logging the URL so we have access to it for troubleshooting
  console.log("---------------\nURL: " + queryURL + "\n---------------");
  console.log(queryURL + $.param(queryParams));
  return queryURL + $.param(queryParams);
}

function updateForecast(data) {

  var i = 0;
  for (i = 0; i < 5; ++i) {
    var dayData = data.daily[i];

    var $date = $("<h4>");
    var dateObj = new Date(parseInt(dayData.dt) * 1000);
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    $date.append(month + "/" + day + "/" + year);
  
    $icon = $("<img>");
    $icon.attr('src', "https://openweathermap.org/img/wn/" + dayData.weather[0].icon + ".png");

    var $temp = $("<p>");
    $temp.append("Temp: " + dayData.temp.day + " °F");
  
    var $humidity = $("<p>");
    $humidity.append("Humidity: " + dayData.humidity + "%");

    var $col = $("<div>");
    $col.attr("class", "col-sm-2");

    $col.append($date);
    $col.append($icon);
    $col.append($temp);
    $col.append($humidity);
    $("#forecast").append($col);
  }
}

// Function to empty out the articles
function clear(clear_history=false) {
    $("#forecast").empty();
    $("#current_weather").empty();
    $("#history").empty();

    if (clear_history) {
      localStorage.removeItem("history");
    }
}

// CLICK HANDLERS
// ==========================================================

// .on("click") function associated with the Search Button
$("#run-search").on("click", function(event) {
  // This line allows us to take advantage of the HTML "submit" property
  // This way we can hit enter on the keyboard and it registers the search
  // (in addition to clicks). Prevents the page from reloading on form submit.
  event.preventDefault();

  // Empty the region associated with the articles
  clear();

  // Build the query URL for the ajax request to the NYT API
  var queryURL = buildCurrentWeatherQuery();

  var coord = {};

  // Make the AJAX request to the API - GETs the JSON data at the queryURL.
  // The data then gets passed as an argument to the updatePage function
  $.ajax({
    url: queryURL,
    method: "GET"
  })
  .then(function (data) {
    coord = updateCurrentWeather(data);
    return coord;
  })
  .then(buildUVIndexQuery)
  .then(function (query) {
    $.ajax({
      url: query,
      method: "GET"
    })
    .then(updateUVIndex)
    .then(function () {
      var forecastURL = buildForecastQuery(coord);
      $.ajax({
        url: forecastURL,
        method: "GET"
      })
      .then(updateForecast);
    });
  });


});
//  .on("click") function associated with the clear button
$("#clear-all").on("click", function() {
  clear(true);
});

updateHistory();

$("#search-term").keypress(function(event){

  if (event.keyCode == 13 || event.which == 13) {
    $('#run-search').click();
}
});
