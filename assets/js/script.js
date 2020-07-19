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
  recovered: "#00C853",
  deaths: "#fc3c3c",
};
const worldWideSelection = {
  name: "Worldwide",
  value: "www",
  selected: true,
};
//var infoWindow;

// Initialize and add the map
window.onload = () => {
  getCountriesData();
  getCountryData();
  getHistoricalData();
  // buildPieChart();
  getCurrentData();
  sortTableData();
  getTopHeadlines();
  replaceSmallChar();
  // calcRecoveryRate();
  // console.log(new Date(1595079209 * 1000).toLocaleString());
};

const replaceSmallChar = () => {
  let cards = document.querySelectorAll(".stats-container .card");
  let indexOfM;
  let indexOfK;

  cards.forEach((card) => {
    console.log(card.getElementsByTagName("p").innerHTML);
  });
};

const mapCenter = {
  lat: 34.80746,
  lng: -40.4796,
};
function initMap() {
  // The location of Germany
  // var germany = { lat: 51.1657, lng: 10.4515 };
  // The map, centered at Germany
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 3,
    styles: mapStyle,
    center: mapCenter,
  });

  //infoWindow = new google.maps.InfoWindow();
  // The marker, positioned at germany
  //var marker = new google.maps.Marker({ position: germany, map: map });
  //searchCountries(url, countries);
  // //Get JSON Data
}

const changeDataSelection = (elem, casesType) => {
  clearTheMap();
  showDataOnMap(globalCountryData, casesType);
  setActiveTab(elem);
};

const setActiveTab = (elem) => {
  const activeElem = document.querySelector(".card.active");
  activeElem.classList.remove("active");
  elem.classList.add("active");
};

const clearTheMap = () => {
  for (let circle of mapCircles) {
    circle.setMap(null);
  }
};

//function to pan to selected location
const setMapCenter = (lat, long, zoom, countryName = "Global") => {
  map.setZoom(zoom);
  map.panTo({
    lat: lat,
    lng: long,
  });
  document.querySelector(".cases-location").innerHTML = countryName;
  if (countryName === "Global") {
    document.querySelector(".news-location").innerHTML = "";
  } else {
    document.querySelector(".news-location").innerHTML = " In " + countryName;
  } // console.log(document.querySelector(".cases-location").innerHTML);
};

//initialize country dropdown
const initDropdown = (searchList) => {
  $(".ui.dropdown").dropdown({
    values: searchList,
    onChange: function (value, text) {
      if (value !== worldWideSelection.value) {
        getCountryData(value);
      } else {
        getCurrentData();
      }
    },
  });
};

const setSearchList = (data) => {
  let searchList = [];
  searchList.push(worldWideSelection);
  data.forEach((countryData) => {
    searchList.push({
      name: countryData.country,
      value: countryData.countryInfo.iso3,
    });
  });

  initDropdown(searchList);
};

const getCountriesData = () => {
  fetch("https://disease.sh/v2/countries")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      globalCountryData = data;
      setSearchList(data);
      showDataOnMap(data);
      showDataInTable(data);

      // console.log(globalCountryData);
    });
};

const getCountryData = (countryIso = "") => {
  const url = "https://disease.sh/v3/covid-19/countries/" + countryIso;
  console.log(url);
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      setMapCenter(
        data.countryInfo.lat,
        data.countryInfo.long,
        4,
        data.country
      );
      updateCurrentTabs(data);
      console.log(data);
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
      setMapCenter(mapCenter.lat, mapCenter.lng, 2);
      calcRecoveryRate(data);
      calcFatalityRate(data);
    });
};

const updateCurrentTabs = (data) => {
  let addedCases = numeral(data.todayCases).format("+0,0");
  let addedRecovered = numeral(data.todayRecovered).format("+0,0");
  let addedDeaths = numeral(data.todayDeaths).format("+0,0");
  let totalCases = numeral(data.cases).format("0.0a");
  let convTotalCases = totalCases.replace("m", "M");
  let totalRecovered = numeral(data.recovered).format("0.0a");
  let convTotalRecovered = totalRecovered.replace("m", "M");
  let totalDeaths = numeral(data.deaths).format("0.0a");

  let indexOfM = totalDeaths.indexOf("m");
  let indexOfK = totalDeaths.indexOf("k");
  let convTotalDeaths;
  if (indexOfM > -1) {
    convTotalDeaths = totalDeaths.replace("m", "M");
  } else if (indexOfK > -1) {
    convTotalDeaths = totalDeaths.replace("k", "K");
  }
  document.querySelector(".total-number").innerHTML = addedCases;
  document.querySelector(".recovered-number").innerHTML = addedRecovered;
  document.querySelector(".deaths-number").innerHTML = addedDeaths;
  document.querySelector(".cases-total").innerHTML = `${convTotalCases} Total`;
  document.querySelector(
    ".recovered-total"
  ).innerHTML = `${convTotalRecovered} Total`;
  document.querySelector(
    ".deaths-total"
  ).innerHTML = `${convTotalDeaths} Total`;
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
  let lastDataPoint;
  for (let date in data.cases) {
    if (lastDataPoint) {
      let newDataPoint = {
        x: date,
        y: data.cases[date] - lastDataPoint, //Calculate daily new cases
      };
      chartData.push(newDataPoint);
    }
    lastDataPoint = data.cases[date];
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
      // let recoveredData = buildRecovered(data);
      // let deathsData = buildDeaths(data);
      buildChart(chartData);
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
          backgroundColor: "rgba(93, 99, 106, 0.7)",
          borderColor: "#0d1319",
          data: chartData,
          fill: true,
        },
      ],
    },

    // Configuration options go here
    options: {
      maintainAspectRatio: false,
      tooltips: {
        mode: "index",
        intersect: false,
      },
      hover: {
        mode: "index",
        intersect: false,
      },
      elements: {
        point: {
          radius: 0,
        },
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
           <td class="today-column">${numeral(country.todayCases).format(
             "+0,0"
           )}</td>
           
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

const sortTableData = () => {
  let table, i, x, y;
  let swichable = true; //boolean for comparing two row items
  table = document.querySelector(".table");
  let rows = table.rows;
  console.log(rows);
  // while (swichable) {
  //   switchable = false;
  //   let rows = table.rows;

  //   for (let i = 1; i < rows.length - 1; i++) {
  //     var doSwitch = false;

  //     x = rows[i].getElementsByTagName("TD")[0];
  //     y = rows[i + 1].getElementsByTagName("TD")[0];

  //     if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
  //       doSwitch = true;
  //       break;
  //     }
  //   }
  //   if (doSwitch) {
  //     rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
  //     switchable = true;
  //   }
  // }
};
const getTopHeadlines = (countryCode = "de") => {
  // const proxyUrl = "https://cors-anywhere.herokuapp.com/";
  // const qInTitle = "coronavirus";
  // const country = countryCode;
  // const from = "";
  // const apiKey = "e4c75cfb0da04dd783d18368db238bd4";
  // const url = `${proxyUrl}newsapi.org/v2/top-headlines?country=${country}&qInTitle=${qInTitle}&apiKey=${apiKey}`;
  // const request = new Request(url);
  let url =
    "https://newsapi.org/v2/top-headlines?country=" +
    countryCode +
    "&q=coronavirus&apiKey=e4c75cfb0da04dd783d18368db238bd4";
  // console.log(request);
  fetch(url)
    .then((response) => {
      return response.json;
    })
    .then((data) => {
      console.log(data);
    });
};
