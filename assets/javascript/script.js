// this is developer's api key for Open Weather API
var APIKey = "f219fa35e9f4c85218a1c76c387b3192";

var cityList = document.getElementById("cityList");
var searchBtn = document.getElementById("searchBtn");
var cityInput = document.getElementById("cityInput");
var todayWeather = document.getElementById("todayWeather");
var forecastingWeather = document.getElementById("forecastingWeather");

var cityListJQuery = $('#cityList');

// handling function for search button clicked
searchBtn.addEventListener("click", function() {
    if (cityInput.value == "") return;
    displayWeatherByCityName(cityInput.value);
    cityInput.value = "";
});

// handling function for city button in search history list
cityListJQuery.on('click', '.cityBtn', function(event) {
    var cityBtn = $(event.target);
    var location = getLocationFromLocalStorage(cityBtn[0].textContent);
    if (location.city == "NOT FOUND") displayCityNotFound();
    else displayWeatherByLocation(location);
});

// save a location to the last in local storage
function setLocationToLocalStorage(location) {
    var cities = JSON.parse(localStorage.getItem("cities"));
    if (cities==null) cities = []
    else {
        var iCheck = -1;
        for (var i = 0; i < cities.length; i++) {
            if (cities[i].city == location.city) {
                iCheck = i;
            }
        }
        if (iCheck != -1) cities.splice(iCheck, 1);
    }
    cities.push(location);
    localStorage.setItem("cities", JSON.stringify(cities));    
}

// get location from local storage by its city name
function getLocationFromLocalStorage(cityName) {
    var cities = JSON.parse(localStorage.getItem("cities"));
    var location = { city: "NOT FOUND" };
    if (cities == null) return location;
    for (var i = cities.length-1; i >= 0; i--)
        if (cities[i].city == cityName) return cities[i];
    return location;
}

function displayCityNotFound() {
    todayWeather.innerHTML = "";
    forecastingWeather.innerHTML = "";

    var cityEl = document.createElement("h1");
    cityEl.innerHTML = "CITY NOT FOUND";
    todayWeather.appendChild(cityEl);
}

// diplay city name and today, given city name
function displayCityNameWithDate(cityName) {
    // refresh page
    todayWeather.innerHTML = "";
    forecastingWeather.innerHTML = "";

    var todayDate = moment().format("M/D/YYYY");
    var cityEl = document.createElement("h1");
    cityEl.innerHTML = cityName + " (" + todayDate + ")  ";
    todayWeather.appendChild(cityEl);
}

// display weather, given an array of Daily Weather (array[0]: current weather, array[1-5]: day 1 to 5)
function displayWeather(dailyWeather) {
    var weatherIcon = document.createElement("img");
    var ulElement = document.createElement("ul");
    var tempLi = document.createElement("li");
    var windLi = document.createElement("li");
    var humidityLi = document.createElement("li");
    var uvindexLi = document.createElement("li");
    var uvispan = document.createElement("span");

    /* Displaying Current Weather */
    weatherIcon.src = "http://openweathermap.org/img/wn/"+dailyWeather[0].weather+"@2x.png"
    todayWeather.firstElementChild.appendChild(weatherIcon);

    tempLi.innerHTML = "Temp: " + dailyWeather[0].temp + "°F";
    windLi.innerHTML = "Wind: " + dailyWeather[0].wind + "MPH";
    humidityLi.innerHTML = "Humidity: " + dailyWeather[0].humidity + "%";
    uvindexLi.innerHTML = "UV Index: ";

    var uvi = dailyWeather[0].uvindex;
    uvispan.innerHTML = uvi;
    if (uvi < 3) uvispan.setAttribute("style", "border-radius: 2px; padding: 2px 10px; color: white; background-color: green;");
    else if (uvi < 6) uvispan.setAttribute("style", "border-radius: 2px; padding: 2px 10px; color: black; background-color: yellow;");
    else if (uvi < 8) uvispan.setAttribute("style", "border-radius: 2px; padding: 2px 10px; color: white; background-color: orange;");
    else uvispan.setAttribute("style", "border-radius: 2px; padding: 2px 10px; color: white; background-color: red;");
    
    uvindexLi.appendChild(uvispan);
    
    ulElement.appendChild(tempLi);
    ulElement.appendChild(windLi);
    ulElement.appendChild(humidityLi);
    ulElement.appendChild(uvindexLi);

    todayWeather.appendChild(ulElement);

    /* Displaying Forecasting Weather */
    var forecastingTitle = document.createElement("h1");
    var forecastingUlElement = document.createElement("ul");
    forecastingUlElement.setAttribute("class","flex flex-row");
    forecastingTitle.innerHTML = "5-Day Forecast: "

    for (var i=1; i<= 5; i++) {
        var dailyBlock = document.createElement("div");
        var dateLi = document.createElement("h1");
        var weatherIcon = document.createElement("img");
        var tempLi = document.createElement("li");
        var windLi = document.createElement("li");
        var humidityLi = document.createElement("li");
        
        dateLi.innerHTML = moment().add(i,'days').format("M/D/YYYY");
        weatherIcon.src = "http://openweathermap.org/img/wn/"+dailyWeather[i].weather+"@2x.png"
        tempLi.innerHTML = "Temp: " + dailyWeather[i].temp + "°F";
        windLi.innerHTML = "Wind: " + dailyWeather[i].wind + "MPH";
        humidityLi.innerHTML = "Humidity: " + dailyWeather[i].humidity + "%";

        dailyBlock.setAttribute("class", "dailyblock");
        dailyBlock.appendChild(dateLi);
        dailyBlock.appendChild(weatherIcon);
        dailyBlock.appendChild(tempLi);
        dailyBlock.appendChild(windLi);
        dailyBlock.appendChild(humidityLi);

        forecastingUlElement.appendChild(dailyBlock);
    }

    forecastingWeather.appendChild(forecastingTitle);
    forecastingWeather.appendChild(forecastingUlElement);
}

// fetch data from Geocoding API: convert city name to (lat,lon) to localstorage
async function setNewCityToLocalStorage(cityName) {
    var location = { city: cityName };
    var apiURL = "http://api.openweathermap.org/geo/1.0/direct?q="+cityName+"&limit=1&appid="+APIKey;
    await fetch(apiURL)
        .then(function(response) {
            if (response.status == 200) return response.json();
            else throw `${response.status}`;
        })
        .then(function(data){
            if (data.length !== 0) {
                location['lat'] = data[0].lat;
                location['lon'] = data[0].lon;
                setLocationToLocalStorage(location);
            }
        })
        .catch(function(exception) {
           console.log(exception);
        })
}

// fetch data from One Call API 3.0 (OpenWeather) and display, given location (lat,lon)
function displayWeatherByLocation(location) {
    displayCityNameWithDate(location.city);

    var dailyWeather = [];
    var apiURL = "https://api.openweathermap.org/data/3.0/onecall?lat="+ location.lat + "&lon="+ location.lon +"&units=imperial&exclude=minutely,hourly,alerts&appid="+APIKey;
    fetch(apiURL)
        .then(function(response) {
            if (response.status == 200) return response.json();
            else throw `${response.status}`;
        })
        .then(function(data) {
            dailyWeather.push({
                temp: data.current.temp,
                wind: data.current.wind_speed,
                humidity: data.current.humidity,
                uvindex: data.current.uvi,
                weather: data.current.weather[0].icon   
            });

            for (var i=1; i <= 5; i++ )
                dailyWeather.push({
                    temp: data.daily[i].temp.day,
                    wind: data.daily[i].wind_speed,
                    humidity: data.daily[i].humidity,
                    weather: data.daily[i].weather[0].icon
                });

            displayWeather(dailyWeather);
        })
        .catch((exception) => {
            console.log(exception);
        })
}

// fetch city search history from Local Storage and display as buttons
function refreshSearchHistoryList() {
    var cities = JSON.parse(localStorage.getItem("cities"));
    if (cities ==  null) return;

    cityList.innerHTML = "";
    cities.forEach(aCity => {
        var cityLi = document.createElement("li");
        var cityBtn = document.createElement("button");

        cityBtn.setAttribute("class", "cityBtn");
        cityBtn.innerHTML = aCity.city;

        cityLi.appendChild(cityBtn);
        cityList.appendChild(cityLi);
    });
}

async function displayWeatherByCityName(cityName) {
    cityName = cityName.toLowerCase();
    await setNewCityToLocalStorage(cityName);
    // location {cityName, lat, lon}
    var location = getLocationFromLocalStorage(cityName);
    if (location.city == "NOT FOUND") displayCityNotFound();
    else displayWeatherByLocation(location);
    refreshSearchHistoryList();
}

function init() {
    refreshSearchHistoryList();
}

init();