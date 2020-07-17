const url = "https://disease.sh/v2/countries";
let markers = [];
let countries;
let map;
let recoveryRate;
let fatalityRate;
let globalCountryData;
let mapCircles = [];
var casesTypeColors = {
  cases: "#3e444a",
  active: "#f9a825",
  recovered: "#00C853",
  deaths: "#fc3c3c",
};
//var infoWindow;

// Initialize and add the map
window.onload = () => {
  getCountryData();
  getHistoricalData();
  // buildPieChart();
  getCurrentData();
  // calcRecoveryRate();
};

function initMap() {
  // The location of Germany
  var germany = { lat: 51.1657, lng: 10.4515 };
  // The map, centered at Germany
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 3,
    styles: mapStyle,
    center: germany,
  });

  //infoWindow = new google.maps.InfoWindow();
  // The marker, positioned at germany
  //var marker = new google.maps.Marker({ position: germany, map: map });
  //searchCountries(url, countries);
  // //Get JSON Data
}

const changeDataSelection = (casesType) => {
  clearTheMap();
  showDataOnMap(globalCountryData, casesType);
};

const clearTheMap = () => {
  for (let circle of mapCircles) {
    circle.setMap(null);
  }
};

const getCountryData = () => {
  fetch("https://disease.sh/v2/countries")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      globalCountryData = data;
      showDataOnMap(data);
      showDataInTable(data);
      console.log(globalCountryData);
    });
};

const getCurrentData = () => {
  fetch("https://disease.sh/v2/all?yesterday=false")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      // console.log(data);
      // let chartData = buildPieChartData(data);
      // buildPieChart(data);
      updateCurrentTabs(data);
      calcRecoveryRate(data);
      calcFatalityRate(data);
    });
};

const updateCurrentTabs = (data) => {
  let addedCases = numeral(data.todayCases).format("+0,0");
  let addedRecovered = numeral(data.todayRecovered).format("+0,0");
  let addedDeaths = numeral(data.todayDeaths).format("+0,0");
  let totalCases = numeral(data.cases).format("0.0a");
  let totalRecovered = numeral(data.recovered).format("0.0a");
  let totalDeaths = numeral(data.deaths).format("0.0a");
  document.querySelector(".total-number").innerHTML = addedCases;
  document.querySelector(".recovered-number").innerHTML = addedRecovered;
  document.querySelector(".deaths-number").innerHTML = addedDeaths;
  document.querySelector(".cases-total").innerHTML = `${totalCases} Total`;
  document.querySelector(
    ".recovered-total"
  ).innerHTML = `${totalRecovered} Total`;
  document.querySelector(".deaths-total").innerHTML = `${totalDeaths} Total`;
};

//build pie chart
const buildPieChart = (pieChartData) => {
  console.log(pieChartData);
  var ctx = document.getElementById("pieChart").getContext("2d");
  var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "doughnut",

    // The data for our dataset
    data: {
      labels: ["Total Deaths", "Total Recovered", "Total Active"],
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: [
            "#fc3c3c",
            "#048001",
            "#f9a824",
            "#f1c40f",
            "#e74c3c",
            "#34495e",
          ],
          data: [
            pieChartData.deaths,
            pieChartData.recovered,
            pieChartData.active,
          ],
        },
      ],
    },

    // Configuration options go here
    options: {
      maintainAspectRatio: true,
      animation: {
        animateScale: true,
      },
    },
  });
};

const buildChartData = (data) => {
  `
  required format:
  [
    {
      x: data,
      y: 4352
    }


  ]
  `;
  let chartData = [];

  for (let date in data.cases) {
    let newDataPoint = {
      x: date,
      y: data.cases[date],
    };
    chartData.push(newDataPoint);
  }
  return chartData;
};

const buildRecovered = (data) => {
  let recoveredData = [];

  for (let date in data.recovered) {
    let newDataPoint = {
      x: date,
      y: data.recovered[date],
    };
    recoveredData.push(newDataPoint);
  }
  return recoveredData;
};

const buildDeaths = (data) => {
  let deathsData = [];

  for (let date in data.deaths) {
    let newDataPoint = {
      x: date,
      y: data.deaths[date],
    };
    deathsData.push(newDataPoint);
  }
  return deathsData;
};

const getHistoricalData = () => {
  fetch("https://disease.sh/v2/historical/all?lastdays=150")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      let chartData = buildChartData(data);
      let recoveredData = buildRecovered(data);
      let deathsData = buildDeaths(data);
      buildChart(chartData, recoveredData, deathsData);
    });
};

//build line chart
const buildChart = (chartData, recoveredData, deathsData) => {
  var timeFormat = "MM/DD/YYYY";

  var ctx = document.getElementById("myChart").getContext("2d");
  var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "line",

    // The data for our dataset
    data: {
      // labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "Total Cases",
          backgroundColor: "#1d2c4d",
          borderColor: "#1d2c4d",
          data: chartData,
          fill: false,
        },
        {
          label: "Total Recovered",
          backgroundColor: "green",
          borderColor: "green",
          data: recoveredData,
          fill: false,
        },
        {
          label: "Total Deaths",
          backgroundColor: "red",
          borderColor: "red",
          data: deathsData,
          fill: false,
        },
      ],
    },

    // Configuration options go here
    options: {
      maintainAspectRatio: true,
      tooltips: {
        mode: "index",
        intersect: false,
      },
      hover: {
        mode: "index",
        intersect: false,
      },
      scales: {
        xAxes: [
          {
            type: "time", //Moment.js required to use time axis
            time: {
              format: timeFormat,
              tooltipFormat: "ll",
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              callback: function (value, index, values) {
                return numeral(value).format("0,0");
              },
            },
          },
        ],
      },
    },
  });
};

const showDataOnMap = (data, casesType = "cases") => {
  data.map((country) => {
    let countryCenter = {
      lat: country.countryInfo.lat,
      lng: country.countryInfo.long,
    };

    var countryCircle = new google.maps.Circle({
      strokeColor: casesTypeColors[casesType],
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: casesTypeColors[casesType],
      fillOpacity: 0.35,
      map: map,
      center: countryCenter,
      radius: country[casesType],

      // radius: Math.sqrt(country.population) * 20,
    });
    mapCircles.push(countryCircle);

    var html = `
    <div class="info-container">
    <div class="info-header">
      <div class="info-flag" style="background-image: url(${
        country.countryInfo.flag
      })"></div>

        <div class="info-name">${country.country}</div>
    </div>
        <div class="info-confirmed">Total Cases:<span> ${numeral(
          country.cases
        ).format("0,0")}</span></div>
        <div class="info-active">Active Cases:<span> ${numeral(
          country.active
        ).format("0,0")}</span></div>
        <div class="info-deaths">Total Deaths:<span> ${numeral(
          country.deaths
        ).format("0,0")}</span></div>
        <div class="info-recovered">Total Recovered:<span> ${numeral(
          country.recovered
        ).format("0,0")}</span></div>
    </div>
  
    `;

    var infoWindow = new google.maps.InfoWindow({
      content: html,
      position: countryCenter,
    });

    google.maps.event.addListener(countryCircle, "mouseover", function (ev) {
      infoWindow.open(map);
    });

    google.maps.event.addListener(countryCircle, "mouseout", function (ev) {
      infoWindow.close();
    });
  });
};

// //Get JSON
// getAllCases = (url) => {
//   const casesPromise = fetch(url);
//   return casesPromise.then((response) => {
//     //console.log(response.json());
//     return response.json();
//   });
// };

//Display data in table
const showDataInTable = (data) => {
  let html = "";
  const tableOnPage = document.getElementById("tableOnPage");

  // data.map((country) => {
  //   tableOnPage.innerHTML = `

  //       <tr>
  //         <th scope="row">${country.country}</th>
  //         <td>${country.cases}</td>
  //         <td>${country.recovered}</td>
  //         <td>${country.deaths}</td>
  //       </tr>

  //   `;
  // });
  data.forEach((country) => {
    html += `
    
          <tr>
          
            <td class="country-flag">
            <img width = 40px src="${country.countryInfo.flag}" />
            <span>
                ${country.country}   </span>
            </td>
            <td>${numeral(country.cases).format("0,0")}</td>
           
           <td class="additional-info">${numeral(country.recovered).format(
             "0,0"
           )}</td>
           <td class="additional-info">${numeral(country.deaths).format(
             "0,0"
           )}</td>
           <td>${numeral(country.todayCases).format("+0,0")}</td>
           
         </tr>
      
      
       `;
  });
  tableOnPage.innerHTML = html;
};

//Search Countries
function searchCountries(url, countries) {
  countries = getAllCases(url)
    .then((response) => {
      console.log(response);
      let index = 1;
      clearLocations();
      for (let country of response) {
        console.log(country);
        showMarkers(country, index);
        index++;
      }
    })
    .catch((error) => {
      console.log(error);
    });

  //  console.log(countries);
  // for (let country of countries) {
  //   //console.log(country);
  //   //console.log(foundCountries);
  //   showMarkers(countries);
  // }
}

//Show Markers
function showMarkers(countries, index, timeout) {
  var bounds = new google.maps.LatLngBounds();
  var latlng = new google.maps.LatLng(
    countries.countryInfo["lat"],
    countries.countryInfo["long"]
  );
  console.log("Coordinates: " + latlng);
  console.log(index);
  var name = countries.country;
  var totalCases = countries.cases;
  var totalRecovered = countries.recovered;
  var totalDeaths = countries.deaths;

  // for (var country in countries) {
  //   //console.log(country.country);
  //   var latlng = new google.maps.LatLng(
  //     // country["latitude"],
  //     countries.countryInfo["latitude"],
  //     countries.countryInfo["longitude"]
  //   );
  //   console.log("Latitued: " + countries.countryInfo["latitude"]);
  //   var name = country["country"];
  //   var totalCases = country["cases"];
  //   var totalRecovered = country["recovered"];
  //   var totalDeaths = country["deaths"];

  bounds.extend(latlng);

  createMarker(
    latlng,
    name,
    totalCases,
    index,
    totalRecovered,
    totalDeaths,
    timeout
  );

  map.fitBounds(bounds);
}
//Create markers
function createMarker(
  latlng,
  name,
  totalCases,
  index,
  totalRecovered,
  totalDeaths,
  timeout
) {
  var marker = new google.maps.Marker({
    map: map,
    position: latlng,
    label: index.toString(), //country index
    animation: google.maps.Animation.DROP,
  });

  markers.push(marker);
}

function clearLocations() {
  //infoWindow.close();
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers.length = 0;
}

function placeMarkerAndPanTo(latLng, map) {
  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
  });
  map.panTo(latLng);
}

const updateMap = (id) => {
  const tabClasses = document.querySelectorAll(".card");
  let activeClass;
  let textColor;

  tabClasses.forEach((tabClass) => {
    tabClass.classList.remove("activeActiveCases");
    tabClass.classList.remove("activeTotal");
    tabClass.classList.remove("activeRecovered");
    tabClass.classList.remove("activeDeaths");
    tabClass.querySelector(".card-subtitle").style.color = "";
  });

  switch (id) {
    case "tabActive":
      activeClass = "activeActiveCases";
      textColor = "black";
      break;

    case "tabTotal":
      activeClass = "activeTotal";
      textColor = "white";
      break;

    case "tabRecovered":
      activeClass = "activeRecovered";
      textColor = "white";

      break;

    case "tabDeaths":
      activeClass = "activeDeaths";
      textColor = "white";

      break;
  }

  document.getElementById(id).classList.add(activeClass);
  document
    .getElementById(id)
    .querySelector(".card-subtitle").style.color = textColor;

  // document.getElementById(id).style.color = textColor;
};

//calculating the World Recovery Rate
const calcRecoveryRate = (currentData) => {
  let totalGlobalCases = currentData.cases;
  let totalRecovered = currentData.recovered;

  // let recoverySpan = document.getElementById("recoverySpan");
  recoveryRate = Math.round((totalRecovered / totalGlobalCases) * 100);
  // console.log("Recovery Rate: " + recoveryRate + "%");
  // recoverySpan.innerHTML = `${recoveryRate}%`;
  document.querySelector(
    ".radial-circle-inner"
  ).innerHTML = `<div id="recoverySpan" data-target="${recoveryRate}"></div><span>%</span>`;

  animateRecoveryRate();
};
const calcFatalityRate = (currentData) => {
  let totalGlobalCases = currentData.cases;
  let totalDeaths = currentData.deaths;

  // let recoverySpan = document.getElementById("recoverySpan");
  fatalityRate = Math.round((totalDeaths / totalGlobalCases) * 100);
  // console.log("Recovery Rate: " + recoveryRate + "%");
  // recoverySpan.innerHTML = `${recoveryRate}%`;
  document.querySelector(
    ".radial-circle-inner-death"
  ).innerHTML = `<div id="fatalitySpan" data-target="${fatalityRate}"></div><span>%</span>`;

  animateFatalityRate();
};

//animation code for the recovery rate card
const animateRecoveryRate = () => {
  const counter = document.querySelector("#recoverySpan");
  const speed = 50;

  const target = +counter.getAttribute("data-target");
  const count = +counter.innerText;
  const increment = Math.ceil(target / speed);
  // const increment = 2;

  if (count < target) {
    counter.innerText = count + increment;
    setTimeout(animateRecoveryRate, 1);
  } else {
    counter.innerText = target;
  }
};
//animation code for the fatality rate card
const animateFatalityRate = () => {
  const counter = document.querySelector("#fatalitySpan");
  const speed = 50;

  const target = +counter.getAttribute("data-target");
  const count = +counter.innerText;
  const increment = Math.ceil(target / speed);
  // const increment = 2;

  if (count < target) {
    counter.innerText = count + increment;
    setTimeout(animateFatalityRate, 1);
  } else {
    counter.innerText = target;
  }
};
