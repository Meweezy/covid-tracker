const url = "https://disease.sh/v2/countries";
let markers = [];
let countries;
let map;
let recoveryRate;
let fatalityRate;
let globalCountryData;
let mapCircles = [];
let sortDirection = true;
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
let infoWindow;
let prevInfoWindow;
let datasetId = 0;
let histTotalCases;
let histTotalRecovered;
let histTotalDeaths;
var chart;

// Initialize and add the map
window.onload = () => {
  getCountriesData();
  getCountryData();
  getContinentsData();
  getHistoricalData();
  // buildPieChart();
  getCurrentData();
  setMenuItemActive();
  // calcRecoveryRate();
  // console.log(new Date(1595079209 * 1000).toLocaleString());
  $(document).ready(function () {
    $("#table").DataTable();
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

  infoWindow = new google.maps.InfoWindow();
  // The marker, positioned at germany
  //var marker = new google.maps.Marker({ position: germany, map: map });
  //searchCountries(url, countries);
  // //Get JSON Data
}

const changeDataSelection = (elem, casesType, newDatasetId) => {
  clearTheMap();
  showDataOnMap(globalCountryData, casesType);
  setActiveTab(elem);
  buildChart(histTotalCases, histTotalRecovered, histTotalDeaths, newDatasetId);
  console.log(histTotalDeaths);
  // datasetId = newDatasetId;
  // console.log(datasetId);
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
const setMapCenter = (lat, long, zoom, countryName = "Global", data) => {
  let html = `
    <div class="info-container">
    <div class="info-header">
      <div class="info-flag" style="background-image: url(${
        data.countryInfo.flag
      })"></div>

        <div class="info-name">${countryName}</div>
    </div>
        <div class="info-confirmed">Total Cases:<span> ${numeral(
          data.cases
        ).format("0,0")}</span></div>
        <div class="info-active">Active Cases:<span> ${numeral(
          data.active
        ).format("0,0")}</span></div>
        <div class="info-deaths">Total Deaths:<span> ${numeral(
          data.deaths
        ).format("0,0")}</span></div>
        <div class="info-recovered">Total Recovered:<span> ${numeral(
          data.recovered
        ).format("0,0")}</span></div>
    </div>

    `;
  map.setZoom(zoom);
  map.panTo({
    lat: lat,
    lng: long,
  });

  openInfoWindow(html, { lat: lat, lng: long });
  document.querySelector(".cases-location").innerHTML = countryName;
  // console.log(document.querySelector(".cases-location").innerHTML);
};

const openInfoWindow = (content, position) => {
  infoWindow.setContent(content);
  infoWindow.setPosition(position);

  map.addListener("bounds_changed", function () {
    infoWindow.open(map);
  });
  if (prevInfoWindow) {
    prevInfoWindow.close();
  }
  prevInfoWindow = infoWindow;
};

//initialize country dropdown
const initDropdown = (searchList) => {
  $(".ui.dropdown").dropdown({
    values: searchList,
    onChange: function (value, text) {
      if (value !== worldWideSelection.value) {
        getCountryData(value);
        // openInfoWindow(infoWindowContent, { lat: 51, lng: 10 });
      } else {
        getCurrentData();
      }
    },
  });
};

const setSearchList = (data) => {
  let searchList = [];
  let html;
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
      // showDataInTable(data);
      sortTableData("cases");

      // console.log(globalCountryData);
    });
};

const getContinentsData = () => {
  fetch("https://disease.sh/v3/covid-19/continents")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      let barChartData = buildBarChartData(data);
      buildBarChart(barChartData);
    });
};

const buildBarChartData = (data) => {
  let barChartData = [];
  data.map((continent) => {
    let newDataPoint = {
      x: continent.cases,
      y: continent.continent,
    };
    barChartData.push(newDataPoint);
  });
  // console.log(barChartData);
  return barChartData;
};

const getCountryData = (countryIso = "") => {
  const url = "https://disease.sh/v3/covid-19/countries/" + countryIso;
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      setMapCenter(
        data.countryInfo.lat,
        data.countryInfo.long,
        4,
        data.country,
        data
      );
      updateCurrentTabs(data);
      //update chart data below
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
      // setMapCenter(mapCenter.lat, mapCenter.lng, 2, data);
      calcRecoveryRate(data);
      calcFatalityRate(data);
    });
};

const updateCurrentTabs = (data) => {
  let addedCases = numeral(data.todayCases).format("+0,0");
  let addedRecovered = numeral(data.todayRecovered).format("+0,0");
  let addedDeaths = numeral(data.todayDeaths).format("+0,0");
  let totalCases = numeral(data.cases).format("0.0a");
  // let convTotalCases = totalCases.replace("m", "M");
  let totalRecovered = numeral(data.recovered).format("0.0a");
  // let convTotalRecovered = totalRecovered.replace("m", "M");
  let totalDeaths = numeral(data.deaths).format("0.0a");

  let casesIndexOfM = [totalCases, totalRecovered, totalDeaths];
  let convCasesIndex = [];
  for (let [mIndex, mValue] of casesIndexOfM.entries()) {
    if (mValue.indexOf("m") > -1) {
      convCasesIndex.push(casesIndexOfM[mIndex].replace("m", "M"));
    } else if (mValue.indexOf("k") > -1) {
      convCasesIndex.push(casesIndexOfM[mIndex].replace("k", "K"));
    } else {
      convCasesIndex.push(mValue);
    }
    convTotalCases = convCasesIndex[0];
    convTotalRecovered = convCasesIndex[1];
    convTotalDeaths = convCasesIndex[2];
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
  // console.log(pieChartData);
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
  let lastDataPoint;

  for (let date in data.recovered) {
    if (lastDataPoint) {
      let newDataPoint = {
        x: date,
        y: data.recovered[date] - lastDataPoint,
      };
      recoveredData.push(newDataPoint);
    }
    lastDataPoint = data.recovered[date];
  }
  return recoveredData;
};

const buildDeaths = (data) => {
  let deathsData = [];
  let lastDataPoint;

  for (let date in data.deaths) {
    if (lastDataPoint) {
      let newDataPoint = {
        x: date,
        y: data.deaths[date] - lastDataPoint,
      };
      deathsData.push(newDataPoint);
    }
    lastDataPoint = data.deaths[date];
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
      buildChart(chartData, recoveredData, deathsData, datasetId);
      //updateChart()
    });
};

//build bar chart
const buildBarChart = (barChartData) => {
  var ctx = document.getElementById("hBarChart").getContext("2d");
  var chart = new Chart(ctx, {
    type: "horizontalBar",
    data: {
      datasets: [
        {
          label: "Confirmed Cases",
          backgroundColor: "rgba(62, 68, 74, 0.8)",
          borderColor: "rgba(62, 68, 74, 1)",
          borderWidth: 1,
          barPercentage: 0.5,
          barThickness: 6,
          maxBarThickness: 8,
          minBarLength: 2,
          data: [
            barChartData[0].x,
            barChartData[1].x,
            barChartData[2].x,
            barChartData[3].x,
            barChartData[4].x,
            barChartData[5].x,
          ],
        },
      ],
      labels: [
        barChartData[0].y,
        barChartData[1].y,
        barChartData[2].y,
        barChartData[3].y,
        barChartData[4].y,
        barChartData[5].y,
      ],
    },
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
      scales: {
        xAxes: [
          {
            gridLines: {
              offsetGridLines: true,
            },
          },
        ],
        yAxis: [
          {
            ticks: {
              beginAtZero: false,
              mirror: true,
            },
            fontSize: 24,
          },
        ],
      },
    },
  });
};

const updateChartData = (chart, label, data) => {
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset) => {
    dataset.data.push(data);
  });
  chart.update();
};

//build line chart
const buildChart = (chartData, recoveredData, deathsData, newDatasetId = 0) => {
  histTotalCases = chartData;
  histTotalRecovered = recoveredData;
  histTotalDeaths = deathsData;
  let datasetData = [
    {
      label: "Total Cases",
      backgroundColor: "rgba(93, 99, 106, 0.8)",
      borderColor: "#0d1319",
      data: chartData,
      fill: true,
    },
    {
      label: "Total Recovered",
      backgroundColor: "rgba(127, 217, 34, 0.8)",
      borderColor: "#7fd922",
      data: recoveredData,
      fill: true,
    },
    {
      label: "Total Deaths",
      backgroundColor: "rgba(250, 85, 117, 0.8)",
      borderColor: "#fa5575",
      data: deathsData,
      fill: true,
    },
  ];

  // console.log(datasetData[newDatasetId]);

  var timeFormat = "MM/DD/YYYY";

  var ctx = document.getElementById("myChart").getContext("2d");
  if (typeof chart != "undefined") {
    chart.destroy();
  }
  chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "line",

    // The data for our dataset
    data: {
      // labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        // {
        //   label: "Total Cases",
        //   backgroundColor: "rgba(93, 99, 106, 0.8)",
        //   borderColor: "#0d1319",
        //   data: chartData,
        //   fill: true,
        // },

        datasetData[newDatasetId],
        // updateChartData(chart, "Test", 1),
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
  chart.update();
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
const sortTableData = (columnName) => {
  const dataType = typeof globalCountryData[0][columnName];
  const sortableColumnHeader = document.querySelector(".sortable-column");
  const sortableColumnIcon = document
    .querySelector(".sortable-column")
    .getElementsByTagName("i");

  // sortableColumnHeader.removeChild(sortableColumnHeader.childNodes[2]);

  sortDirection = !sortDirection;

  if (sortDirection) {
    sortableColumnHeader.removeChild(sortableColumnHeader.childNodes[2]);
    sortableColumnHeader.appendChild(document.createElement("i"));
    console.log(sortableColumnIcon);
    // sortableColumnIcon.classList.add("material_icons");
    sortableColumnIcon.innerHTML = "keyboard_arrow_up";
  } else {
    sortableColumnIcon.innerHTML = "keyboard_arrow_down";
  }

  switch (dataType) {
    case "number":
      sortNumberColumn(sortDirection, columnName);
      break;
  }
  showDataInTable(globalCountryData);
};

const sortNumberColumn = (sort, columnName) => {
  globalCountryData = globalCountryData.sort((c1, c2) => {
    return sort
      ? c1[columnName] - c2[columnName]
      : c2[columnName] - c1[columnName];
  });
};
//Display data in table
const showDataInTable = (data) => {
  // sortTableData(columnName);
  let html = "";
  const tableOnPage = document.getElementById("tableOnPage");

  data.forEach((country) => {
    html += `
    
          <tr>
           
          <td class="country-flag">
          <div class="country-cell"> 
            <img width = 30px src="${country.countryInfo.flag}" />
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
      // console.log(response);
      let index = 1;
      clearLocations();
      for (let country of response) {
        // console.log(country);
        showMarkers(country, index);
        index++;
      }
    })
    .catch((error) => {
      console.log(error);
    });
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

// const setMenuItemActive = (elem) => {
//   const activeMenuItem = document.querySelector(".side-menu-item-active");
//   activeMenuItem.classList.remove(".side-menu-item-active");
//   elem.classList.add(".side-menu-item-active");
// };
