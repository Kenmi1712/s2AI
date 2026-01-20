layers_config.js

import { referenceLayers } from "./referenceLayers.js";
// import {deepCopyObj,getInsatAvlDates,uiToFactoryParamsConvertor,uiToFactoryParamsConvertorInsat,getLegacyAvlDates,getAsyncData,getAvlDates,getAvlSeasonDates} from './dateConfig.js'
import { get_geoentity_param_values } from "./gs-client-0.3.js";
import {
  getInsatAvlDates,
  getRidamAvlTimestamp,
  getAsyncData,
} from "./dateConfig.js";
import {
  generateHighChartObjFromRidam,
  generateHighChartObjModisVillage,
  generateHighChartObjModisTehsil,
  generateHighChartObjModisDistrict,
  getYoYSeries,
  createSeparateArraysForXandYAxis,
  // processMODISInpaintedChartData,
  processMODISInpaintedChartDataIF1,
  processChartDatanbr,
  processChartData,
  returnHighChartObj,
  generateHighChartObjForS2NDVIProfileWithCMASK,
  generateHighChartObjFromRidambais2,
  generateHighChartObjFromRidamForMODISInpainted,
  generateHighChartObjFromRidamForMODISForecasted,
  generateHighChartObjFromRidamForMODISInpaintedIF,
  processChartDataMODISForecasted,
  generateHighChartObjFromRidamnbr,
} from "./chart.js";
//Global letiable declaration
const compositeLuLcOptions = [
  { lbl: "Level 1", val: 1 },
  { lbl: "Level 2", val: 2 },
  { lbl: "Level 3", val: 3 },
];

const maxarparam = [
  { lbl: "Building", val: "Building" },
  { lbl: "Tree", val: "Tree" },
  { lbl: "Water", val: "Water" },
  { lbl: "Road", val: "Road" },
  { lbl: "All", val: "All" },
];

const sentinel1DataOptions = [
  { lbl: "VV", val: "VV" },
  { lbl: "VH", val: "VH" },
  // { lbl: "R,G,B::VV,VH,VV-VH", val: "R,G,B::VV,VH,VV-VH" },
  { lbl: "R:G:B=VV:VH:VV-VH", val: "RGB" },
];

const operationOptions = [
  { lbl: "Max", val: "max" },
  { lbl: "Min", val: "min" },
  { lbl: "Mean", val: "mean" },
  { lbl: "Median", val: "median" },
];

let date_range_dict = {
  5: [
    [1, 5, 3],
    [6, 10, 8],
    [11, 15, 13],
    [16, 20, 18],
    [21, 25, 23],
    [26, 31, 28],
  ],
  10: [
    [1, 10, 6],
    [11, 20, 16],
    [21, 31, 26],
  ],
  15: [
    [1, 15, 9],
    [15, 31, 24],
  ],
  30: [[1, 31, 16]],
};
export function getmaxarentity(op) {
  console.log("entity issssss", op);

  return op === "Building"
    ? "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Buildings:910D09FF&LEGEND_OPTIONS=columnHeight:500;height:40;width:300"
    : op === "Tree"
    ? "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Trees:32CD32FF;&LEGEND_OPTIONS=columnHeight:500;height:40;width:300"
    : op === "Water"
    ? "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Water:00ffffff;&LEGEND_OPTIONS=columnHeight:500;height:40;width:300"
    : op === "Road"
    ? "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Road:FFFF00ff;&LEGEND_OPTIONS=columnHeight:500;height:40;width:300"
    : op === "ALL"
    ? "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Buildings:910D09FF;Trees:32CD32FF;Water:00ffffff;Road:FFFF00ff;&LEGEND_OPTIONS=columnHeight:700;height:100;width:300"
    : "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Buildings:910D09FF;Trees:32CD32FF;Water:00ffffff;Road:FFFF00ff;&LEGEND_OPTIONS=columnHeight:700;height:100;width:300";
}
async function getRidamPolygonChartData(coord) {
  let res = await fetch("https://vedas.sac.gov.in/ridam_server3/info/", {
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify({
      layer: "T0S0I1",
      args: {
        dataset_id: "T3S1P1",
        filter_nodata: "no",
        polygon: coord,
        indexes: [1],
        from_time: "20200601",
        to_time: "20240615",
        interval: 10,
        merge_method: "max",
      },
    }),
    method: "POST",
  });

  let result = await res.json();
  let data = result["result"];

  return data;
}

function yyyymmddToUnixTimestamp(yyyymmdd) {
  const year = parseInt(yyyymmdd.substring(0, 4), 10);
  const month = parseInt(yyyymmdd.substring(4, 6), 10) - 1; // Months are 0-indexed in JavaScript
  const day = parseInt(yyyymmdd.substring(6), 10);

  const date = new Date(year, month, day);
  const unixTimestamp = Math.floor(date.getTime());

  return unixTimestamp;
}

function processPolygonChartData(data, chartDataConfig) {
  console.log("this is data->", data);
  // let xAxisCategory = [];
  let processedData = data.map((x) => {
    let timeStamp = yyyymmddToUnixTimestamp(x[0]);

    let val = x[1];
    if (chartDataConfig && chartDataConfig.valueConvertor) {
      // console.log('Before conversion:', val);
      val = chartDataConfig.valueConvertor(val);
      // console.log('After conversion:', val);
    }
    return [timeStamp, val];
  });

  return processedData;
}
//Saturation Options -each val is 10000 multiple of lable value
const saturationOptions = [
  { lbl: 0.05, val: 500 },
  { lbl: 0.1, val: 1000 },
  { lbl: 0.15, val: 1500 },
  { lbl: 0.2, val: 2000 },
  { lbl: 0.25, val: 2500 },
  { lbl: 0.3, val: 3000 },
  { lbl: 0.35, val: 3500 },
  { lbl: 0.4, val: 4000 },
  { lbl: 0.45, val: 4500 },
  { lbl: 0.5, val: 5000 },
  { lbl: 0.55, val: 5500 },
  { lbl: 0.6, val: 6000 },
  { lbl: 0.65, val: 6500 },
  { lbl: 0.7, val: 7000 },
  { lbl: 0.75, val: 7500 },
  { lbl: 0.8, val: 8000 },
  { lbl: 0.85, val: 8500 },
  { lbl: 0.9, val: 9000 },
  { lbl: 0.95, val: 9500 },
  { lbl: 1.0, val: 10000 },
];

const ndvi_range_analysis_options = [
  { lbl: 0.05, val: 0.05 },
  { lbl: 0.1, val: 0.1 },
  { lbl: 0.15, val: 0.15 },
  { lbl: 0.2, val: 0.2 },
  { lbl: 0.25, val: 0.25 },
  { lbl: 0.3, val: 0.3 },
  { lbl: 0.35, val: 0.35 },
  { lbl: 0.4, val: 0.4 },
  { lbl: 0.45, val: 0.45 },
  { lbl: 0.5, val: 0.5 },
  { lbl: 0.55, val: 0.55 },
  { lbl: 0.6, val: 0.6 },
  { lbl: 0.65, val: 0.65 },
  { lbl: 0.7, val: 0.7 },
  { lbl: 0.75, val: 0.75 },
  { lbl: 0.8, val: 0.8 },
];

const s2_building = [
  { lbl: 0.2, val: 0.2 },
  { lbl: 0.3, val: 0.3 },
  { lbl: 0.4, val: 0.4 },
  { lbl: 0.5, val: 0.5 },
  { lbl: 0.6, val: 0.6 },
  { lbl: 0.7, val: 0.7 },
  { lbl: 0.8, val: 0.8 },
];

//Saturation Options -each val is 10000 multiple of lable value
const awifsSaturationOptions = [
  { lbl: 0.05, val: 0.05 },
  { lbl: 0.1, val: 0.1 },
  { lbl: 0.15, val: 0.15 },
  { lbl: 0.2, val: 0.2 },
  { lbl: 0.25, val: 0.25 },
  { lbl: 0.3, val: 0.3 },
  { lbl: 0.35, val: 0.35 },
  { lbl: 0.4, val: 0.4 },
  { lbl: 0.45, val: 0.45 },
  { lbl: 0.5, val: 0.5 },
  { lbl: 0.55, val: 0.55 },
  { lbl: 0.6, val: 0.6 },
  { lbl: 0.65, val: 0.65 },
  { lbl: 0.7, val: 0.7 },
  { lbl: 0.75, val: 0.75 },
  { lbl: 0.8, val: 0.8 },
  { lbl: 0.85, val: 0.85 },
  { lbl: 0.9, val: 0.9 },
  { lbl: 0.95, val: 0.95 },
  { lbl: 1.0, val: 1.0 },
];

const bandOptions = [
  {
    title: "B1",
    lbl: "Aerosol [443]",
    val: 1,
    saturation: saturationOptions[5],
  },
  { title: "B2", lbl: "Blue [490]", val: 2, saturation: saturationOptions[7] },
  { title: "B3", lbl: "Green [560]", val: 3, saturation: saturationOptions[7] },
  { title: "B4", lbl: "Red [665]", val: 4, saturation: saturationOptions[7] },
  {
    title: "B5",
    lbl: "Red-Edge [705]",
    val: 5,
    saturation: saturationOptions[11],
  },
  {
    title: "B6",
    lbl: "Red-Edge [740]",
    val: 6,
    saturation: saturationOptions[11],
  },
  {
    title: "B7",
    lbl: "Red-Edge [783]",
    val: 7,
    saturation: saturationOptions[11],
  },
  { title: "B8", lbl: "NIR [842]", val: 8, saturation: saturationOptions[11] },
  { title: "B8A", lbl: "NIR [865]", val: 9, saturation: saturationOptions[11] },
  {
    title: "B9",
    lbl: "SWIR [945]",
    val: 10,
    saturation: saturationOptions[11],
  },
  {
    title: "B11",
    lbl: "SWIR [1610]",
    val: 11,
    saturation: saturationOptions[5],
  },
  {
    title: "B12",
    lbl: "SWIR [2190]",
    val: 12,
    saturation: saturationOptions[5],
  },
];

const awifsBandOptions = [
  { lbl: "Green", val: 1 },
  { lbl: "Red", val: 2 },
  { lbl: "NIR", val: 3 },
  { lbl: "SWIR", val: 4 },
];

//Season implementation

const compositeDateOptions = [
  { lbl: "1 Day", val: 1 },
  { lbl: "5 Days", val: 5 },
  { lbl: "10 Days", val: 10 },
  { lbl: "15 Days", val: 15 },
  { lbl: "30 Days", val: 30 },
];

let yearOptions = [
  { lbl: "2024-2025", val: "2024-2025", fromVal: "2024", toVal: "2024" },
  { lbl: "2023-2024", val: "2023-2024", fromVal: "2023", toVal: "2024" },
  { lbl: "2022-2023", val: "2022-2023", fromVal: "2022", toVal: "2023" },
  { lbl: "2021-2022", val: "2021-2022", fromVal: "2021", toVal: "2022" },
  { lbl: "2020-2021", val: "2020-2021", fromVal: "2020", toVal: "2021" },
];

let toDate = toDateParameterGenerator({
  showIfVal: 1,
  functionToCall: getAvlDates,
});

let toDate5 = toDateParameterGenerator({
  showIfVal: 5,
  functionToCall: getAvlDates,
  allowedDatesArray: [
    { fromDt: "01", toDt: "05", valToPush: "03" },
    { fromDt: "06", toDt: "10", valToPush: "08" },
    { fromDt: "11", toDt: "15", valToPush: "13" },
    { fromDt: "16", toDt: "20", valToPush: "18" },
    { fromDt: "21", toDt: "25", valToPush: "23" },
    { fromDt: "26", toDt: "31", valToPush: "28" },
  ],
});
let toDate10 = toDateParameterGenerator({
  showIfVal: 10,
  functionToCall: getAvlDates,
  allowedDatesArray: [
    { fromDt: "01", toDt: "10", valToPush: "05" },
    { fromDt: "11", toDt: "20", valToPush: "15" },
    { fromDt: "21", toDt: "31", valToPush: "25" },
  ],
});

let toDate15 = toDateParameterGenerator({
  showIfVal: 15,
  functionToCall: getAvlDates,
  allowedDatesArray: [
    { fromDt: "01", toDt: "15", valToPush: "08" },
    { fromDt: "16", toDt: "31", valToPush: "23" },
  ],
});

let toDate30 = toDateParameterGenerator({
  showIfVal: 30,
  functionToCall: getAvlDates,
  allowedDatesArray: [{ fromDt: "01", toDt: "31", valToPush: "15" }],
});

//Getting Legacy dates
let toDateLagacy = toDateParameterGenerator({
  showIfVal: 1,
  functionToCall: getLegacyAvlDates,
});

let toDate5Legacy = toDateParameterGenerator({
  showIfVal: 5,
  functionToCall: getLegacyAvlDates,
  allowedDatesArray: [
    { fromDt: "01", toDt: "05", valToPush: "03" },
    { fromDt: "06", toDt: "10", valToPush: "08" },
    { fromDt: "11", toDt: "15", valToPush: "13" },
    { fromDt: "16", toDt: "20", valToPush: "18" },
    { fromDt: "21", toDt: "25", valToPush: "23" },
    { fromDt: "26", toDt: "31", valToPush: "28" },
  ],
});
let toDate10Legacy = toDateParameterGenerator({
  showIfVal: 10,
  functionToCall: getLegacyAvlDates,
  allowedDatesArray: [
    { fromDt: "01", toDt: "10", valToPush: "05" },
    { fromDt: "11", toDt: "20", valToPush: "15" },
    { fromDt: "21", toDt: "31", valToPush: "25" },
  ],
});

let toDate15Legacy = toDateParameterGenerator({
  showIfVal: 15,
  functionToCall: getLegacyAvlDates,
  allowedDatesArray: [
    { fromDt: "01", toDt: "15", valToPush: "08" },
    { fromDt: "16", toDt: "31", valToPush: "23" },
  ],
});

let toDate30Legacy = toDateParameterGenerator({
  showIfVal: 30,
  functionToCall: getLegacyAvlDates,
  allowedDatesArray: [{ fromDt: "01", toDt: "31", valToPush: "15" }],
});

function toDateParameterGenerator(obj) {
  return {
    showIfProperty: "compositeDateOptions",
    showIfVal: obj.showIfVal,
    displayName: obj.displayName ? obj.displayName : "Date",
    typeOfData: "date",
    type: "choice",
    options: [],
    selectedOption: "",
    isShowPrevYearOption: true,
    defaultSelectedOption: obj.defaultSelectedOption
      ? obj.defaultSelectedOption
      : "",
    optionGenerator: async function (url, datasetId, splitDateAt) {
      return await obj.functionToCall(
        url,
        datasetId,
        splitDateAt,
        obj.allowedDatesArray
      );
    },
  };
}

var draw_source = new ol.source.Vector({});
var draw_vector = new ol.layer.Vector({
  source: draw_source,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: "rgba(33, 150, 243, 1)",
    }),
    fill: new ol.style.Fill({
      color: "rgba(33, 150, 243, 1)",
    }),
  }),
});
let vectorSource = new ol.source.Vector();
let vectorlayer = new ol.layer.Vector({
  source: vectorSource,
});

drawPointVector = new ol.interaction.Draw({
  source: vectorSource,
  type: "Point",
});
var draw_interaction, drawPointVector;
let drawCount = 0;
let featureCopyForPost;
//This function draws point on a map
export function removeMapInteraction(map) {
  draw_source.clear();
  vectorSource.clear();
  map.removeInteraction(draw_interaction);
  map.removeInteraction(drawPointVector);
}

async function range_analysis_chart(layerConfig, tool, map, app) {
  removeMapInteraction(map);

  map.addInteraction(drawPointVector);
  map.addLayer(vectorlayer);

  drawPointVector.on("drawend", async function (event) {
    document.getElementById("chart-container").innerHTML = "";

    let coord = event.feature.getGeometry().getCoordinates();
    let lon = coord[0];
    let lat = coord[1];
    let rawData = [];
    let ndviData = [];
    let aSeries = [],
      bSeries = [];

    app.isShowToolOutput = true;
    app.loadChartMsg = "Loading Chart Data";

    const dict = layerConfig.replaceDictionary;
    const filter_nodata = "yes";

    let bodyArgs = {
      dataset_id: "T3S1P1",
      filter_nodata: filter_nodata,
      lon: lon,
      lat: lat,
      indexes: [1], // NDVI
      from_time: "19700101",
      to_time: "20300615",
    };

    if (dict.compositeDateOptions && dict.compositeDateOptions !== 1) {
      const dateRange = date_range_dict[dict.compositeDateOptions];
      bodyArgs.composite = true;
      bodyArgs.composite_operation = "max";
      bodyArgs.composite_timestamp_profile = {
        profile_type: "date_range",
        date_range: dateRange,
      };
    } else {
      bodyArgs.composite = false;
    }

    try {
      const res = await fetch("https://vedas.sac.gov.in/ridam_server3/info/", {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          layer: "T0S0I0",
          args: bodyArgs,
        }),
        method: "POST",
      });

      const result = await res.json();
      rawData = result["result"];
    } catch (err) {
      console.error("Error fetching chart data:", err);
      app.loadChartMsg = "Failed to load data";
      return;
    }

    const compositeVal =
      layerConfig.parameters.compositeDateOptions.selectedOption.val;

    const aToDate =
      layerConfig.parameters[`aToDate${compositeVal}`].selectedOption;
    const bToDate =
      layerConfig.parameters[`bToDate${compositeVal}`].selectedOption;

    const aDateVal = new Date(aToDate.lbl).getTime();

    const bDateVal = new Date(bToDate.lbl).getTime();
    console.log("DATES_VAL", new Date(aDateVal), new Date(bDateVal));

    const maxTsVal = Math.max(aDateVal, bDateVal) + 2 * 24 * 60 * 60 * 1000;
    const minTsVal = Math.min(aDateVal, bDateVal) - 2 * 24 * 60 * 60 * 1000;
    console.log("timees", new Date(minTsVal), new Date(maxTsVal));

    const threshold = layerConfig.parameters.threshold.selectedOption.val;
    console.log("threshold", threshold);

    rawData.forEach((item) => {
      const timestamp = new Date(item[0]).getTime();
      if (timestamp >= minTsVal && timestamp <= maxTsVal) {
        ndviData.push([timestamp, item[1][0] / 250]);

        console.log(
          "date comparison",
          new Date(timestamp),
          new Date(aDateVal),
          new Date(Math.abs(timestamp - aDateVal))
        );

        if (Math.abs(timestamp - aDateVal) < 23 * 60 * 60 * 1000) {
          aSeries.push({ x: timestamp, y: item[1][0] / 250 });
        }

        if (Math.abs(timestamp - bDateVal) < 23 * 60 * 60 * 1000) {
          bSeries.push({ x: timestamp, y: item[1][0] / 250 });
        }
      }
    });

    console.log("A series", aSeries);
    console.log("B series", bSeries);
    console.log("NDVI Data", ndviData);

    // Highcharts series configuration
    const series = [
      {
        marker: { enabled: true },
        name: "NDVI",
        type: "spline",
        color: "green",
        data: ndviData,

        // },
        // {
        //   name: "A-Date",
        //   type: "column",
        //   color: "red",
        //   data: aSeries,

        // },
        // {
        //   name: "B-Date",
        //   type: "column",
        //   color: "blue",
        //   data: bSeries,

        // }
      },
    ];
    let locInfo = await getAddress(lon, lat);
    // Highcharts configuration
    const highChartObj = {
      chart: {
        zoomType: "x",
      },
      title: {
        text: `<span style='color:rgb(4 136 208);font-weight:bold'>${layerConfig.tools.pointInspect.chart.name}</span>`,
        useHTML: true,
      },
      subtitle: {
        text: `${locInfo}`,
        useHTML: true,
      },

      xAxis: {
        type: "datetime",
      },
      yAxis: {
        // NDVI Axis
        title: { text: "NDVI" },
        min: 0,
        max: 1,
        plotBands: [
          {
            from: threshold,
            to: 2,
            color: "rgba(0, 0, 0, 0.1)",
            label: {
              text: `NDVI values > ${threshold} Threshold`,
              align: "center",
              verticalAlign: "top",
              y: 15,

              style: {
                color: "#088",
                fontSize: "15px",
                fontWeight: "bold",
                textShadow: "0px 0px 2px #fff",
              },
            },
          },
        ],
      },
      legend: {
        layout: "horizontal",
        align: "center",
        verticalAlign: "bottom",
      },
      tooltip: {
        shared: true,
        crosshairs: true,
      },
      series: series,
    };

    Highcharts.chart("chart-container", highChartObj);
    app.loadChartMsg = "";
  });
}

async function showS2NDVIRGBChart(layerConfig, tool, map, app) {
  removeMapInteraction(map);

  map.addInteraction(drawPointVector);
  map.addLayer(vectorlayer);

  drawPointVector.on("drawend", async function (event) {
    document.getElementById("chart-container").innerHTML = "";

    let coord = event.feature.getGeometry().getCoordinates();
    let lon = coord[0];
    let lat = coord[1];
    let rawData = [];
    let ndviData = [];
    let rSeries = [],
      gSeries = [],
      bSeries = [];

    app.isShowToolOutput = true;
    app.loadChartMsg = "Loading Chart Data";

    const dict = layerConfig.replaceDictionary;
    const filter_nodata = "yes";

    let bodyArgs = {
      dataset_id: "T3S1P1",
      filter_nodata: filter_nodata,
      lon: lon,
      lat: lat,
      indexes: [1], // NDVI
      from_time: "19700101",
      to_time: "20300615",
    };

    if (dict.compositeDateOptions && dict.compositeDateOptions !== 1) {
      const dateRange = date_range_dict[dict.compositeDateOptions];
      bodyArgs.composite = true;
      bodyArgs.composite_operation = "max";
      bodyArgs.composite_timestamp_profile = {
        profile_type: "date_range",
        date_range: dateRange,
      };
    } else {
      bodyArgs.composite = false;
    }

    try {
      const res = await fetch("https://vedas.sac.gov.in/ridam_server3/info/", {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          layer: "T0S0I0",
          args: bodyArgs,
        }),
        method: "POST",
      });

      const result = await res.json();
      rawData = result["result"];
    } catch (err) {
      console.error("Error fetching chart data:", err);
      app.loadChartMsg = "Failed to load data";
      return;
    }

    // Extract RGB dates
    const compositeVal =
      layerConfig.parameters.compositeDateOptions.selectedOption.val;
    const rToDate =
      layerConfig.parameters[`rToDate${compositeVal}`].selectedOption;
    console.log("RRR", rToDate);
    const gToDate =
      layerConfig.parameters[`gToDate${compositeVal}`].selectedOption;
    const bToDate =
      layerConfig.parameters[`bToDate${compositeVal}`].selectedOption;

    const rDateVal = new Date(rToDate.lbl).getTime();
    const gDateVal = new Date(gToDate.lbl).getTime();
    const bDateVal = new Date(bToDate.lbl).getTime();

    const maxTsVal =
      Math.max(rDateVal, gDateVal, bDateVal) + 16 * 24 * 60 * 60 * 1000;
    const minTsVal =
      Math.min(rDateVal, gDateVal, bDateVal) - 16 * 24 * 60 * 60 * 1000;

    // Filter NDVI data to match the RGB date range
    rawData.forEach((item) => {
      const timestamp = new Date(item[0]).getTime();
      if (timestamp >= minTsVal && timestamp <= maxTsVal) {
        ndviData.push([timestamp, item[1][0] / 250]);

        console.log(
          "R date comparison",
          new Date(timestamp),
          new Date(rDateVal),
          Math.abs(timestamp - rDateVal)
        );

        if (Math.abs(timestamp - rDateVal) < 23 * 60 * 60 * 1000) {
          rSeries.push({ x: timestamp, y: item[1][0] / 250 });
        }

        if (Math.abs(timestamp - gDateVal) < 23 * 60 * 60 * 1000) {
          gSeries.push({ x: timestamp, y: item[1][0] / 250 });
        }

        if (Math.abs(timestamp - bDateVal) < 23 * 60 * 60 * 1000) {
          bSeries.push({ x: timestamp, y: item[1][0] / 250 });
        }
      }
    });

    console.log("R series", rSeries);
    console.log("G series", gSeries);
    console.log("B series", bSeries);
    console.log("NDVI Data", ndviData);

    // Highcharts series configuration
    const series = [
      {
        marker: { enabled: false },
        name: "NDVI",
        type: "spline",
        color: "skyblue",
        data: ndviData,
      },
      {
        name: "Red",
        type: "column",
        color: "red",
        data: rSeries,
      },
      {
        name: "Green",
        type: "column",
        color: "green",
        data: gSeries,
      },
      {
        name: "Blue",
        type: "column",
        color: "blue",
        data: bSeries,
      },
    ];
    let locInfo = await getAddress(lon, lat);
    // Highcharts configuration
    const highChartObj = {
      chart: {
        zoomType: "x",
      },
      title: {
        text: `<span style='color:rgb(4 136 208);font-weight:bold'>${layerConfig.tools.pointInspect.chart.name}</span>`,
        useHTML: true,
      },
      subtitle: {
        text: `${locInfo}`,
        useHTML: true,
      },
      xAxis: {
        type: "datetime",
      },
      yAxis: {
        // NDVI Axis
        title: { text: "NDVI" },
        min: 0,
        max: 1,
      },
      legend: {
        layout: "horizontal",
        align: "center",
        verticalAlign: "bottom",
      },
      tooltip: {
        shared: true,
        crosshairs: true,
      },
      series: series,
    };

    Highcharts.chart("chart-container", highChartObj);
    app.loadChartMsg = "";
  });
}
async function getOutputAfterPointDrawn(layerConfig, tool, map, app) {
  removeMapInteraction(map);

  map.addInteraction(drawPointVector);
  map.addLayer(vectorlayer);

  drawPointVector.on("drawend", async function (event) {
    document.getElementById("chart-container").innerHTML = "";

    let coord = event.feature.getGeometry().getCoordinates();

    let lon = coord[0];
    let lat = coord[1];
    app.isShowToolOutput = true;
    app.loadChartMsg = "Loading Chart Data";
    let highChartObj = "";
    console.log(`3March `, app.toolLayerConfig);

    highChartObj = await app.toolLayerConfig.generateHighChartObj(
      app.toolLayerConfig,
      app.selectedTool,
      lon,
      lat
    );

    // highChartObj = await app.toolLayerConfig.generateHighChartObj(
    //   layerConfig,
    //   tool,
    //   lon,
    //   lat
    // );

    if (highChartObj) {
      Highcharts.chart("chart-container", highChartObj);
      app.loadChartMsg = ""; // For hiding load chart msg on success
    } else {
      app.loadChartMsg = "No data found";
      app.isShowToolOutput = false;
    }
  });
}

function getOutputAfterPolygonDrawn(layerConfig, tools, map, app) {
  removeMapInteraction(map);
  var colors = [
    "#800000",
    "#000075",
    "#E6194B",
    "#FFA500",
    "#BFEF45",
    "#F032E6",
    "#911EB4",
    "#469990",
    "#FF0000",
    "#00AA00",
    "#0000FF",
    "#770077",
    "#777700",
    "#007777",
    "#FF00FF",
    "#FFFF00",
    "#00FFFF",
    "#007700",
    "#000077",
    "#005566",
  ];

  draw_interaction = new ol.interaction.Draw({
    source: draw_source,
    type: "Polygon",
  });

  draw_interaction.on("drawend", async function (e) {
    map.removeInteraction(draw_interaction);

    app.loadChartMsg = "";
    app.isShowToolOutput = true;
    document.getElementById("chart-container").innerHTML = "";
    drawCount = drawCount + 1;
    var cD = colors[drawCount];
    var curFeatures = e.feature;
    var restFeatures = draw_source.getFeatures();
    var geojson_Format = new ol.format.GeoJSON({});

    curFeatures.setStyle(
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: cD,
          width: 2,
        }),
        fill: new ol.style.Fill({
          color: cD,
        }),
      })
    );
    var color = curFeatures.getStyle().getFill().getColor();
    var colorArray = ol.color.asArray(color).slice();
    colorArray[3] = 0.1;
    curFeatures.getStyle().getFill().setColor(colorArray);

    var drawnPolygonGeojson = geojson_Format.writeFeatures([curFeatures]);

    featureCopyForPost = JSON.parse(drawnPolygonGeojson);

    for (var feati = 0; feati < featureCopyForPost.features.length; feati++) {
      var all_coord = featureCopyForPost.features[feati].geometry.coordinates;
      for (var j = 0; j < all_coord.length; j++) {
        for (var pti = 0; pti < all_coord[j].length; pti++) {
          all_coord[j][pti] = ol.proj.transform(
            all_coord[j][pti],
            "EPSG:4326",
            "EPSG:4326"
          );
        }
      }
    }

    let polygon_coord = featureCopyForPost.features[0].geometry.coordinates[0];

    let res = await getRidamPolygonChartData(polygon_coord);
    console.log("processPolygonChartData(res) -- res = ", res);

    let processedData = processPolygonChartData(
      res,
      layerConfig.chartDataConfig[0]
    );

    if (processedData) {
      let series = [];
      let format = "{value:%d-%b-%Y}";
      if (tools.params.chartType.selectedOption.id == "YoYSeries") {
        series = getYoYSeries(processedData, layerConfig.chartDataConfig[0]);
        format = "{value:%d-%b}";
      } else {
        series.push({ name: tools.chart.name, data: processedData });
      }

      app.chartDataPending = false;
      //  let locInfo = await getAddress(lon, lat);

      // series.push({ name: 'Sentinel-2 NDVI', data: processedData });
      let highChartObj = await returnHighChartObj({
        locInfo: tools.chart.name + "<br>",
        format: format,
        yAxisTitle: "mean",
        yMax: tools.chart.yMax,
        yMin: tools.chart.yMin,
        series: series,
      });

      if (highChartObj) {
        Highcharts.chart("chart-container", highChartObj);
        app.loadChartMsg = "";
      }
    }
  });

  map.addInteraction(draw_interaction);

  map.addLayer(draw_vector);
  draw_vector.setZIndex(15);
}

let chartTypeOptions = {
  fullSeries: {
    id: "fullSeries",
    displayName: "Full Series",
    format: "{value:%d-%b-%Y}",
  },
  yoySeries: {
    id: "YoYSeries",
    displayName: "Year over Year Profile",
    format: "{value:%d-%b}",
  },
  // heatMapSeries:{
  //   id:'heatMapSeries',
  //   displayName:'Heatmap Profile',
  // }
};
export const layers = {
  ndvi_5d: {
    id: "ndvi_5d",
    displayName: "Sentinel-2 NDVI Composite",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjForS2NDVIProfileWithCMASK,
    chartDataConfig: [
      {
        datasetId: "T3S1P1",
        name: "Sentinel-2",
        type: "spline",
        valueConvertor: (x) => x / 250,
        processChartData: createSeparateArraysForXandYAxis,
      },
      {
        datasetId: "T0S5P1",
        name: "Cloud mask",
        type: "column",
        processChartData: createSeparateArraysForXandYAxis,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Sentinel-2 NDVI",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
          yMax: 1.0,
          yMin: 0,
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
      polygonInspect: {
        id: "polygonInspect",
        displayName: "Polygon-Inspect",
        name: "NDVI Polygon Inspect Profile",
        runTool: getOutputAfterPolygonDrawn,
        helpText: "Draw a polygon on map to get a profile",
        chart: {
          name: "Sentinel-2 NDVI",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
          yMax: 1,
          yMin: 0,
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
    },

    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },

      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S1P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:FFFFFF00:0:f0ebecFF:0.1:d8c4b6FF:0.2:ab8a75FF:0.3:917732FF:0.4:70ab06FF:0.5:459200FF:0.6:267b01FF:0.7:0a6701FF:0.8:004800FF:1:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:{{{operation}}};dataset_id:T3S1P1;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:1:f0ebecFF:25:d8c4b6FF:50:ab8a75FF:75:917732FF:100:70ab06FF:125:459200FF:150:267b01FF:175:0a6701FF:200:004800FF:251:001901FF:252:001901FF:255:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  maxar: {
    id: "maxar",
    displayName: "Ahmedabad High Resolution Imagery (15cm)",
    isShow: true,
    type: "tile",
    parameters: {
      fromDate: {
        displayName: "From",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        isSetDefaultDate: true,
        defaultSelectedOption: { lbl: "2023-02-03", val: "20230203" },

        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
      toDate: {
        displayName: "To",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server/meta/dataset_timestamp?prefix=",
    datasetId: "T6S1P3",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RIDAM_RGB",
        layers: "T0S0M1",
        PROJECTION: projection,
        ARGS: "r_merge_method:last;g_merge_method:last;b_merge_method:last;r_dataset_id:T6S1P3;g_dataset_id:T6S1P3;b_dataset_id:T6S1P3;r_from_time:{{{fromDate}}};r_to_time:{{{toDate}}};g_from_time:{{{fromDate}}};g_to_time:{{{toDate}}};b_from_time:{{{fromDate}}};b_to_time:{{{toDate}}};r_index:3;g_index:2;b_index:1;r_max:700;g_max:1000;b_max:800",
      },
    },
    layer: "",
    zIndex: 0,
  },
  maxar_guajarat: {
    id: "maxar_guajarat",
    displayName: "Gujarat High Resolution Imagery (30cm)",
    isShow: true,
    type: "tile",
    // parameters: {
    //   toDate: {
    //     displayName: "Date",
    //     type: "calendar",
    //     selectedOption: {
    //       val: new Date('2025-07-01').toISOString().slice(0, 10),
    //       lbl: new Date('2025-07-01').toISOString().slice(0, 10),
    //     },
    //   },
    // },
    // parameters: {
    //   toDate: {
    //     displayName: "Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     isShowPrevYearOption: true,
    //     selectedOption: "",
    //     optionGenerator: async function (
    //       url,
    //       datasetId,
    //       splitDateAt,
    //       addNumberOfdaysInLabel
    //     ) {
    //       return await getAvlDates(
    //         url,
    //         datasetId,
    //         splitDateAt,
    //         "",
    //         "",
    //         addNumberOfdaysInLabel
    //       );
    //     },
    //   },
    // },
    parameters: {
      fromDate: {
        displayName: "From",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        isSetDefaultDate: true,
        defaultSelectedOption: { lbl: "2022-01-15", val: "20220115" },

        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
      toDate: {
        displayName: "To",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T6S1P10",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RIDAM_RGB",
        layers: "T0S0M1",
        PROJECTION: projection,
        ARGS: "r_merge_method:last;g_merge_method:last;b_merge_method:last;r_dataset_id:T6S1P10;g_dataset_id:T6S1P10;b_dataset_id:T6S1P10;r_from_time:{{{fromDate}}};r_to_time:{{{toDate}}};g_from_time:{{{fromDate}}};g_to_time:{{{toDate}}};b_from_time:{{{fromDate}}};b_to_time:{{{toDate}}};r_index:3;g_index:2;b_index:1;r_max:255;g_max:255;b_max:255",
        //ARGS: "r_merge_method:last;g_merge_method:last;b_merge_method:last;r_dataset_id:T6S1P10;g_dataset_id:T6S1P10;b_dataset_id:T6S1P10;r_from_time:'2025-07-01';r_to_time:'2025-09-01';g_from_time:'2025-07-01';g_to_time:'2025-09-01';b_from_time:'2025-07-01';b_to_time:'2025-09-01';r_index:3;g_index:2;b_index:1;r_max:255;g_max:255;b_max:255",
      },
    },
    layer: "",
    zIndex: 0,
  },

  maxar_tree: {
    id: "maxar_tree",
    displayName: "  High resolution Tree Cover (15cm)",
    isShow: true,
    type: "tile",
    // autoActivateTool: true,
    // generateHighChartObj: generateHighChartObjFromRidam,

    // tools: {
    //   pointInspect: {
    //     id: "pointInspect",
    //     displayName: "Point-Inspect",
    //     name: "Soil moisture Point Inspect Profile",
    //     runTool: getOutputAfterPointDrawn,
    //     showAllMergeOperationSeries: false,
    //     helpText: "Click on a map to get a profile",
    //     chart: {
    //       name: "Soil moisture",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //       // yMax: 1.0,
    //       // yMin: 0
    //     },
    //     params: {
    //       chartType: {
    //         displayName: "Chart Type",
    //         type: "choice",
    //         options: chartTypeOptions,
    //         selectedOption: chartTypeOptions["fullSeries"],
    //       },
    //     },
    //   },
    // },
    parameters: {
      fromDate: {
        displayName: "From",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        isSetDefaultDate: true,
        defaultSelectedOption: { lbl: "2023-02-03", val: "20230203" },

        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
      toDate: {
        displayName: "To",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server/meta/dataset_timestamp?prefix=",
    datasetId: "T6S1P5",
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES= Trees:32CD32FF;&LEGEND_OPTIONS=columnHeight:950;height:200;width:300",

    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P5;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES: "[0:FFFFFF00:1:FFFFFF00:2:32CD32FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
      extent: [69, 20, 72, 25],
    },
  },
  maxar_tree_building: {
    id: "maxar_tree_building",
    displayName: "High resolution Tree & Building  Cover (15cm)",
    isShow: true,
    type: "tile",
    // autoActivateTool: true,
    // generateHighChartObj: generateHighChartObjFromRidam,

    // tools: {
    //   pointInspect: {
    //     id: "pointInspect",
    //     displayName: "Point-Inspect",
    //     name: "Soil moisture Point Inspect Profile",
    //     runTool: getOutputAfterPointDrawn,
    //     showAllMergeOperationSeries: false,
    //     helpText: "Click on a map to get a profile",
    //     chart: {
    //       name: "Soil moisture",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //       // yMax: 1.0,
    //       // yMin: 0
    //     },
    //     params: {
    //       chartType: {
    //         displayName: "Chart Type",
    //         type: "choice",
    //         options: chartTypeOptions,
    //         selectedOption: chartTypeOptions["fullSeries"],
    //       },
    //     },
    //   },
    // },
    parameters: {
      fromDate: {
        displayName: "From",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        isSetDefaultDate: true,
        defaultSelectedOption: { lbl: "2023-02-03", val: "20230203" },

        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
      toDate: {
        displayName: "To",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server/meta/dataset_timestamp?prefix=",
    datasetId: "T6S1P7",
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES= Trees:32CD32FF;Buildings:910D09FF;&LEGEND_OPTIONS=columnHeight:950;height:200;width:300",

    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P7;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES: "[0:FFFFFF00:1:910D09FF:2:32CD32FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
      extent: [69, 20, 72, 25],
    },
  },
  maxar_tree_building_road_water: {
    id: "maxar_tree_building_road_water",
    displayName: "  High resolution Land Cover (30cm)",
    isShow: true,
    type: "tile",

    parameters: {
      fromDate: {
        displayName: "From",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        isSetDefaultDate: true,
        defaultSelectedOption: { lbl: "2022-02-17", val: "20220217" },

        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
      toDate: {
        displayName: "To",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        isSetDefaultDate: true,
        defaultSelectedOption: { lbl: "2025-09-01", val: "20250901" },

        //selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },

      operation: {
        displayName: "Select Entity",
        type: "choice",
        options: maxarparam,
        selectedOption: maxarparam[0],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server/meta/dataset_timestamp?prefix=",
    datasetId: "T6S1P12",
    legendUrl: "",
    legendHeight: "300",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P12;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES: "",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
      extent: [69, 20, 72, 25],
    },
  },
  maxar_building: {
    id: "maxar_building",
    displayName: "  High Resolution Buildup (15cm)",
    isShow: true,
    type: "tile",
    // autoActivateTool: true,
    // generateHighChartObj: generateHighChartObjFromRidam,

    // tools: {
    //   pointInspect: {
    //     id: "pointInspect",
    //     displayName: "Point-Inspect",
    //     name: "Soil moisture Point Inspect Profile",
    //     runTool: getOutputAfterPointDrawn,
    //     showAllMergeOperationSeries: false,
    //     helpText: "Click on a map to get a profile",
    //     chart: {
    //       name: "Soil moisture",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //       // yMax: 1.0,
    //       // yMin: 0
    //     },
    //     params: {
    //       chartType: {
    //         displayName: "Chart Type",
    //         type: "choice",
    //         options: chartTypeOptions,
    //         selectedOption: chartTypeOptions["fullSeries"],
    //       },
    //     },
    //   },
    // },
    parameters: {
      fromDate: {
        displayName: "From",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        isSetDefaultDate: true,
        defaultSelectedOption: { lbl: "2023-02-03", val: "20230203" },

        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
      toDate: {
        displayName: "To",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server/meta/dataset_timestamp?prefix=",
    datasetId: "T6S1P6",
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES= buildings:910D09FF;&LEGEND_OPTIONS=columnHeight:950;height:200;width:300",

    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P6;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES: "[0:FFFFFF00:1:910D09FF:2:FFFFFF00];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
      extent: [69, 20, 72, 25],
    },
  },
  swot_surface_water_elevation_umask: {
    id: "swot_surface_water_elevation_umask",
    displayName: "SWOT Surface Water Elevation (Unmasked)",
    isShow: true,
    type: "tile",
    // autoActivateTool: true,

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T0S2P3",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[50:048ffaff:500:69f0aeff:1000:e31313ff]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2a/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T2S1M4",
        PROJECTION: "EPSG:4326",
        ARGS: "from_time:{{{toDate}}};to_time:{{{toDate}}};isUnmasked:1",
        STYLES: "[50:048ffaff:500:69f0aeff:1000:e31313ff];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  swot_surface_water_elevation: {
    id: "swot_surface_water_elevation",
    displayName: "SWOT Surface Water Elevation",
    isShow: true,
    type: "tile",
    // autoActivateTool: true,

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T0S2P3",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[50:048ffaff:500:69f0aeff:1000:e31313ff]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2a/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T2S1M4",
        PROJECTION: "EPSG:4326",
        ARGS: "from_time:{{{toDate}}};to_time:{{{toDate}}}",
        STYLES: "[50:048ffaff:500:69f0aeff:1000:e31313ff];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  Range_analysis: {
    id: "Range_analysis",
    displayName: "S2 NDVI Range Analysis",
    isShow: true,
    type: "tile",
    isDifference: true,
    autoActivateTool: true,

    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Range Analysis Chart",
        name: "NDVI Point Inspect Profile",
        runTool: range_analysis_chart,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Range Analysis",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
          yMax: 1.0,
          yMin: 0,
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },

    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },
      // aToDate: {
      //   showIfProperty: "compositeDateOptions",
      //   showIfVal: 1,
      //   displayName: "A-Date",
      //   type: "choice",
      //   typeOfData: "date",
      //   options: [],
      //   selectedOption: "",
      //   isSetDefaultDate: true,
      //   isShowPrevYearOption: true,
      //   optionGenerator: async function (url, datasetId, splitDateAt) {
      //     return await getAvlDates(url, datasetId, splitDateAt);
      //   },
      // },
      // aToDate5: {
      //   showIfProperty: "compositeDateOptions",
      //   showIfVal: 5,
      //   displayName: "A-Date",
      //   type: "choice",
      //   typeOfData: "date",
      //   options: [],
      //   selectedOption: "",
      //   isSetDefaultDate: true,
      //   isShowPrevYearOption: true,
      //   defaultSelectedOption: { lbl: "2024-08-08", val: "20240808" },
      //   optionGenerator: async function (url, datasetId, splitDateAt) {
      //     return await getAvlDates(url, datasetId, splitDateAt, [
      //       { fromDt: "01", toDt: "05", valToPush: "03" },
      //       { fromDt: "06", toDt: "10", valToPush: "08" },
      //       { fromDt: "11", toDt: "15", valToPush: "13" },
      //       { fromDt: "16", toDt: "20", valToPush: "18" },
      //       { fromDt: "21", toDt: "25", valToPush: "23" },
      //       { fromDt: "26", toDt: "31", valToPush: "28" },
      //     ]);
      //   },
      // },
      aToDate10: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 10,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,

        defaultSelectedOption: { lbl: "2024-08-15", val: "20240815" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "10", valToPush: "05" },
            { fromDt: "11", toDt: "20", valToPush: "15" },
            { fromDt: "21", toDt: "31", valToPush: "25" },
          ]);
        },
      },
      bToDate10: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 10,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 1 },
        //defaultSelectedOption: { lbl: "2023-03-15", val: "20230315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "10", valToPush: "05" },
            { fromDt: "11", toDt: "20", valToPush: "15" },
            { fromDt: "21", toDt: "31", valToPush: "25" },
          ]);
        },
      },

      threshold: {
        displayName: "Threshold",
        type: "choice",
        options: ndvi_range_analysis_options,
        selectedOption: ndvi_range_analysis_options[6],
        displayNameStyle: {
          color: "black",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S1P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0.0:0E0EFFFF:0.125:4040FFFF:0.25:40A8FFFF:0.375:40FFFFFF:0.5:A8FFA8FF:0.625:FFFF40FF:0.75:FFA800FF:0.875:FF4000FF:1.0:FF0000FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T0S1M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:mean;dataset_id:T3S1P1;dt1:{{{aFromDate}}};dt4:{{{bToDate}}};threshold:{{{threshold}}}",
        STYLES:
          "[0.0:0E0EFFFF:0.125:4040FFFF:0.25:40A8FFFF:0.375:40FFFFFF:0.5:A8FFA8FF:0.625:FFFF40FF:0.75:FFA800FF:0.875:FF4000FF:1.0:FF0000FF];nodata:FFFFFFFF",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  AOD_OCM: {
    id: "AOD_OCM",
    displayName: " Aerosol Optical Depth (OCM3)",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjFromRidam,
    chartDataConfig: [
      {
        datasetId: "T5S1P10",
        name: " Aerosol Optical Depth (OCM3)",
        type: "spline",
        valueConvertor: (x) => x,
        processChartData: processChartData,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,

        helpText: "Click on a map to get a profile",
        chart: {
          name: " Aerosol Optical Depth (OCM3)",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
          //   yMax: 3.0,
          //   yMin: 0
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
      polygonInspect: {
        id: "polygonInspect",
        displayName: "Polygon-Inspect",
        name: "NDVI Polygon Inspect Profile",
        runTool: getOutputAfterPolygonDrawn,
        helpText: "Draw a polygon on map to get a profile",
        chart: {
          name: " Aerosol Optical Depth (OCM3)",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
          yMax: 1,
          yMin: 0,
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
    },

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T5S1P10",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[-1:00000000:-0.1:00000000:0:FFFCC7FF:0.17:FFDD69FF:0.33:FFCB4EFF:0.5:FFB43AFF:0.66:FF9829FF:1.25:FF7F21FF:0.83:FF5818FF:1.33:FA3512FF:1.66:95000EFF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T5S1P10;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[-1:00000000:-0.1:00000000:0:FFFCC7FF:0.17:FFDD69FF:0.33:FFCB4EFF:0.5:FFB43AFF:0.66:FF9829FF:1.25:FF7F21FF:0.83:FF5818FF:1.33:FA3512FF:1.66:95000EFF;nodata:FFFFFF00]",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  AOD_MODIS_pm: {
    id: "AOD_MODIS_pm",
    displayName: " MODIS PM 2.5 Weekly Composite",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjFromRidam,
    chartDataConfig: [
      {
        datasetId: "T5S1P9",
        name: " MODIS PM 2.5 Weekly Composite",
        type: "spline",
        valueConvertor: (x) => x,
        processChartData: processChartData,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: " MODIS PM 2.5 Weekly Composite",
        runTool: getOutputAfterPointDrawn,

        helpText: "Click on a map to get a profile",
        chart: {
          name: " MODIS PM 2.5 Weekly Composite",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
          //   yMax: 3.0,
          //   yMin: 0
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
      polygonInspect: {
        id: "polygonInspect",
        displayName: "Polygon-Inspect",
        name: "MODIS PM 2.5 Weekly Composite",
        runTool: getOutputAfterPolygonDrawn,
        helpText: "Draw a polygon on map to get a profile",
        chart: {
          name: " MODIS PM 2.5 Weekly Composite",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
          yMax: 1,
          yMin: 0,
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
    },

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T5S1P9",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:00000000:10:00000000:12:FFFCC7FF:25:FFDD69FF:45:FFCB4EFF:58:FFB43AFF:70:FF9829FF:90:FF7F21FF:100:FF7F21FF:115:FA3512FF:130:FF5818FF:160:FA3512FF:200:95000EFF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T5S1P9;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:00000000:10:00000000:12:FFFCC7FF:25:FFDD69FF:45:FFCB4EFF:58:FFB43AFF:70:FF9829FF:90:FF7F21FF:100:FF7F21FF:115:FA3512FF:130:FF5818FF:160:FA3512FF:200:95000EFF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  //   id: "AOD_OCM",
  //   displayName: " Aerosol Optical Depth (OCM3)",
  //   isShow: true,
  //   type: "tile",
  //   autoActivateTool: true,
  //   generateHighChartObj: generateHighChartObjFromRidam,
  //   chartDataConfig: [
  //     {
  //       datasetId: "T5S1P10",
  //       name: " Aerosol Optical Depth (OCM3)",
  //       type: "spline",
  //       valueConvertor: (x) => x,
  //       processChartData: processChartData,
  //     },

  //   ],
  //   tools: {
  //     pointInspect: {
  //       id: "pointInspect",
  //       displayName: "Point-Inspect",
  //       name: "NDVI Point Inspect Profile",
  //       runTool: getOutputAfterPointDrawn,

  //       helpText: "Click on a map to get a profile",
  //       chart: {
  //         name: " Aerosol Optical Depth (OCM3)",
  //         yAxisTitle: "mean",
  //         format: "{value:%d-%b-%Y}",
  //         yMax: 1.0,
  //         yMin: 0
  //       },
  //       params: {
  //         chartType: {
  //           displayName: "Chart Type",
  //           type: "choice",
  //           options: chartTypeOptions,
  //           selectedOption: chartTypeOptions["fullSeries"],
  //         },
  //       },
  //     },
  //     polygonInspect: {
  //       id: "polygonInspect",
  //       displayName: "Polygon-Inspect",
  //       name: "NDVI Polygon Inspect Profile",
  //       runTool: getOutputAfterPolygonDrawn,
  //       helpText: "Draw a polygon on map to get a profile",
  //       chart: {
  //         name: " Aerosol Optical Depth (OCM3)",
  //         yAxisTitle: "mean",
  //         format: "{value:%d-%b-%Y}",
  //         yMax: 1,
  //         yMin: 0
  //       },
  //       params: {
  //         chartType: {
  //           displayName: "Chart Type",
  //           type: "choice",
  //           options: chartTypeOptions,
  //           selectedOption: chartTypeOptions["yoySeries"],
  //         },
  //       },
  //     },
  //   },

  //   parameters: {
  //     toDate: {
  //       displayName: "Date",
  //       type: "choice",
  //       typeOfData: "date",
  //       options: [],
  //       isShowPrevYearOption: true,
  //       selectedOption: "",
  //       optionGenerator: async function (
  //         url,
  //         datasetId,
  //         splitDateAt,
  //         addNumberOfdaysInLabel
  //       ) {
  //         return await getAvlDates(
  //           url,
  //           datasetId,
  //           splitDateAt,
  //           "",
  //           "",
  //           addNumberOfdaysInLabel
  //         );
  //       },
  //     },
  //   },
  //   uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
  //   dateURL:
  //     "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
  //   datasetId: "T5S1P10",
  //   splitDateAt: 2,
  //   legendUrl:
  //     "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:FFFFFF00:0:f0ebecFF:0.1:d8c4b6FF:0.2:ab8a75FF:0.3:917732FF:0.4:70ab06FF:0.5:459200FF:0.6:267b01FF:0.7:0a6701FF:0.8:004800FF:1:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
  //   layerFactoryParams: {
  //     urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
  //     projection: "EPSG:4326",

  //     layerParams: {
  //       name: "RDSGrdient",
  //       layers: "T0S0M0",
  //       PROJECTION: "EPSG:4326",
  //       AARGS: "merge_method:max;dataset_id:T5S1P10;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
  //       STYLES:
  //         "[-1:00000000:-0.1:00000000:0:FFFCC7FF:0.17:FFDD69FF:0.33:FFCB4EFF:0.5:FFB43AFF:0.66:FF9829FF:1.25:FF7F21FF:0.83:FF5818FF:1.33:FA3512FF:1.66:95000EFF;nodata:FFFFFF00]",
  //       LEGEND_OPTIONS: "columnHeight:400;height:100",
  //     },
  //     layer: "",
  //     zIndex: 0,
  //   },
  // },

  ndmi_cmask: {
    id: "ndmi_cmask",
    displayName: "Sentinel-2 NDMI (Cloud Masked)",
    isShow: true,
    type: "tile",

    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },

      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S6P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[-0.2:EE0000FF:0:FDFE25FF:0.07:CBD921FF:0.14:516B12FF:0.35:314606FF:0.5:152106FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T5S1M1",
        PROJECTION: "EPSG:4326",
        ARGS: "from_time:{{{fromDate}}};to_time:{{{toDate}}};param:NDMI_CMASK",
        STYLES:
          // "[-2:FFFFFF00:0:FFFFFF00:101:EE0000FF:126:FDFE25FF:133:CBD921FF:138:516B12FF:157:314606FF:169:152106FF:255:152106FF];nodata:FFFFFF00",
          "[-2:FFFFFF00:0:FFFFFF00:101:EE0000FF:126:FDFE25FF:135:CBD921FF:144:516B12FF:170:314606FF:189:152106FF:255:152106FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  ndvi_scene_classification: {
    id: "ndvi_scene_classification",
    displayName: "Sentinel-2 Scene classification",
    isShow: true,
    type: "tile",
    autoActivateTool: true,

    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Sentinel-2 Scene classification",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
      polygonInspect: {
        id: "polygonInspect",
        displayName: "Polygon-Inspect",
        name: "NDVI Polygon Inspect Profile",
        runTool: getOutputAfterPolygonDrawn,
        helpText: "Draw a polygon on map to get a profile",
        chart: {
          name: "Sentinel-2 Scene classification",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
    },
    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    // parameters: {
    //   toDate: {
    //     displayName: "Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     isShowPrevYearOption: true,
    //     selectedOption: "",
    //     optionGenerator: async function (
    //       url,
    //       datasetId,
    //       splitDateAt,
    //       addNumberOfdaysInLabel
    //     ) {
    //       return await getAvlDates(
    //         url,
    //         datasetId,
    //         splitDateAt,
    //         "",
    //         "",
    //         addNumberOfdaysInLabel
    //       );

    //     },
    //   },
    //   operation: {
    //     displayName: "Op.",
    //     type: "choice",
    //     options: operationOptions,
    //     selectedOption: operationOptions[0],
    //   },
    // },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server2b/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P6",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Saturated Pixel:ff0000FF;Dark shadow:2f2f2fFF;Cloud shadow:00BECCFF;Vegetation:00a000FF;Non Vegetation:ffe65aFF;Water:0000ffFF;Unclassified:808080FF;Cloud:64c8ffFF;Snow or Ice:ff96ffFF;&LEGEND_OPTIONS=columnHeight:950;height:200;width:300",
    legendHeight: "400px",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T0S1P6;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:1:ff0000FF:2:2f2f2fFF:3:00BECCFF:4:00a000FF:5:ffe65aFF:6:0000ffFF:7:808080FF:8:64c8ffFF:9:64c8ffFF:10:64c8ffFF:11:ff96ffFF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  ndvi_5d_village_level: {
    id: "ndvi_5d_village_level",
    displayName: "Sentinel-2 NDVI Composite Village Level",
    isShow: true,
    type: "tile",
    isDatesFromGeoEntity: true,
    geoEntityConfig: {
      paramId: "108",
      sourceId: 12,
    },

    parameters: {
      toDate: {
        displayName: "Date",
        typeOfData: "date",
        type: "choice",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        defaultSelectedOption: "",
        optionGenerator: async function (url, geoEntityObj) {
          return await getDatesFromGeoEntity(url, geoEntityObj);
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/geoentity-services/api/geoentity-sources/",
    datasetId: "T3S1P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:FFFFFF00:0:f0ebecFF:0.1:d8c4b6FF:0.2:ab8a75FF:0.3:917732FF:0.4:70ab06FF:0.5:459200FF:0.6:267b01FF:0.7:0a6701FF:0.8:004800FF:1:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2b/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M4",
        PROJECTION: "EPSG:4326",
        ARGS: "geoentity_source_id:12;param_id:108;param_path:mean;date:{{{toDate}}}",
        STYLES:
          "[0:FFFFFF00:1:f0ebecFF:25:d8c4b6FF:50:ab8a75FF:75:917732FF:100:70ab06FF:125:459200FF:150:267b01FF:175:0a6701FF:200:004800FF:251:001901FF:252:001901FF:255:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  modis_ndvi_village_level: {
    id: "modis_ndvi_village_level",
    displayName: "Modis NDVI Composite Village Level",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjModisVillage,
    isDatesFromGeoEntity: true,
    geoEntityConfig: {
      paramId: "21",
      sourceId: 21,
    },
    chartDataConfig: [
      {
        datasetId: "T3S1P2",
        name: "MODIS NDVI",
        type: "spline",
        valueConvertor: (x) => x / 250,
        processChartData: createSeparateArraysForXandYAxis,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Modis NDVI Composite Tehsil Level",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
      polygonInspect: {
        id: "polygonInspect",
        displayName: "Polygon-Inspect",
        name: "NDVI Polygon Inspect Profile",
        runTool: getOutputAfterPolygonDrawn,
        helpText: "Draw a polygon on map to get a profile",
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },
    parameters: {
      toDate: {
        displayName: "Date",
        typeOfData: "date",
        type: "choice",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        defaultSelectedOption: "",
        optionGenerator: async function (url, geoEntityObj) {
          return await getDatesFromGeoEntity(url, geoEntityObj);
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/geoentity-services/api/geoentity-sources/",
    datasetId: "T3S1P2",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:FFFFFF00:0:f0ebecFF:0.1:d8c4b6FF:0.2:ab8a75FF:0.3:917732FF:0.4:70ab06FF:0.5:459200FF:0.6:267b01FF:0.7:0a6701FF:0.8:004800FF:1:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2b/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M4",
        PROJECTION: "EPSG:4326",
        ARGS: "geoentity_source_id:21;param_id:21;param_path:mean;date:{{{toDate}}}",
        STYLES:
          "[0:FFFFFF00:1:f0ebecFF:25:d8c4b6FF:50:ab8a75FF:75:917732FF:100:70ab06FF:125:459200FF:150:267b01FF:175:0a6701FF:200:004800FF:251:001901FF:252:001901FF:255:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  modis_ndvi_tehsil_level: {
    id: "modis_ndvi_tehsil_level",
    displayName: "Modis NDVI Composite Tehsil Level",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjModisTehsil,
    isDatesFromGeoEntity: true,
    geoEntityConfig: {
      paramId: "21",
      sourceId: 20,
    },
    chartDataConfig: [
      {
        datasetId: "T3S1P2",
        name: "MODIS NDVI",
        type: "spline",
        valueConvertor: (x) => x / 250,
        processChartData: createSeparateArraysForXandYAxis,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Modis NDVI Composite Tehsil Level",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
      polygonInspect: {
        id: "polygonInspect",
        displayName: "Polygon-Inspect",
        name: "NDVI Polygon Inspect Profile",
        runTool: getOutputAfterPolygonDrawn,
        helpText: "Draw a polygon on map to get a profile",
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },

    parameters: {
      toDate: {
        displayName: "Date",
        typeOfData: "date",
        type: "choice",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        defaultSelectedOption: "",
        optionGenerator: async function (url, geoEntityObj) {
          return await getDatesFromGeoEntity(url, geoEntityObj);
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/geoentity-services/api/geoentity-sources/",
    datasetId: "T3S1P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:FFFFFF00:0:f0ebecFF:0.1:d8c4b6FF:0.2:ab8a75FF:0.3:917732FF:0.4:70ab06FF:0.5:459200FF:0.6:267b01FF:0.7:0a6701FF:0.8:004800FF:1:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2b/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M4",
        PROJECTION: "EPSG:4326",
        ARGS: "geoentity_source_id:20;param_id:21;param_path:mean;date:{{{toDate}}}",
        STYLES:
          "[0:FFFFFF00:1:f0ebecFF:25:d8c4b6FF:50:ab8a75FF:75:917732FF:100:70ab06FF:125:459200FF:150:267b01FF:175:0a6701FF:200:004800FF:251:001901FF:252:001901FF:255:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  modis_ndvi_district_level: {
    id: "modis_ndvi_district_level",
    displayName: "Modis NDVI Composite District Level",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjModisDistrict,
    isDatesFromGeoEntity: true,
    geoEntityConfig: {
      paramId: "21",
      sourceId: 19,
    },
    chartDataConfig: [
      {
        datasetId: "T3S1P2",
        name: "MODIS NDVI",
        type: "spline",
        valueConvertor: (x) => x / 250,
        processChartData: createSeparateArraysForXandYAxis,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Modis NDVI Composite Tehsil Level",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
      polygonInspect: {
        id: "polygonInspect",
        displayName: "Polygon-Inspect",
        name: "NDVI Polygon Inspect Profile",
        runTool: getOutputAfterPolygonDrawn,
        helpText: "Draw a polygon on map to get a profile",
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },

    parameters: {
      toDate: {
        displayName: "Date",
        typeOfData: "date",
        type: "choice",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        defaultSelectedOption: "",
        optionGenerator: async function (url, geoEntityObj) {
          return await getDatesFromGeoEntity(url, geoEntityObj);
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/geoentity-services/api/geoentity-sources/",
    datasetId: "T3S1P2",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:FFFFFF00:0:f0ebecFF:0.1:d8c4b6FF:0.2:ab8a75FF:0.3:917732FF:0.4:70ab06FF:0.5:459200FF:0.6:267b01FF:0.7:0a6701FF:0.8:004800FF:1:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2b/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M4",
        PROJECTION: "EPSG:4326",
        ARGS: "geoentity_source_id:19;param_id:21;param_path:mean;date:{{{toDate}}}",
        STYLES:
          "[0:FFFFFF00:1:f0ebecFF:25:d8c4b6FF:50:ab8a75FF:75:917732FF:100:70ab06FF:125:459200FF:150:267b01FF:175:0a6701FF:200:004800FF:251:001901FF:252:001901FF:255:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  cold_storage: referenceLayers["cold_storage"],
  dem: referenceLayers["dem"],
  Wetland_boundary: referenceLayers["Wetland_boundary"],
  cities_town: referenceLayers["cities_town"],
  village_boundary: referenceLayers["village_boundary"],
  taluka_boundary: referenceLayers["taluka_boundary"],
  district_boundary: referenceLayers["district_boundary"],
  up_dist_boundary: referenceLayers["up_dist_boundary"],
  indian_state_boundary: referenceLayers["indian_state_boundary"],
  base_map_map_my_india_hybrid: referenceLayers["base_map_map_my_india_hybrid"],
  base_map_map_my_india_hybrid_label:
    referenceLayers["base_map_map_my_india_hybrid_label"],
  countries: referenceLayers["countries"],
  Gujarat_cadastral: referenceLayers["Gujarat_cadastral"],
  Gujarat_cadastral_label: referenceLayers["Gujarat_cadastral_label"],

  maxar_solar_panel: referenceLayers["maxar_solar_panel"],
  // solar_panel_same:referenceLayers["solar_panel_same"],
  solar_panel: referenceLayers["solar_panel"],
  national_highway: referenceLayers["national_highway"],
  railway_tracks: referenceLayers["railway_tracks"],
  railway_stations: referenceLayers["railway_stations"],
  airports: referenceLayers["airports"],
  administrative_boundary_bhuvan:
    referenceLayers["administrative_boundary_bhuvan"],
  administrative_boundary_soi: referenceLayers["administrative_boundary_soi"],
  bodhi_bihar_admin: referenceLayers["bodhi_bihar_admin"],
  high_resolution_imagery_bhuvan:
    referenceLayers["high_resolution_imagery_bhuvan"],
  maxar_tile_labels: referenceLayers["maxar_tile_labels"],
  gujarat_high_resolution: referenceLayers["gujarat_high_resolution"],
  gujarat_high_resolution_metadata:
    referenceLayers["gujarat_high_resolution_metadata"],
  gujarat_high_resolution_aoi: referenceLayers["gujarat_high_resolution_aoi"],
  insat_visible_1km: {
    id: "insat_visible_1km",
    displayName: "INSAT - Visible [1km]",
    isShow: true,
    type: "legacy",
    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        optionGenerator: async function (url) {
          return getInsatAvlDates(url);
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertorInsat,
    dateURL:
      "https://mosdac.gov.in/live/backend/satellite_data_initial.php?file_prefix=3RIMG&file_extension=L1B_STD_V01R00&param=startlayer&timezone=local&timezone_formal=-19800",
    layerFactoryParams: {
      projection: insatProjection,
      urlTemplate:
        "https://mosdac.gov.in/live_data/wms/live3RL1BSTD1km/products/Insat3r/3R_IMG/{{{year}}}/{{{curDate}}}/3RIMG_{{{selectedDateVal}}}_L1B_STD_V01R00.h5",
      layerParams: {
        LAYERS: "IMG_VIS",
        FORMAT: "image/png",
        VERSION: "1.3.0",
        STYLES: "boxfill/greyscale",
        COLORSCALERANGE: "0,407",
        BELOWMINCLOR: "extend",
        ABOVEMAXCOLOR: "extend",
        CRS: insatProjection,
      },
    },
    layer: "",
    zIndex: 0,
  },
  insat_thermal_4km: {
    id: "insat_thermal_4km",
    displayName: "INSAT - Thermal [4km]",
    isShow: true,
    type: "insat",
    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        optionGenerator: async function (url) {
          return getInsatAvlDates(url);
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertorInsat,
    dateURL:
      // "https://mosdac.gov.in/live/backend/satellite_data_initial.php?file_prefix=3DIMG&file_extension=L1B_STD_V01R00&param=startlayer&timezone=local&timezone_formal=-19800",
      "https://mosdac.gov.in/live/backend/satellite_data_initial.php?file_prefix=3RIMG&file_extension=L1B_STD_V01R00&param=startlayer&timezone=local&timezone_formal=-19800",
    layerFactoryParams: {
      urlTemplate:
        "https://mosdac.gov.in/live_data/wms/live3RL1BSTD4km/products/Insat3r/3R_IMG/{{{year}}}/{{{curDate}}}/3RIMG_{{{selectedDateVal}}}_L1B_STD_V01R00.h5",
      // "https://mosdac.gov.in/live_data/wms/live3DL1BSTD4km/products/Insat3d/3D_IMG/{{{year}}}/{{{curDate}}}/3DIMG_{{{selectedDateVal}}}_L1B_STD_V01R00.h5",
      layerParams: {
        LAYERS: "IMG_TIR1",
        FORMAT: "image/png",
        VERSION: "1.3.0",
        STYLES: "boxfill/greyscale",
        COLORSCALERANGE: "260,921",
        BELOWMINCLOR: "extend",
        ABOVEMAXCOLOR: "extend",
        CRS: insatProjection,
      },
    },
    layer: "",
    zIndex: 0,
  },
  sisdp_10k_lulc_2016_19l1: {
    id: "sisdp_10k_lulc_2016_19l1",
    displayName: "SISDP 10K LULC 2016-19 Level I",
    isShow: true,
    type: "tile",
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T0S6P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Agriculture:fcf31c;Built-ip:e60000;Forest:73cb07;Grasslands%20/%20Grazing%20Lands:b2d718;Others:e0e6fc;Wastelands:e8abf9;Water%20Bodies:5f99ff;&LEGEND_OPTIONS=columnHeight:950;height:200;width:300",
    legendHeight: "400px",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T0S6P1;from_time:20241231;to_time:20241231;indexes:1",
        STYLES:
          "0:ffffffff;[1:fcf31c:8);[8:e60000:41);[41:73cb07:49);[49:b2d718:53);[53:e0e6fc:62);[62:e8abf9:79);[79:5f99ff:91);",

        LEGEND_OPTIONS: "columnHeight:900;height:600",
      },
      layer: "",
      zIndex: 0,
    },
  },
  sisdp_10k_lulc_2016_19l2: {
    id: "sisdp_10k_lulc_2016_19l2",
    displayName: "SISDP 10K LULC 2016-19 Level II",
    isShow: true,
    type: "tile",
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T0S6P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Agriculture%20Plantation:fcf31c;Aquaculture:3069fe;Crop%20Land:fff978;Fallow%20land:faccab;Industrial%20area:ca8544;Rural:e60000;Transportation:46505a;Urban:fa0202;Forest:73cb07;Forest%20Plantation:73cb07;Swamp%20area%20/%20Mangrove:000000;Grasslands%20/%20Grazing%20Lands:b2d718;Mining/Quarry:caad30;Rann:e0e6fc;Salt%20pan:ffffff;Shifting%20Cultivation%20area:00ff0d;Snow%20/%20Glacial%20area:c8ffff;Barren%20land:ff99ff;Gullied%20/%20Ravinous%20Land:cf0cfc;Salt%20Affected%20Land:e8abf9;Sandy%20Area:e4cdff;Scrub%20Land:c734c0;Waterlogged:03979b;Canal%20/%20Drain:2a33f2;Lake%20/%20Pond:5f99ff;Reservoir%20/%20Tank:5f99ff;River%20/%20Stream:0e41cd;Others:e0e6fc;&LEGEND_OPTIONS=columnHeight:950;height:700;width:300",
    legendHeight: "400px",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T0S6P1;from_time:20241231;to_time:20241231;indexes:1",
        STYLES:
          "0:ffffffff;[1:fcf31c:3);3:3069fe;[4:fff978:7);7:faccab;[8:ca8544:14);[14:e60000:21);[21:46505a:31);[31:fa0202:41);[41:73cb07:47);47:73cb07;48:000000;[49:b2d718:53);[53:caad30:56);[56:e0e6fc:58);[56:ffffff:58);[57:00ff0d:58);58:ffffff;59:00ff0d;[60:c8ffff:62);[62:ff99ff:65);[65:cf0cfc:67);[67:e8abf9:72);[72:e4cdff:75);[75:c734c0:77);[77:03979b:79);[79:2a33f2:84);[84:5f99ff:87);87:5f99ff;[88:0430cd:91);",

        LEGEND_OPTIONS: "columnHeight:900;height:600",
      },
      layer: "",
      zIndex: 0,
    },
  },
  sisdp_10k_lulc_2016_19: {
    id: "sisdp_10k_lulc_2016_19",
    displayName: "SISDP 10K LULC 2016-19 Level III",
    isShow: true,
    type: "tile",
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T0S6P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Agriculture%20Plantation%20/%20Orchards:fcf31c;Aquaculture:3069fe;Crop%20Land:fff978;Fallow%20Land:faccab;Industrial%20area:ca8544;Hamlet%20%26%20Dispersed%20Household:ffaeb0;Mixed%20Village%20Settlement:f34429;Other%20Rural%20Built-up%20Areas:ff807a;Village%20Settlement:e60000;Transport%20Infrastructure:46505a;Transport%20Network:d35563;Core%20Urban:fa0202;Other%20Urban%20Areas:842b00;Peri-Urban:b90400;Closed%20Forest:006400;Open%20Forest:51be41;Forest%20Plantation:73cb07;Swamp%20area%20/%20Mangrove:000000;Grasslands%20/%20Grazing%20Lands:b2d718;Mining%20/%20Quarry%20/%20Mining%20Dump:caad30;Rann:e0e6fc;Salt%20pan:ffffff;Shifting%20Cultivation%20area:00ff0d;Glacial%20area:c8ffff;Snow%20covered%20area:cccccc;Barren%20Rocky:ff99ff;Stony%20Waste:000000;Gullied%20land:cf0cfc;Ravinous%20Land:e30cf5;Salt%20Affected%20Land:e8abf9;Sandy%20area%20-%20Coastal:e4cdff;Sandy%20area%20-%20Desertic:f5b907;Sandy%20area%20-%20Riverine:bf05c5;Dense%20scrub%20land:fb36ff;Sparse%20scrub%20land:c734c0;Waterlogged:03979b;Canal%20/%20Drain:2a33f2;Lakes%20/%20Pond:5f99ff;Reservoirs%20/%20Tank:5f99ff;River:0430cd;Stream:0e41cd;Others:edf9cfff;&LEGEND_OPTIONS=columnHeight:950;height:1000;width:300",
    legendHeight: "400px",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T0S6P1;from_time:20241231;to_time:20241231;indexes:1",
        STYLES:
          "0:ffffffff;[1:fcf31c:3);3:3069fe;[4:fff978:7);7:faccab;[8:ca8544:14);14:ffaeb0;15:f34429;[16:ff807a:20);20:e60000;[21:46505a:27);[27:d35563:31);[31:fa0202:36);[36:842b00:40);40:b90400;[41:006400:44);[44:51be41:47);47:73cb07;48:000000;[49:b2d718:53);[53:caad30:56);[56:e0e6fc:58);58:ffffff;59:00ff0d;60:c8ffff;61:cccccc;[62:ff99ff:64);64:000000;65:cf0cfc;66:e30cf5;[67:e8abf9:72);72:e4cdff;73:f5b907;74:bf05c5;75:fb36ff;76:c734c0;[77:03979b:79);[79:2a33f2:84);[84:5f99ff:87);87:5f99ff;88:0430cd;[89:0e41cd:91)",

        LEGEND_OPTIONS: "columnHeight:900;height:600",
      },
      parameters: {
        compositeLuLcOptions: {
          displayName: "Composite",
          type: "choice",
          options: compositeLuLcOptions,
          selectedOption: compositeLuLcOptions[2],
        },
      },
      layer: "",
      zIndex: 0,
    },
  },
  modis_tcc_250m: {
    id: "modis_tcc_250m",
    displayName: "MODIS TCC [250m]",
    isShow: true,
    type: "XYZ",
    parameters: {
      toDate: {
        displayName: "Date",
        type: "calendar",
        selectedOption: {
          val: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
          lbl: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        },
      },
    },
    dateURL:
      "https://mosdac.gov.in/live/backend/satellite_data_initial.php?file_prefix=3DIMG&file_extension=L1B_STD_V01R00&param=startlayer&timezone=local&timezone_formal=-19800",

    layerFactoryParams: {
      urlTemplate:
        "https://gibs-{a-c}.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{{{toDate}}}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
    },

    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    layer: "",
    zIndex: 0,
  },
  // awifs_ncc: {
  //   id: "awifs_ncc",
  //   displayName: "AWiFS NCC [56m]",
  //   isShow: true,
  //   type: "legacy",
  //   parameters: {
  //     compositeDateOptions: {
  //       displayName: "Composite",
  //       type: "choice",
  //       options: compositeDateOptions,
  //       selectedOption: compositeDateOptions[1],
  //     },
  //     toDate: toDateLagacy,
  //     toDate5: toDate5Legacy,
  //     toDate10: toDate10Legacy,
  //     toDate15: toDate15Legacy,
  //     toDate30: toDate30Legacy,
  //   },
  //   uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
  //   dateURL: "https://vedas.sac.gov.in/vone_t0/list_data_ids?dataset_ids=",
  //   datasetId: "AWIFS_NCC",
  //   splitDateAt: 3,

  //   layerFactoryParams: {
  //     urlTemplate: "https://vedas.sac.gov.in/vone_t0/vone_wms",
  //     projection: projection,
  //     layerParams: {
  //       display_mode: "rgb",
  //       expr_r:
  //         "{AWIFS_NCC$agg_range$_3$0$7${{{fromDate}}}${{{toDate}}}$lat,1,0}",
  //       expr_g:
  //         "{AWIFS_NCC$agg_range$_3$0$7${{{fromDate}}}${{{toDate}}}$lat,2,0}",
  //       expr_b:
  //         "{AWIFS_NCC$agg_range$_3$0$7${{{fromDate}}}${{{toDate}}}$lat,3,0}",
  //       stretch_ip_r: "10,60",
  //       stretch_op_r: "20,250",
  //       stretch_ip_g: "10,60",
  //       stretch_op_g: "20,250",
  //       stretch_ip_b: "10,60",
  //       stretch_op_b: "10,250",
  //       no_data_val: "0",
  //       display_nodata_arr: "0,0,0",
  //       display_min_arr: "1,1,1",
  //       display_max_arr: "255,255,255",
  //     },
  //   },
  //   layer: "",
  //   zIndex: 0,
  // },
  sentinel_1_10m: {
    id: "sentinel_1_10m",
    displayName: "Sentinel-1 [10m]",
    isShow: true,
    type: "legacy",
    datasetId: "VV_SENT1_IND_INT",
    dateURL: "https://vedas.sac.gov.in/vone_t2/list_data_ids?dataset_ids=",
    splitDateAt: 4,
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },
      toDate: toDateLagacy,
      toDate5: toDate5Legacy,
      toDate10: toDate10Legacy,
      toDate15: toDate15Legacy,
      toDate30: toDate30Legacy,
      pol: {
        displayName: "Pol.",
        type: "choice",
        options: sentinel1DataOptions,
        selectedOption: sentinel1DataOptions[2],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/vone_t2/vone_wms",
      layerParams: {
        VV: {
          display_mode: "single",
          expr: "{VV_SENT1_IND_INT$agg_range$_4$0$7${{{fromDate}}}${{{toDate}}}$lat,1,0}",
          val_arr: "0,63,245,248,250",
          color_arr: "0x00000000,0x000000FF,0xFFFFFFFF,0xFFFFFFFF,0x00000000",
        },
        VH: {
          display_mode: "single",
          expr: "{VH_SENT1_IND_INT$agg_range$_4$0$7${{{fromDate}}}${{{toDate}}}$lat,1,0}",
          val_arr: "0,63,245,248,250",
          color_arr: "0x00000000,0x000000FF,0xFFFFFFFF,0xFFFFFFFF,0x00000000",
        },
        RGB: {
          display_mode: "rgb",
          expr_r:
            "{VV_SENT1_IND_INT$agg_range$_4$0$7${{{fromDate}}}${{{toDate}}}$lat,1,250}",
          expr_g:
            "{VH_SENT1_IND_INT$agg_range$_4$0$7${{{fromDate}}}${{{toDate}}}$lat,1,250}",
          expr_b:
            "{VV_SENT1_IND_INT$agg_range$_4$0$7${{{fromDate}}}${{{toDate}}}$lat,1,250}- {VH_SENT1_IND_INT$agg_range$_4$0$7${{{fromDate}}}${{{toDate}}}$lat,1,250}",
          display_nodata_arr: "250,250,250",
          display_min_arr: "87,63,0",
          display_max_arr: "250,250,140",
        },
      },
    },
    layer: "",
    zIndex: 0,
  },

  sentinel_rgb: {
    id: "sentinel_rgb",
    displayName: "Sentinel RGB",
    isShow: true,
    type: "tile",
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server2/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P0",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M1",
        PROJECTION: projection,
        ARGS: "r_dataset_id:T0S1P0;g_dataset_id:T0S1P0;b_dataset_id:T0S1P0;r_from_time:{{{fromDate}}};r_to_time:{{{toDate}}};g_from_time:{{{fromDate}}};g_to_time:{{{toDate}}};b_from_time:{{{fromDate}}};b_to_time:{{{toDate}}};r_index:8;g_index:4;b_index:3;r_max:6000;g_max:4000;b_max:4000;r_min:0;g_min:0;b_min:0",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
    },
    layer: "",
    zIndex: 0,
  },
  sentinel_2_fcc_ridam: {
    id: "sentinel_2_fcc_ridam",
    displayName: "Sentinel-2 FCC [10m]",
    isShow: true,
    type: "tile",
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[1],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,
      rIndex: {
        displayName: "R   ",
        type: "choice",
        options: bandOptions,
        selectedOption: bandOptions[7],
        dependentKey: ["rMax"],
        displayNameStyle: {
          color: "red",
        },
        style: {
          width: "90px",
          fontSize: "11px",
        },
      },
      gIndex: {
        displayName: "G",
        type: "choice",
        options: bandOptions,
        selectedOption: bandOptions[3],
        dependentKey: ["gMax"],
        displayNameStyle: {
          color: "green",
        },
        style: {
          width: "90px",
          fontSize: "11px",
        },
      },
      bIndex: {
        displayName: "B",
        type: "choice",
        options: bandOptions,
        selectedOption: bandOptions[2],
        dependentKey: ["bMax"],
        displayNameStyle: {
          color: "blue",
        },
        style: {
          width: "90px",
          fontSize: "11px",
        },
      },
      rMax: {
        displayName: "Rmax",
        type: "choice",
        options: saturationOptions,
        selectedOption: saturationOptions[9],
        displayNameStyle: {
          color: "red",
        },
      },
      gMax: {
        displayName: "Gmax",
        type: "choice",
        options: saturationOptions,
        selectedOption: saturationOptions[7],
        displayNameStyle: {
          color: "green",
        },
      },
      bMax: {
        displayName: "Bmax",
        type: "choice",
        options: saturationOptions,
        selectedOption: saturationOptions[7],
        displayNameStyle: {
          color: "blue",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server2/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P0",
    splitDateAt: 0,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RIDAM_RGB",
        layers: "T0S0M1",
        PROJECTION: projection,
        ARGS: "r_dataset_id:T0S1P0;g_dataset_id:T0S1P0;b_dataset_id:T0S1P0;r_from_time:{{{fromDate}}};r_to_time:{{{toDate}}};g_from_time:{{{fromDate}}};g_to_time:{{{toDate}}};b_from_time:{{{fromDate}}};b_to_time:{{{toDate}}};r_index:{{{rIndex}}};g_index:{{{gIndex}}};b_index:{{{bIndex}}};r_max:{{{rMax}}};g_max:{{{gMax}}};b_max:{{{bMax}}}",
      },
    },
    layer: "",
    zIndex: 0,
  },
  sentinel_2_tcc_ridam: {
    id: "sentinel_2_tcc_ridam",
    displayName: "Sentinel-2 TCC [10m]",
    isShow: true,
    type: "tile",
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[1],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server2/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P0",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RIDAM_RGB",
        layers: "T0S0M1",
        PROJECTION: projection,
        ARGS: "r_dataset_id:T0S1P0;g_dataset_id:T0S1P0;b_dataset_id:T0S1P0;r_from_time:{{{fromDate}}};r_to_time:{{{toDate}}};g_from_time:{{{fromDate}}};g_to_time:{{{toDate}}};b_from_time:{{{fromDate}}};b_to_time:{{{toDate}}};r_index:4;g_index:3;b_index:2;r_max:4000;g_max:4000;b_max:4000",
      },
    },
    layer: "",
    zIndex: 0,
  },

  awifs_fcc_ridam: {
    id: "awifs_fcc_ridam",
    displayName: "AWiFS FCC [56m]",
    isShow: true,
    type: "tile",
    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     chart: {
    //       name: "AWiFS FCC [56m]",
    //       title: "AWiFS FCC [56m]",
    //       yAxisTitle: "mean",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidam,
    //   },
    // ],
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[1],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      rIndex: {
        displayName: "R   ",
        type: "choice",
        options: awifsBandOptions,
        selectedOption: awifsBandOptions[2],
        displayNameStyle: {
          color: "red",
        },
        style: {
          width: "87px",
          fontSize: "11px",
        },
      },
      gIndex: {
        displayName: "G",
        type: "choice",
        options: awifsBandOptions,
        selectedOption: awifsBandOptions[1],
        displayNameStyle: {
          color: "green",
        },
        style: {
          width: "87px",
          fontSize: "11px",
        },
      },
      bIndex: {
        displayName: "B",
        type: "choice",
        options: awifsBandOptions,
        selectedOption: awifsBandOptions[0],
        displayNameStyle: {
          color: "blue",
        },
        style: {
          width: "87px",
          fontSize: "11px",
        },
      },
      rMax: {
        displayName: "Rmax",
        type: "choice",
        options: awifsSaturationOptions,
        selectedOption: awifsSaturationOptions[6],
        displayNameStyle: {
          color: "red",
        },
      },
      gMax: {
        displayName: "Gmax",
        type: "choice",
        options: awifsSaturationOptions,
        selectedOption: awifsSaturationOptions[5],
        displayNameStyle: {
          color: "green",
        },
      },
      bMax: {
        displayName: "Bmax",
        type: "choice",
        options: awifsSaturationOptions,
        selectedOption: awifsSaturationOptions[5],
        displayNameStyle: {
          color: "blue",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server2/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P1",
    splitDateAt: 0,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RIDAM_RGB",
        layers: "T0S0M1",
        PROJECTION: projection,
        ARGS: "r_dataset_id:T0S1P1;g_dataset_id:T0S1P1;b_dataset_id:T0S1P1;r_from_time:{{{fromDate}}};r_to_time:{{{toDate}}};g_from_time:{{{fromDate}}};g_to_time:{{{toDate}}};b_from_time:{{{fromDate}}};b_to_time:{{{toDate}}};r_index:{{{rIndex}}};g_index:{{{gIndex}}};b_index:{{{bIndex}}};r_max:{{{rMax}}};g_max:{{{gMax}}};b_max:{{{bMax}}};r_min:0.001;g_min:0.001;b_min:0.001",
      },
    },
    layer: "",
    zIndex: 0,
  },

  LISS4_fcc_ridam: {
    id: "LISS4_fcc_ridam",
    displayName: "LISS4 FCC [5m]",
    isShow: true,
    type: "tile",
    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     chart: {
    //       name: "LISS4 FCC [5m]",
    //       title: "LISS4 FCC [5m]",
    //       yAxisTitle: "mean",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidam,
    //   },
    // ],
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[1],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      rIndex: {
        displayName: "R   ",
        type: "choice",
        options: awifsBandOptions,
        selectedOption: awifsBandOptions[2],
        displayNameStyle: {
          color: "red",
        },
        style: {
          width: "87px",
          fontSize: "11px",
        },
      },
      gIndex: {
        displayName: "G",
        type: "choice",
        options: awifsBandOptions,
        selectedOption: awifsBandOptions[1],
        displayNameStyle: {
          color: "green",
        },
        style: {
          width: "87px",
          fontSize: "11px",
        },
      },
      bIndex: {
        displayName: "B",
        type: "choice",
        options: awifsBandOptions,
        selectedOption: awifsBandOptions[0],
        displayNameStyle: {
          color: "blue",
        },
        style: {
          width: "87px",
          fontSize: "11px",
        },
      },
      rMax: {
        displayName: "Rmax",
        type: "choice",
        options: awifsSaturationOptions,
        selectedOption: awifsSaturationOptions[5],
        displayNameStyle: {
          color: "red",
        },
      },
      gMax: {
        displayName: "Gmax",
        type: "choice",
        options: awifsSaturationOptions,
        selectedOption: awifsSaturationOptions[5],
        displayNameStyle: {
          color: "green",
        },
      },
      bMax: {
        displayName: "Bmax",
        type: "choice",
        options: awifsSaturationOptions,
        selectedOption: awifsSaturationOptions[5],
        displayNameStyle: {
          color: "blue",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P4",
    splitDateAt: 0,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RIDAM_RGB",
        layers: "T0S0M1",
        PROJECTION: projection,
        ARGS: "r_dataset_id:T0S1P4;g_dataset_id:T0S1P4;b_dataset_id:T0S1P4;r_from_time:{{{fromDate}}};r_to_time:{{{toDate}}};g_from_time:{{{fromDate}}};g_to_time:{{{toDate}}};b_from_time:{{{fromDate}}};b_to_time:{{{toDate}}};r_index:{{{rIndex}}};g_index:{{{gIndex}}};b_index:{{{bIndex}}};r_max:{{{rMax}}};g_max:{{{gMax}}};b_max:{{{bMax}}};r_min:0.001;g_min:0.001;b_min:0.001",
      },
    },
    layer: "",
    zIndex: 0,
  },

  s2_fdi: {
    id: "s2_fdi",
    displayName: "Sentinel-2 FDI",
    isShow: true,
    type: "tile",
    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        options: [],
        selectedOption: "",
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return getAvlDates(url, datasetId, splitDateAt);
        },
      },
      minColor: {
        displayName: "Min Color",
        type: "color",
        selectedOption: { val: "#cccccc" },
      },
      maxColor: {
        displayName: "Max Color",
        type: "color",
        selectedOption: { val: "#ff0000" },
      },
      min: {
        displayName: "Min",
        type: "number",
        minVal: -10,
        maxVal: 10,
        boundaryStep: -1,
        selectedOption: { lbl: -1, val: -1 },
        step: 0.05,
        multiplyBy: 100,
        style: {
          borderRadius: "10px",
          borderColor: "rgba(51, 51, 51, .18)",
        },
      },
      max: {
        displayName: "Max",
        boundaryStep: 1,
        type: "number",
        minVal: -10,
        maxVal: 1,
        step: 0.05,
        multiplyBy: 100,
        selectedOption: { lbl: 3, val: 3 },
        style: {
          borderRadius: "10px",
          borderColor: "rgba(51, 51, 51, .18)",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server2/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P0",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T3S1M1",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;from_time:{{{toDate}}};to_time:{{{toDate}}}",
        STYLES:
          "[-9000:{{{minColor}}}:{{{min}}}:{{{minColor}}}:{{{max}}}:{{{maxColor}}}:9000:{{{maxColor}}};nodata:FFFFFF00]",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  spire_sm_1d: {
    id: "spire_sm_1d",
    displayName: "SPIRE Soil Moisture Sample (100m)",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjFromRidam,
    chartDataConfig: [
      {
        datasetId: "T3S2P3",
        name: "Spire",
        type: "spline",
        valueConvertor: (x) => x,
        processChartData: createSeparateArraysForXandYAxis,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "Spire Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,
        showAllMergeOperationSeries: true,
        helpText: "Click on a map to get a profile",
        chart: {
          name: "Spire",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S2P3",
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:ffffff00:0:ca0020ff:0.10:f4a582ff:0.20:f7f7f7ff:0.30:92c5deff:0.40:0571b0ff]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",

    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:{{{operation}}};dataset_id:T3S2P3;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:ffffff00:0.01:ca0020ff:0.10:f4a582ff:0.20:f7f7f7ff:0.30:92c5deff:0.40:0571b0ff;nodata:FFFFFF00]",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
      extent: [69, 20, 72, 25],
    },
  },

  soil_moisture_eos4: {
    id: "soil_moisture_eos4",
    displayName: " Soil Moisture EOS4 (500m)",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjFromRidam,
    chartDataConfig: [
      {
        datasetId: "T3S2P4",
        name: "Soil moisture",
        type: "spline",
        valueConvertor: (x) => x,
        processChartData: createSeparateArraysForXandYAxis,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "Soil moisture Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,
        showAllMergeOperationSeries: false,
        helpText: "Click on a map to get a profile",
        chart: {
          name: "Soil moisture",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
          // yMax: 1.0,
          // yMin: 0
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S2P4",
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:C40000FF:0.07:FF0000FF:0.14:FEAA6BFF:0.21:FF9D9DFF:0.38:FFFF00FF:0.35:CFEC2FFF:0.42:AAD6F9FF:0.49:80000FFF:0.56:2424FFFF:0.60:0000AAFF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",

    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:{{{operation}}};dataset_id:T3S2P4;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:C40000FF:0.07:FF0000FF:0.14:FEAA6BFF:0.21:FF9D9DFF:0.38:FFFF00FF:0.35:CFEC2FFF:0.42:AAD6F9FF:0.49:80000FFF:0.56:2424FFFF:0.63:0000AAFF;nodata:FFFFFF00]",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
      extent: [69, 20, 72, 25],
    },
  },
  spire_sm_1d_difference: {
    id: "spire_sm_1d_difference",
    displayName: "SPIRE Soil Moisture Difference (A-B)",
    isShow: true,
    type: "tile",
    isDifference: true,
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[3],
      },
      aToDate: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 1,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt);
        },
      },
      aToDate5: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 5,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-08", val: "20240308" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "05", valToPush: "03" },
            { fromDt: "06", toDt: "10", valToPush: "08" },
            { fromDt: "11", toDt: "15", valToPush: "13" },
            { fromDt: "16", toDt: "20", valToPush: "18" },
            { fromDt: "21", toDt: "25", valToPush: "23" },
            { fromDt: "26", toDt: "31", valToPush: "28" },
          ]);
        },
      },
      aToDate10: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 10,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-15", val: "20240315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "10", valToPush: "05" },
            { fromDt: "11", toDt: "20", valToPush: "15" },
            { fromDt: "21", toDt: "31", valToPush: "25" },
          ]);
        },
      },
      aToDate15: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 15,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-08", val: "20240308" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "15", valToPush: "08" },
            { fromDt: "16", toDt: "31", valToPush: "23" },
          ]);
        },
      },
      aToDate30: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 30,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-15", val: "20240315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "31", valToPush: "15" },
          ]);
        },
      },

      bToDate: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 1,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "yearBack", val: 1 },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt);
        },
      },
      bToDate5: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 5,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 1 },
        defaultSelectedOption: { lbl: "2023-03-08", val: "20230308" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "05", valToPush: "03" },
            { fromDt: "06", toDt: "10", valToPush: "08" },
            { fromDt: "11", toDt: "15", valToPush: "13" },
            { fromDt: "16", toDt: "20", valToPush: "18" },
            { fromDt: "21", toDt: "25", valToPush: "23" },
            { fromDt: "26", toDt: "31", valToPush: "28" },
          ]);
        },
      },
      bToDate10: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 10,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 1 },
        defaultSelectedOption: { lbl: "2023-03-15", val: "20230315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "10", valToPush: "05" },
            { fromDt: "11", toDt: "20", valToPush: "15" },
            { fromDt: "21", toDt: "31", valToPush: "25" },
          ]);
        },
      },

      bToDate15: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 15,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 1 },
        defaultSelectedOption: { lbl: "2023-03-08", val: "20230308" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "15", valToPush: "08" },
            { fromDt: "16", toDt: "31", valToPush: "23" },
          ]);
        },
      },

      bToDate30: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 30,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 1 },
        defaultSelectedOption: { lbl: "2023-03-15", val: "20230315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "31", valToPush: "15" },
          ]);
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S2P3",
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[-0.1:ca0020ff:-0.05:f4a582ff:0:ffffff00:0.05:f7f7f7ff:0.1:0571b0ff]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M2",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method1:max;merge_method2:max;dataset_id1:T3S2P3;from_time1:{{{aFromDate}}};to_time1:{{{aToDate}}};dataset_id2:T3S2P3;from_time2:{{{bFromDate}}};to_time2:{{{bToDate}}}",
        STYLES:
          // "[0:ffffff00:0.01:ca0020ff:0.10:f4a582ff:0.20:f7f7f7ff:0.30:92c5deff:0.40:0571b0ff;nodata:FFFFFF00]",
          "[-0.1:ca0020ff:-0.05:f4a582ff:0:ffffff00:0.05:f7f7f7ff:0.1:0571b0ff;nodata:FFFFFF00]",
        // "[0:ffffff00:1:ca0020ff:10:f4a582ff:20:f7f7f7ff:30:92c5deff:40:0571b0ff];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
      extent: [69, 20, 72, 25],
    },
  },
  MODIS_NDVI_II4: {
    id: "MODIS_NDVI_II4",
    displayName: "MODIS NDVI (250m) (inpainted -HA)",
    isShow: true,
    type: "tile",
    autoActivateTool: true,

    generateHighChartObj: generateHighChartObjFromRidamForMODISInpainted,
    chartDataConfig: [
      {
        datasetId: "T3S1P2",
        name: "MODIS NDVI",
        type: "spline",
        valueConvertor: (x) => x / 10000,
        processChartData: createSeparateArraysForXandYAxis,
      },
      // {datasetId:'T3S1P3', name:'MODIS NDVI PR',type:'spline',processChartData:createSeparateArraysForXandYAxis},
      {
        datasetId: "T3S1P4",
        name: "MODIS NDVI (250m) (inpainted - HA)",
        type: "spline",
        valueConvertor: (x) => x / 10000,
        processChartData: createSeparateArraysForXandYAxis,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "MODIS NDVI (250m) (inpainted -HA)",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
      polygonInspect: {
        id: "polygonInspect",
        displayName: "Polygon-Inspect",
        name: "NDVI Polygon Inspect Profile",
        runTool: getOutputAfterPolygonDrawn,
        helpText: "Draw a polygon on map to get a profile",
        chart: {
          name: "MODIS NDVI (250m) (inpainted -HA)",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
    },

    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     datasetIdArr: [
    //       {
    //         datasetId: "T3S1P2",
    //         name: "MODIS NDVI (250m)",
    //         color: "green",
    //       },
    //       {
    //         datasetId: "T3S1P4",
    //         name: "MODIS NDVI (250m) (inpainted - HA)",
    //         color: "red",
    //       },
    //     ],
    //     chart: {
    //       name: "MODIS NDVI (250m) (inpainted -HA)",
    //       title: "MODIS NDVI (250m) (inpainted -HA)",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidamForMODISInpainted,
    //   },
    // ],

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S1P4",
    splitDateAt: 2,
    addNumberOfdaysInLabel: {
      7: { fromTime: "01-01", toTime: "02-17" },
      8: { fromTime: "02-18", toTime: "12-31" },
    },
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:F0EBEC00:0.1:DDC9BCFF:0.2:B19883FF:0.3:965945FF:0.4:86B30BFF:0.5:55A000FF:0.6:398700FF:0.7:1D7501FF:0.8:046301FF:0.9:004500FF:1.0:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T1S1M2",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T3S1P4;from_time:{{{toDate}}};to_time:{{{toDate}}}",
        STYLES:
          "[0:F0EBEC00:1000:DDC9BCFF:2000:B19883FF:3000:965945FF:4000:86B30BFF:5000:55A000FF:6000:398700FF:7000:1D7501FF:8000:046301FF:9000:004500FF:10000:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  MODIS_NDVI_IF1: {
    id: "MODIS_NDVI_IF1",
    displayName: "MODIS NDVI (250m)(Inpainted-Rapid)",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjFromRidamForMODISInpaintedIF,
    chartDataConfig: [
      {
        datasetId: "T3S1P2",
        name: "MODIS NDVI",
        type: "spline",
        valueConvertor: (x) => x / 10000,
        processChartData: createSeparateArraysForXandYAxis,
      },
      {
        datasetId: "T3S1P3",
        name: "MODIS NDVI PR",
        type: "spline",
        valueConvertor: (x) => x / 10000,
        processChartData: processMODISInpaintedChartDataIF1,
      },
      {
        datasetId: "T3S1P5",
        name: "MODIS NDVI (250m) (inpainted - HA)",
        type: "spline",
        valueConvertor: (x) => x / 10000,
        processChartData: createSeparateArraysForXandYAxis,
      },
    ],
    // tools: {
    //   pointInspect: {
    //     id: "pointInspect",
    //     displayName: "Point-Inspect",
    //     name: "MODIS Point Inspect Profile",
    //     runTool: getOutputAfterPointDrawn,

    //     helpText: "Click on a map to get a profile",
    //     chart: {
    //       name: "MODIS NDVI (250m)(Inpainted-Rapid)",
    //       yAxisTitle: "MODIS NDVI (250m)(Inpainted-Rapid)",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     params: {
    //       chartType: {
    //         displayName: "Chart Type",
    //         type: "choice",
    //         options: chartTypeOptions,
    //         selectedOption: chartTypeOptions["fullSeries"],
    //       },
    //     },
    //   },
    //   polygonInspect: {
    //     id: "polygonInspect",
    //     displayName: "Polygon-Inspect",
    //     name: "NDVI Polygon Inspect Profile",
    //     runTool: getOutputAfterPolygonDrawn,
    //     helpText: "Draw a polygon on map to get a profile",
    //     chart: {
    //       name: "MODIS NDVI (250m)(Inpainted-Rapid)",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     params: {
    //       chartType: {
    //         displayName: "Chart Type",
    //         type: "choice",
    //         options: chartTypeOptions,
    //         selectedOption: chartTypeOptions["yoySeries"],
    //       },
    //     },
    //   },
    // },

    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     datasetIdArr: [
    //       {
    //         datasetId: "T3S1P2",
    //         name: "MODIS NDVI (250m)",
    //         color: "green",
    //       },
    //       {
    //         datasetId: "T3S1P5",
    //         name: "MODIS NDVI (250m) (inpainted-Rapid)",
    //         color: "red",
    //       },
    //     ],
    //     chart: {
    //       name: "MODIS NDVI (250m) (inpainted-Rapid)",
    //       title: "MODIS NDVI (250m) (inpainted-Rapid)",
    //       yAxisTitle: "Mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidamForMODISInpaintedIF,
    //   },
    // ],

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S1P5",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:F0EBEC00:0.1:DDC9BCFF:0.2:B19883FF:0.3:965945FF:0.4:86B30BFF:0.5:55A000FF:0.6:398700FF:0.7:1D7501FF:0.8:046301FF:0.9:004500FF:1.0:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    addNumberOfdaysInLabel: {
      7: { fromTime: "01-01", toTime: "02-17" },
      8: { fromTime: "02-18", toTime: "12-31" },
    },
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T1S1M3",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T3S1P5;from_time:{{{toDate}}};to_time:{{{toDate}}}",
        STYLES:
          "[0:F0EBEC00:1000:DDC9BCFF:2000:B19883FF:3000:965945FF:4000:86B30BFF:5000:55A000FF:6000:398700FF:7000:1D7501FF:8000:046301FF:9000:004500FF:10000:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  MODIS_NDVI: {
    id: "MODIS_NDVI",
    displayName: "MODIS NDVI (250m)",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjFromRidam,
    chartDataConfig: [
      {
        datasetId: "T3S1P2",
        name: "MODIS NDVI (250m)",
        type: "spline",
        valueConvertor: (x) => x / 10000,
        processChartData: processChartData,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,
        // processedData:generateHighChartObjFromRidamnbr,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "MODIS NDVI (250m)",
          yAxisTitle: "nbr",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },

    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     chart: {
    //       name: "MODIS NDVI (250m)",
    //       title: "MODIS NDVI (250m)",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidam,
    //   },
    // ],

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S1P2",
    splitDateAt: 2,
    addNumberOfdaysInLabel: {
      7: { fromTime: "01-01", toTime: "02-17" },
      8: { fromTime: "02-18", toTime: "12-31" },
    },
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:F0EBEC00:0.1:DDC9BCFF:0.2:B19883FF:0.3:965945FF:0.4:86B30BFF:0.5:55A000FF:0.6:398700FF:0.7:1D7501FF:0.8:046301FF:0.9:004500FF:1.0:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T3S1P2;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:F0EBEC00:1000:DDC9BCFF:2000:B19883FF:3000:965945FF:4000:86B30BFF:5000:55A000FF:6000:398700FF:7000:1D7501FF:8000:046301FF:9000:004500FF:10000:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  Cloud_masked: {
    id: "Cloud_masked",
    displayName: "Sentinel-2 Cloud Mask",
    isShow: true,
    type: "tile",
    generateHighChartObj: generateHighChartObjFromRidam,
    chartDataConfig: [
      {
        datasetId: "T0S5P1",
        name: "Cloud Mask",
        type: "spline",
        valueConvertor: (x) => x,
        processChartData: processChartData,
      },
    ],

    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,
        // processedData:generateHighChartObjFromRidamnbr,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Cloud Mask",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },

    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     chart: {
    //       name: "CLOUD MASK",
    //       title: "CLOUD MASK",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidam,
    //   },
    // ],

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T0S5P1",
    splitDateAt: 2,
    addNumberOfdaysInLabel: 0,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Cloud shadow:19437DFF;Cloud:00BECCFF;&LEGEND_OPTIONS=columnHeight:950;height:200;width:300",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T6S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T0S5P1;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:1:FFFFFF00:2:FFFFFF00:3:643200FF:4:FFFFFF00:5:FFFFFF00:6:FFFFFF00:7:FFFFFF00:8:64c8ffFF:9:64c8ffFF:10:64c8ffFF:11:FFFFFF00];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  MODIS_NDVI_FORCASTED: {
    id: "MODIS_NDVI_FORCASTED",
    displayName: "MODIS NDVI (250m)(Forecasted)",
    isShow: true,
    autoActivateTool: true,
    type: "tile",
    generateHighChartObj: generateHighChartObjFromRidamForMODISForecasted,
    chartDataConfig: [
      {
        datasetId: "T3S1P2",
        identifier: "normal",
        name: "MODIS NDVI",
        type: "spline",
        valueConvertor: (x) => x / 10000,
        numberOfDaysToAdd: 8,
        processChartData: processChartDataMODISForecasted,
      },
      {
        datasetId: "T3S1P5",
        identifier: "IF1",
        name: "MODIS NDVI IF1",
        type: "scatter",
        valueConvertor: (x) => x / 10000,
        numberOfDaysToAdd: 24,
        processChartData: processChartDataMODISForecasted,
      },
      {
        datasetId: "T3S1P6",
        identifier: "IF2",
        name: "MODIS NDVI IF2",
        type: "scatter",
        valueConvertor: (x) => x / 10000,
        numberOfDaysToAdd: 40,
        processChartData: processChartDataMODISForecasted,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "MODIS NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "MODIS NDVI (250m)(Forecasted)",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
      polygonInspect: {
        id: "polygonInspect",
        displayName: "Polygon-Inspect",
        name: "NDVI Polygon Inspect Profile",
        runTool: getOutputAfterPolygonDrawn,
        helpText: "Draw a polygon on map to get a profile",
        chart: {
          name: "MODIS NDVI (250m)(Forecasted)",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
    },

    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     datasetIdArr: [
    //       {
    //         datasetId: "T3S1P2",
    //         name: "MODIS NDVI (250m)",
    //         color: "green",
    //       },
    //       {
    //         datasetId: "T3S1P6",
    //         name: "MODIS NDVI (250m) (Forecasted)",
    //         color: "red",
    //       },
    //     ],
    //     chart: {
    //       name: "MODIS NDVI (250m) (Forecasted)",
    //       title: "MODIS NDVI (250m) (Forecasted)",
    //       yAxisTitle: "Mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidamForMODISInpaintedIF,
    //   },
    // ],

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S1P6",
    splitDateAt: 2,
    addNumberOfdaysInLabel: {
      39: { fromTime: "01-01", toTime: "01-15" },
      40: { fromTime: "01-16", toTime: "11-26" },
      37: { fromTime: "11-27", toTime: "12-31" },
    },
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:F0EBEC00:0.1:DDC9BCFF:0.2:B19883FF:0.3:965945FF:0.4:86B30BFF:0.5:55A000FF:0.6:398700FF:0.7:1D7501FF:0.8:046301FF:0.9:004500FF:1.0:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T1S1M4",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T3S1P6;from_time:{{{toDate}}};to_time:{{{toDate}}}",
        STYLES:
          "[0:F0EBEC00:1000:DDC9BCFF:2000:B19883FF:3000:965945FF:4000:86B30BFF:5000:55A000FF:6000:398700FF:7000:1D7501FF:8000:046301FF:9000:004500FF:10000:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  Potato_mask: {
    id: "Potato_mask",
    displayName: "Potato Mask",
    isShow: true,
    type: "tile",
    baseIndex: 150,

    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     chart: {
    //       name: "Potato Mask",
    //       title: "Potato Mask",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidam,
    //   },
    // ],

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: true,
        selectedOption: "",

        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          const dateOptions = await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel,
            // ["AY 2023-24","AY 2021-22"]
            //  "AY 2023-24",  // Pass as individual strings, not arrays
            "AY"
          );
          return dateOptions; // This will log the array of date options, each with dateLabel and availableDate
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S8P1",
    splitDateAt: 2,
    addNumberOfdaysInLabel: 0,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Potato:FF0000FF;&LEGEND_OPTIONS=columnHeight:950;height:200;width:300",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T3S8P1;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES: "[0:FFFFFF00:1:FF0000FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  Awifs_ndvi: {
    id: "Awifs_ndvi",
    displayName: " AWiFS NDVI",
    isShow: true,
    type: "tile",

    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     chart: {
    //       name: " AWiFS NDVI",
    //       title: " AWiFS NDVI",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidam,
    //   },
    // ],
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },

      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server2b/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:F0EBEC00:0.08:DDC9BCFF:0.16:B19883FF:0.24:965945FF:0.32:86B30BFF:0.4:55A000FF:0.48:398700FF:0.56:1D7501FF:0.64:046301FF:0.72:004500FF:0.8:001901FF:1.0:001901FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T1S1M5",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:{{{operation}}};dataset_id:T0S1P1;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:F0EBEC00:0.06:DDC9BCFF:0.12:B19883FF:0.18:965945FF:0.24:86B30BFF:0.3:55A000FF:0.36:398700FF:0.42:1D7501FF:0.48:046301FF:0.54:004500FF:0.6:001901FF:1.0:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  bais_2: {
    id: "bais_2",
    displayName: "Sentinel-2 BAIS2",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjFromRidambais2,
    chartDataConfig: [
      {
        datasetId: "T3S3P1",
        name: "Sentinel-2 BAIS 2",
        type: "spline",
        valueConvertor: (x) => x / 62.5 - 1,
        processChartData: processChartData,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,
        // processedData:generateHighChartObjFromRidamnbr,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Sentinel-2 BAIS 2",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },

    // tools: {
    //   pointInspect: {
    //     id: "pointInspect",
    //     displayName: "Point-Inspect",
    //     name: "NDVI Point Inspect Profile",
    //     runTool: getOutputAfterPointDrawn,
    //     // processedData:generateHighChartObjFromRidamnbr,

    //     helpText: "Click on a map to get a profile",
    //     chart: {
    //       name: "Sentinel-2 BAIS 2",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     params: {
    //       chartType: {
    //         displayName: "Chart Type",
    //         type: "choice",
    //         options: chartTypeOptions,
    //         selectedOption: chartTypeOptions["fullSeries"],
    //       },
    //     },
    //   },
    // },

    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     chart: {
    //       name: "Sentinel-2 BAIS2",
    //       title: "Sentinel-2 BAIS2",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidambais2,
    //   },
    // ],
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },

      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S3P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:FFFFFF00:0:ecc30bFF:1:d38a0fFF:3:bb5113FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:{{{operation}}};dataset_id:T3S3P1;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:1:FFFFFFFF:105:FFFFFFFF:125:ecc30bFF:250:d38a0fFF:250:bb5113FF];nodata:FFFFFF00",

        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  nbr: {
    id: "nbr",
    displayName: "Sentinel-2 NBR",
    isShow: true,
    type: "tile",
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjFromRidamnbr,
    chartDataConfig: [
      {
        datasetId: "T3S4P1",
        name: "Sentinel-2 NBR",
        type: "spline",
        valueConvertor: (x) => (x - 125) / 125,
        processChartData: processChartDatanbr,
      },
    ],

    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,
        // processedData:generateHighChartObjFromRidamnbr,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Sentinel-2 NBR",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },

    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     chart: {
    //       name: "Sentinel-2 Normalized Burnt Ratio (NBR)",
    //       title: "Sentinel-2 Normalized Burnt Ratio (NBR)",
    //       yAxisTitle: "Normalised Burnt Index",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidamnbr,
    //   },
    // ],
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },

      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[1],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S4P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[-0.52:a31818FF:-0.36:bb5113FF:-0.24:d38a0fFF:-0.16:ecc30bFF:0:FFFFFFFF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:{{{operation}}};dataset_id:T3S4P1;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:60:a31818FF:80:bb5113FF:95:d38a0fFF:105:ecc30bFF:125:FFFFFFFF:250:FFFFFFFF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  ndmi: {
    id: "ndmi",
    displayName: "Sentinel-2 NDMI",
    isShow: true,
    type: "tile",

    // tools: [
    //   {
    //     name: "Temporal Profile",
    //     type: "chart",
    //     helpText: "Click on map to get the chart",
    //     isShowChart: false,
    //     chart: {
    //       name: "Sentinel-2 NDMI",
    //       title: "Sentinel-2 NDMI",
    //       yAxisTitle: "mean",
    //       format: "{value:%d-%b-%Y}",
    //     },
    //     generateHighChartObj: generateHighChartObjFromRidamnbr,
    //   },
    // ],
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },

      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S6P1",
    splitDateAt: 2,
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[-0.2:EE0000FF:0:FDFE25FF:0.07:CBD921FF:0.14:516B12FF:0.35:314606FF:0.5:152106FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:{{{operation}}};dataset_id:T3S6P1;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:101:EE0000FF:126:FDFE25FF:135:CBD921FF:144:516B12FF:170:314606FF:189:152106FF:255:152106FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  awifs_normalized_difference: {
    id: "awifs_normalized_difference",
    displayName: "AWiFS Normalized Diff. (A-B)/(A+B)",
    isShow: true,
    type: "tile",
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,
      nIndex: {
        displayName: "A",
        type: "choice",
        options: awifsBandOptions,
        selectedOption: awifsBandOptions[2],
        style: {
          width: "87px",
          fontSize: "11px",
        },
      },
      dIndex: {
        displayName: "B",
        type: "choice",
        options: awifsBandOptions,
        selectedOption: awifsBandOptions[1],
        style: {
          width: "87px",
          fontSize: "11px",
        },
      },
      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
      minColor: {
        displayName: "Min Color",
        type: "color",
        selectedOption: { val: "#ffffff" },
      },
      maxColor: {
        displayName: "Max Color",
        type: "color",
        selectedOption: { val: "#008000" },
      },
      min: {
        displayName: "Min",
        type: "number",
        minVal: -1,
        maxVal: 1,
        boundaryStep: -1,
        selectedOption: { lbl: 0, val: 0 },
        step: 0.05,
        multiplyBy: -100,
        style: {
          borderRadius: "10px",
          borderColor: "rgba(51, 51, 51, .18)",
        },
      },
      max: {
        displayName: "Max",
        boundaryStep: 1,
        type: "number",
        minVal: -1,
        maxVal: 1,
        step: 0.05,
        multiplyBy: 100,
        selectedOption: { lbl: 1, val: 1 },
        style: {
          borderRadius: "10px",
          borderColor: "rgba(51, 51, 51, .18)",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server2/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P1",
    // legendUrl:"https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[{{{minColorB}}}:FFFFFF00:{{{min}}}:{{{minColor}}}:{{{max}}}:{{{maxColor}}}:{{{maxColorB}}}:FFFFFF00;nodata:FFFFFF00]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    splitDateAt: 0,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M3",
        PROJECTION: projection,
        ARGS: "dataset_id:T0S1P1;from_time:{{{fromDate}}};to_time:{{{toDate}}};n_index:{{{nIndex}}};d_index:{{{dIndex}}};operation:{{{operation}}}",
        // STYLES: "[-100:d2efbcFF:100:001901FF;nodata:FFFFFF00]",
        STYLES:
          "[{{{minColorB}}}:FFFFFF00:{{{min}}}:{{{minColor}}}:{{{max}}}:{{{maxColor}}}:{{{maxColorB}}}:FFFFFF00;nodata:FFFFFF00]",

        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
    },
    layer: "",
    zIndex: 0,
  },
  sentinel_2_normalized_difference: {
    id: "sentinel_2_normalized_difference",
    displayName: "Sentinel-2 Normalized Diff. (A-B)/(A+B)",
    isShow: true,
    type: "tile",
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,

      nIndex: {
        displayName: "A",
        type: "choice",
        options: bandOptions,
        selectedOption: bandOptions[7],
        // displayNameStyle: {
        //   color: "red",
        // },
        style: {
          width: "87px",
          fontSize: "11px",
        },
      },
      dIndex: {
        displayName: "B",
        type: "choice",
        options: bandOptions,
        selectedOption: bandOptions[3],
        // dependentKey: ["gMax"],
        // displayNameStyle: {
        //   color: "green",
        // },
        style: {
          width: "87px",
          fontSize: "11px",
        },
      },
      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
      minColor: {
        displayName: "Min Color",
        type: "color",
        // options: colorOptions,
        selectedOption: { val: "#8cda8b" },
      },
      maxColor: {
        displayName: "Max Color",
        type: "color",
        // options: colorOptions,
        selectedOption: { val: "#067f08" },
      },
      min: {
        displayName: "Min",
        type: "number",
        minVal: -1,
        maxVal: 1,
        boundaryStep: -1,
        selectedOption: { lbl: 0, val: 0 },
        step: 0.05,
        multiplyBy: -100,
        style: {
          borderRadius: "10px",
          borderColor: "rgba(51, 51, 51, .18)",
        },
      },
      max: {
        displayName: "Max",
        boundaryStep: 1,
        type: "number",
        minVal: -1,
        maxVal: 1,
        step: 0.05,
        multiplyBy: 100,
        selectedOption: { lbl: 1, val: 1 },
        style: {
          borderRadius: "10px",
          borderColor: "rgba(51, 51, 51, .18)",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server2/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P0",
    splitDateAt: 0,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M3",
        PROJECTION: projection,
        ARGS: "dataset_id:T0S1P0;from_time:{{{fromDate}}};to_time:{{{toDate}}};n_index:{{{nIndex}}};d_index:{{{dIndex}}};operation:{{{operation}}}",
        // STYLES: "[-100:d2efbcFF:100:001901FF;nodata:FFFFFF00]",
        STYLES:
          "[{{{minColorB}}}:FFFFFF00:{{{min}}}:{{{minColor}}}:{{{max}}}:{{{maxColor}}}:{{{maxColorB}}}:FFFFFF00;nodata:FFFFFF00]",

        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
    },
    layer: "",
    zIndex: 0,
  },
  awifs_ndsi: {
    id: "awifs_ndsi",
    displayName: "AWiFS NDSI",
    isShow: true,
    type: "tile",
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,
      minColor: {
        displayName: "Min Color",
        type: "color",
        // options: colorOptions,
        selectedOption: { val: "#ff0000" },
      },
      maxColor: {
        displayName: "Max Color",
        type: "color",
        // options: colorOptions,
        selectedOption: { val: "#0000ff" },
      },
      min: {
        displayName: "Min",
        type: "number",
        minVal: -1,
        maxVal: 1,
        boundaryStep: -1,
        selectedOption: { lbl: 0.42, val: 0.42 },
        step: 0.05,
        multiplyBy: -100,
        style: {
          borderRadius: "10px",
          borderColor: "rgba(51, 51, 51, .18)",
        },
      },
      max: {
        displayName: "Max",
        boundaryStep: 1,
        type: "number",
        minVal: -1,
        maxVal: 1,
        step: 0.05,
        multiplyBy: 100,
        selectedOption: { lbl: 1, val: 1 },
        style: {
          borderRadius: "10px",
          borderColor: "rgba(51, 51, 51, .18)",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server2/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P1",
    splitDateAt: 0,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M3",
        PROJECTION: projection,
        ARGS: "dataset_id:T0S1P1;from_time:{{{fromDate}}};to_time:{{{toDate}}};n_index:1;d_index:4;operation:max",
        // STYLES: "[-100:d2efbcFF:100:001901FF;nodata:FFFFFF00]",
        STYLES:
          "[{{{minColorB}}}:FFFFFF00:{{{min}}}:{{{minColor}}}:{{{max}}}:{{{maxColor}}}:{{{maxColorB}}}:FFFFFF00;nodata:FFFFFF00]",

        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
    },
    layer: "",
    zIndex: 0,
  },
  sentinel_2_ndsi: {
    id: "sentinel_2_ndsi",
    displayName: "Sentinel-2 NDSI",
    isShow: true,
    type: "tile",
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[2],
      },
      toDate: toDate,
      toDate5: toDate5,
      toDate10: toDate10,
      toDate15: toDate15,
      toDate30: toDate30,
      minColor: {
        displayName: "Min Color",
        type: "color",
        selectedOption: { val: "#ff0000" },
      },
      maxColor: {
        displayName: "Max Color",
        type: "color",
        // options: colorOptions,
        selectedOption: { val: "#0000ff" },
      },
      min: {
        displayName: "Min",
        type: "number",
        minVal: -1,
        maxVal: 1,
        boundaryStep: -1,
        selectedOption: { lbl: 0.42, val: 0.42 },
        step: 0.05,
        multiplyBy: -100,
        style: {
          borderRadius: "10px",
          borderColor: "rgba(51, 51, 51, .18)",
        },
      },
      max: {
        displayName: "Max",
        boundaryStep: 1,
        type: "number",
        minVal: -1,
        maxVal: 1,
        step: 0.05,
        multiplyBy: 100,
        selectedOption: { lbl: 1, val: 1 },
        style: {
          borderRadius: "10px",
          borderColor: "rgba(51, 51, 51, .18)",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server2/meta/dataset_timestamp?prefix=",
    datasetId: "T0S1P0",
    splitDateAt: 0,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server2/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M3",
        PROJECTION: projection,
        ARGS: "dataset_id:T0S1P0;from_time:{{{fromDate}}};to_time:{{{toDate}}};n_index:3;d_index:11;operation:max",
        // STYLES: "[-100:d2efbcFF:100:001901FF;nodata:FFFFFF00]",
        STYLES:
          "[{{{minColorB}}}:FFFFFF00:{{{min}}}:{{{minColor}}}:{{{max}}}:{{{maxColor}}}:{{{maxColorB}}}:FFFFFF00;nodata:FFFFFF00]",

        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
    },
    layer: "",
    zIndex: 0,
  },

  sentinel2_ndvi_rgb: {
    id: "sentinel2_ndvi_rgb",
    displayName: "Sentinel-2 NDVI RGB",
    isShow: true,
    type: "tile",
    isRGB: true,
    autoActivateTool: true,
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: showS2NDVIRGBChart,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Sentinel-2 NDVI RGB",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
    },
    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[3],
      },

      rToDate: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 1,
        displayName: "Red-Date   ",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt);
        },
        displayNameStyle: {
          color: "red",
          paddingRight: "15px",
        },
      },
      rToDate5: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 5,
        displayName: "Red-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-01-13", val: "20240113" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "05", valToPush: "03" },
            { fromDt: "06", toDt: "10", valToPush: "08" },
            { fromDt: "11", toDt: "15", valToPush: "13" },
            { fromDt: "16", toDt: "20", valToPush: "18" },
            { fromDt: "21", toDt: "25", valToPush: "23" },
            { fromDt: "26", toDt: "31", valToPush: "28" },
          ]);
        },
        displayNameStyle: {
          color: "red",
          paddingRight: "15px",
        },
      },
      rToDate10: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 10,
        displayName: "Red-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-01-15", val: "20240115" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "10", valToPush: "05" },
            { fromDt: "11", toDt: "20", valToPush: "15" },
            { fromDt: "21", toDt: "31", valToPush: "25" },
          ]);
        },
        displayNameStyle: {
          color: "red",
          paddingRight: "15px",
        },
      },
      rToDate15: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 15,
        displayName: "Red-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-01-08", val: "20240108" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "15", valToPush: "08" },
            { fromDt: "16", toDt: "31", valToPush: "23" },
          ]);
        },
        displayNameStyle: {
          color: "red",
          paddingRight: "15px",
        },
      },
      rToDate30: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 30,
        displayName: "Red-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-01-15", val: "20240115" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "31", valToPush: "15" },
          ]);
        },
        displayNameStyle: {
          color: "red",
          paddingRight: "15px",
        },
      },

      gToDate: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 1,
        displayName: "Green-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "yearBack", val: 1 },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt);
        },
        displayNameStyle: {
          color: "green",
        },
      },
      gToDate5: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 5,
        displayName: "Green-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2023-12-13", val: "20231213" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "05", valToPush: "03" },
            { fromDt: "06", toDt: "10", valToPush: "08" },
            { fromDt: "11", toDt: "15", valToPush: "13" },
            { fromDt: "16", toDt: "20", valToPush: "18" },
            { fromDt: "21", toDt: "25", valToPush: "23" },
            { fromDt: "26", toDt: "31", valToPush: "28" },
          ]);
        },
        displayNameStyle: {
          color: "green",
        },
      },
      gToDate10: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 10,
        displayName: "Green-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2023-12-15", val: "20231215" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "10", valToPush: "05" },
            { fromDt: "11", toDt: "20", valToPush: "15" },
            { fromDt: "21", toDt: "31", valToPush: "25" },
          ]);
        },
        displayNameStyle: {
          color: "green",
        },
      },
      gToDate15: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 15,
        displayName: "Green-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 1 },
        defaultSelectedOption: { lbl: "2023-12-08", val: "20231208" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "15", valToPush: "08" },
            { fromDt: "16", toDt: "31", valToPush: "23" },
          ]);
        },
        displayNameStyle: {
          color: "green",
        },
      },
      gToDate30: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 30,
        displayName: "Green-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2023-12-15", val: "20231215" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "31", valToPush: "15" },
          ]);
        },
        displayNameStyle: {
          color: "green",
        },
      },

      bToDate: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 1,
        displayName: "Blue-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "yearBack", val: 2 },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt);
        },
        displayNameStyle: {
          color: "blue",
          paddingRight: "12px",
        },
      },
      bToDate5: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 5,
        displayName: "Blue-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-13", val: "20240313" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "05", valToPush: "03" },
            { fromDt: "06", toDt: "10", valToPush: "08" },
            { fromDt: "11", toDt: "15", valToPush: "13" },
            { fromDt: "16", toDt: "20", valToPush: "18" },
            { fromDt: "21", toDt: "25", valToPush: "23" },
            { fromDt: "26", toDt: "31", valToPush: "28" },
          ]);
        },
        displayNameStyle: {
          color: "blue",
          paddingRight: "12px",
        },
      },
      bToDate10: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 10,
        displayName: "Blue-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-15", val: "20240315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "10", valToPush: "05" },
            { fromDt: "11", toDt: "20", valToPush: "15" },
            { fromDt: "21", toDt: "31", valToPush: "25" },
          ]);
        },
        displayNameStyle: {
          color: "blue",
          paddingRight: "12px",
        },
      },
      bToDate15: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 15,
        displayName: "Blue-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 2 },
        defaultSelectedOption: { lbl: "2024-03-08", val: "20240308" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "15", valToPush: "08" },
            { fromDt: "16", toDt: "31", valToPush: "23" },
          ]);
        },
        displayNameStyle: {
          color: "blue",
          paddingRight: "12px",
        },
      },
      bToDate30: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 30,
        displayName: "Blue-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-15", val: "20240315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "31", valToPush: "15" },
          ]);
        },
        displayNameStyle: {
          color: "blue",
          paddingRight: "12px",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S1P1",
    splitDateAt: 0,

    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RIDAM_RGB",
        layers: "T0S0M1",
        PROJECTION: projection,
        ARGS: "r_merge_method:max;g_merge_method:max;b_merge_method:max;r_dataset_id:T3S1P1;g_dataset_id:T3S1P1;b_dataset_id:T3S1P1;r_from_time:{{{rFromDate}}};r_to_time:{{{rToDate}}};g_from_time:{{{gFromDate}}};g_to_time:{{{gToDate}}};b_from_time:{{{bFromDate}}};b_to_time:{{{bToDate}}};r_max:251;g_max:251;b_max:251;r_index:1;g_index:1;b_index:1;r_min:1;g_min:1;b_min:1",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
    },
    layer: "",
    zIndex: 0,
  },
  sentinel2_ndvi_difference: {
    id: "sentinel2_ndvi_difference",
    displayName: "Sentinel-2 NDVI Difference (A-B)",
    isShow: true,
    type: "tile",
    isDifference: true,
    autoActivateTool: true,
    generateHighChartObj: generateHighChartObjForS2NDVIProfileWithCMASK,
    chartDataConfig: [
      {
        datasetId: "T3S1P1",
        name: "Sentinel-2",
        type: "spline",
        valueConvertor: (x) => x / 250,
        processChartData: createSeparateArraysForXandYAxis,
      },
    ],
    tools: {
      pointInspect: {
        id: "pointInspect",
        displayName: "Point-Inspect",
        name: "NDVI Point Inspect Profile",
        runTool: getOutputAfterPointDrawn,

        helpText: "Click on a map to get a profile",
        chart: {
          name: "Sentinel-2 NDVI",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
          yMax: 1.0,
          yMin: 0,
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["fullSeries"],
          },
        },
      },
      polygonInspect: {
        id: "polygonInspect",
        displayName: "Polygon-Inspect",
        name: "NDVI Polygon Inspect Profile",
        runTool: getOutputAfterPolygonDrawn,
        helpText: "Draw a polygon on map to get a profile",
        chart: {
          name: "Sentinel-2 NDVI",
          yAxisTitle: "mean",
          format: "{value:%d-%b-%Y}",
          yMax: 1,
          yMin: 0,
        },
        params: {
          chartType: {
            displayName: "Chart Type",
            type: "choice",
            options: chartTypeOptions,
            selectedOption: chartTypeOptions["yoySeries"],
          },
        },
      },
    },

    parameters: {
      compositeDateOptions: {
        displayName: "Composite",
        type: "choice",
        options: compositeDateOptions,
        selectedOption: compositeDateOptions[3],
      },
      aToDate: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 1,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt);
        },
      },
      aToDate5: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 5,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-08", val: "20240308" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "05", valToPush: "03" },
            { fromDt: "06", toDt: "10", valToPush: "08" },
            { fromDt: "11", toDt: "15", valToPush: "13" },
            { fromDt: "16", toDt: "20", valToPush: "18" },
            { fromDt: "21", toDt: "25", valToPush: "23" },
            { fromDt: "26", toDt: "31", valToPush: "28" },
          ]);
        },
      },
      aToDate10: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 10,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-15", val: "20240315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "10", valToPush: "05" },
            { fromDt: "11", toDt: "20", valToPush: "15" },
            { fromDt: "21", toDt: "31", valToPush: "25" },
          ]);
        },
      },
      aToDate15: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 15,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-08", val: "20240308" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "15", valToPush: "08" },
            { fromDt: "16", toDt: "31", valToPush: "23" },
          ]);
        },
      },
      aToDate30: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 30,
        displayName: "A-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "2024-03-15", val: "20240315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "31", valToPush: "15" },
          ]);
        },
      },

      bToDate: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 1,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        defaultSelectedOption: { lbl: "yearBack", val: 1 },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt);
        },
      },
      bToDate5: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 5,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 1 },
        defaultSelectedOption: { lbl: "2023-03-08", val: "20230308" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "05", valToPush: "03" },
            { fromDt: "06", toDt: "10", valToPush: "08" },
            { fromDt: "11", toDt: "15", valToPush: "13" },
            { fromDt: "16", toDt: "20", valToPush: "18" },
            { fromDt: "21", toDt: "25", valToPush: "23" },
            { fromDt: "26", toDt: "31", valToPush: "28" },
          ]);
        },
      },
      bToDate10: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 10,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 1 },
        defaultSelectedOption: { lbl: "2023-03-15", val: "20230315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "10", valToPush: "05" },
            { fromDt: "11", toDt: "20", valToPush: "15" },
            { fromDt: "21", toDt: "31", valToPush: "25" },
          ]);
        },
      },

      bToDate15: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 15,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 1 },
        defaultSelectedOption: { lbl: "2023-03-08", val: "20230308" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "15", valToPush: "08" },
            { fromDt: "16", toDt: "31", valToPush: "23" },
          ]);
        },
      },

      bToDate30: {
        showIfProperty: "compositeDateOptions",
        showIfVal: 30,
        displayName: "B-Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        isSetDefaultDate: true,
        isShowPrevYearOption: true,
        // defaultSelectedOption: { lbl: "yearBack", val: 1 },
        defaultSelectedOption: { lbl: "2023-03-15", val: "20230315" },
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt, [
            { fromDt: "01", toDt: "31", valToPush: "15" },
          ]);
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S1P1",
    legendUrl:
      "https://vedas.sac.gov.in/ridam_server/wms/?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[-0.4:ff0000FF:-0.35:ff0000FF:-0.3:ff6026FF:-0.25:febf4cFF:-0.2:fec946FF:-0.1:ffebb4FF:0:ffffffff:0.1:e6f0e6FF:0.2:b4d3b3FF:0.25:82b681FF:0.3:4d974cFF:0.35:187817FF:0.4:187817FF]&LEGEND_OPTIONS=columnHeight:400;height:50;width:350",
    splitDateAt: 0,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M2",
        PROJECTION: projection,
        ARGS: "merge_method1:max;merge_method2:max;dataset_id1:T3S1P1;from_time1:{{{aFromDate}}};to_time1:{{{aToDate}}};dataset_id2:T3S1P1;from_time2:{{{bFromDate}}};to_time2:{{{bToDate}}}",
        STYLES:
          "[-250:ff0000FF:-100:ff0000FF:-80:ff6026FF:-60:febf4cFF:-40:fec946FF:-20:ffebb4FF:0:ffffffff:20:e6f0e6FF:40:b4d3b3FF:60:82b681FF:80:4d974cFF:100:187817FF:250:187817FF]",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
    },
    layer: "",
    zIndex: 0,
  },

  min_temp_imd: {
    id: "min_temp_imd",
    displayName: "Minimum Temp [IMD]",
    isShow: true,
    type: "tile",
    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt);
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T5S2P1",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T5S2P1;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[-31:00000000:-20:0E0EFF00:-10:0E0EFFFF:0:4040FFFF:10:40A8FFFF:20:40FFFFFF:30:A8FFA8FF:40:FFFF40FF:50:FFA800FF:60:FF4000FF;nodata:FFFFFFFF]",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  max_temp_imd: {
    id: "max_temp_imd",
    displayName: "Maximum Temp [IMD]",
    isShow: true,
    type: "tile",
    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        optionGenerator: async function (url, datasetId, splitDateAt) {
          return await getAvlDates(url, datasetId, splitDateAt);
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T5S2P2",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T5S2P2;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[-31:00000000:-20:0E0EFF00:-10:0E0EFFFF:0:4040FFFF:10:40A8FFFF:20:40FFFFFF:30:A8FFA8FF:40:FFFF40FF:50:FFA800FF:60:FF4000FF;nodata:FFFFFFFF]",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },

  lighting_Probability_panel: {
    id: "lighting_Probability_panel",
    displayName: "Lighteing Probability (EUMETSAT NWC)",
    isShow: true,
    type: "tile",
    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        selectedOption: "",
        optionGenerator: async function (url) {
          return getRidamAvlTimestamp(url, "T5S7P1");

          /*
            url,
  datasetId,
  splitDateAt=null,
  allowedValues=null,
  toDateDiff = 2,
  addNumberOfdaysInLabel=null,
  dateLabelFormat=null,
          */
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    legendUrl: "https://vedas.sac.gov.in/uva/assets/img/legend/lightening.png",
    legendHeight: "400px",
    datasetId: "T5S7P1",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:max;dataset_id:T5S7P1;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES: "0:00bcd4ff;1:cddc39ff;2:ff9800ff;3:c03bffff;4:ff5722ff",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  sentinel2_ndvi_season_composite: {
    id: "sentinel2_ndvi_season_composite",
    displayName: "Sentinel-2 NDVI Seasonal Composite",
    isShow: true,
    type: "tile",
    isSeasonal: true,
    parameters: {
      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertorSeason,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S1P1",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "merge_method:{{{operation}}};dataset_id:T3S1P1;from_time:{{{seasonFromDate}}};to_time:{{{seasonToDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:1:f0ebecFF:25:d8c4b6FF:50:ab8a75FF:75:917732FF:100:70ab06FF:125:459200FF:150:267b01FF:175:0a6701FF:200:004800FF:251:001901FF];nodata:FFFFFF00",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
    },
  },
  sentinel2_ndvi_season_composite_difference: {
    id: "sentinel2_ndvi_season_composite_difference",
    displayName: "Sentinel-2 NDVI Seasonal Composite Difference",
    isShow: true,
    type: "tile",
    isSeasonal: true,
    parameters: {
      compareYear: {
        displayName: "Comparison Year",
        type: "choice",
        typeOfData: "date",
        options: yearOptions,
        selectedOption: yearOptions[1],
      },

      operation: {
        displayName: "Op.",
        type: "choice",
        options: operationOptions,
        selectedOption: operationOptions[0],
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertorSeason,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T3S1P1",
    splitDateAt: 0,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",
      layerParams: {
        name: "RDSGrdient",
        layers: "T0S0M2",
        PROJECTION: projection,
        ARGS: "merge_method1:{{{operation}}};merge_method2:{{{operation}}};dataset_id1:T3S1P1;from_time1:{{{seasonFromDate}}};to_time1:{{{seasonToDate}}};dataset_id2:T3S1P1;from_time2:{{{compareSeasonFromDate}}};to_time2:{{{compareSeasonToDate}}}",
        STYLES:
          "[-250:ff0000FF:-100:ff0000FF:-80:ff6026FF:-60:febf4cFF:-40:fec946FF:-20:ffebb4FF:0:ffffffff:20:e6f0e6FF:40:b4d3b3FF:60:82b681FF:80:4d974cFF:100:187817FF:250:187817FF]",
        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
    },
    layer: "",
    zIndex: 0,
  },
  S2_AI_Building_Probability: {
    id: "S2_AI_Building_Probability",
    displayName: "S2 AI Building Probability",
    isShow: true,
    type: "tile",
    isDifference: true,
    autoActivateTool: true,

    parameters: {
      toDate: {
        displayName: "Date",
        type: "choice",
        typeOfData: "date",
        options: [],
        isShowPrevYearOption: false,
        selectedOption: "",
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },

      pol: {
        displayName: "Threshold",
        type: "choice",
        options: s2_building,
        selectedOption: s2_building[2],
        displayNameStyle: {
          color: "black",
        },
      },
    },
    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      // "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    // https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=T6S1P15
    datasetId: "T6S1P15",

    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",
      layerParams: {
        0.2: {
          name: "RDSGrdient",
          layers: "T0S0M0",
          PROJECTION: "EPSG:4326",
          ARGS: "dataset_id:T6S1P15;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFA500FF:30:FF4500FF:40:DC143CFF:50:DC143CFF:60:8B0000FF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
        },
        0.3: {
          name: "RDSGrdient",
          layers: "T0S0M0",
          PROJECTION: "EPSG:4326",
          ARGS: "dataset_id:T6S1P15;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFA500FF:40:FF4500FF:50:DC143CFF:60:DC143CFF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
        },

        0.4: {
          name: "RDSGrdient",
          layers: "T0S0M0",
          PROJECTION: "EPSG:4326",
          ARGS: "dataset_id:T6S1P15;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFA500FF:50:FF4500FF:60:DC143CFF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
        },

        0.5: {
          name: "RDSGrdient",
          layers: "T0S0M0",
          PROJECTION: "EPSG:4326",
          ARGS: "dataset_id:T6S1P15;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFA500FF:60:FF4500FF:70:DC143CFF:80:8B0000FF:90:8B0000FF];nodata:FFFFFF00",
        },

        0.6: {
          name: "RDSGrdient",
          layers: "T0S0M0",
          PROJECTION: "EPSG:4326",
          ARGS: "dataset_id:T6S1P15;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFFFFF00:60:FFA500FF:70:FF4500FF:80:DC143CFF:90:8B0000FF];nodata:FFFFFF00",
        },

        0.7: {
          name: "RDSGrdient",
          layers: "T0S0M0",
          PROJECTION: "EPSG:4326",
          ARGS: "dataset_id:T6S1P15;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFFFFF00:60:FFFFFF00:70:FFA500FF:80:DC143CFF:90:8B0000FF];nodata:FFFFFF00",
        },

        0.8: {
          name: "RDSGrdient",
          layers: "T0S0M0",
          PROJECTION: "EPSG:4326",
          ARGS: "dataset_id:T6S1P15;from_time:{{{toDate}}};to_time:{{{toDate}}};indexes:1",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFFFFF00:60:FFFFFF00:70:FFFFFF00:80:FFA500FF:90:DC143CFF];nodata:FFFFFF00",
        },

        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
      layer: "",
      zIndex: 0,
      extent: [69, 20, 72, 25],
    },
  },
  S2_AI_Building_Probability_difference: {
    id: "S2_AI_Building_Probability_difference",
    displayName: "S2 AI Building Probability Difference (A-B)",
    isShow: true,
    type: "tile",
    // isSeasonal: true,

    // parameters: {
    //   afromDate: {
    //     displayName: "A1-Date",
    //     typeOfData: "date",
    //     type: "choice",
    //     options: [],
    //     selectedOption: "",
    //     isShowPrevYearOption: true,
    //     isSetDefaultDate: true,
    //     defaultSelectedOption: { lbl: "2025-04-16", val: "20250416" },
    //     optionGenerator: async function (
    //       url,
    //       datasetId,
    //       splitDateAt,
    //       addNumberOfdaysInLabel
    //     ) {
    //       return await getAvlDates(
    //         url,
    //         datasetId,
    //         splitDateAt,
    //         "",
    //         "",
    //         addNumberOfdaysInLabel
    //       );
    //     },
    //   },
    //   bfromDate: {
    //     displayName: "A2-Date",
    //     typeOfData: "date",
    //     type: "choice",
    //     options: [],
    //     selectedOption: "",
    //     isShowPrevYearOption: true,
    //     defaultSelectedOption: "",
    //     optionGenerator: async function (
    //       url,
    //       datasetId,
    //       splitDateAt,
    //       addNumberOfdaysInLabel
    //     ) {
    //       return await getAvlDates(
    //         url,
    //         datasetId,
    //         splitDateAt,
    //         "",
    //         "",
    //         addNumberOfdaysInLabel
    //       );
    //     },
    //   },
    //   atoDate: {
    //     displayName: "B1-Date",
    //     typeOfData: "date",
    //     type: "choice",
    //     options: [],
    //     selectedOption: "",
    //     isShowPrevYearOption: true,
    //     // defaultSelectedOption: "",
    //     isSetDefaultDate: true,
    //     defaultSelectedOption: { lbl: "2024-05-01", val: "20240501" },

    //     optionGenerator: async function (
    //       url,
    //       datasetId,
    //       splitDateAt,
    //       addNumberOfdaysInLabel
    //     ) {
    //       return await getAvlDates(
    //         url,
    //         datasetId,
    //         splitDateAt,
    //         "",
    //         "",
    //         addNumberOfdaysInLabel
    //       );
    //     },
    //   },
    //   btoDate: {
    //     displayName: "B2-Date",
    //     typeOfData: "date",
    //     type: "choice",
    //     options: [],
    //     selectedOption: "",
    //     isShowPrevYearOption: true,
    //     // defaultSelectedOption: "",
    //     isSetDefaultDate: true,
    //     defaultSelectedOption: { lbl: "2024-05-16", val: "20240516" },

    //     optionGenerator: async function (
    //       url,
    //       datasetId,
    //       splitDateAt,
    //       addNumberOfdaysInLabel
    //     ) {
    //       return await getAvlDates(
    //         url,
    //         datasetId,
    //         splitDateAt,
    //         "",
    //         "",
    //         addNumberOfdaysInLabel
    //       );
    //     },
    //   },
    //   pol: {
    //     displayName: "Threshold",
    //     type: "choice",
    //     options: s2_building,
    //     selectedOption: s2_building[2],
    //     displayNameStyle: {
    //       color: "black",
    //     },
    //   },
    // },
    // parameters: {
    //   compositeDateOptions: {
    //     displayName: "Composite",
    //     type: "choice",
    //     options: compositeDateOptions,
    //     selectedOption: compositeDateOptions[0],
    //   },
    //   aToDate: {
    //     showIfProperty: "compositeDateOptions",
    //     showIfVal: 1,
    //     displayName: "A-Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     selectedOption: "",
    //     isSetDefaultDate: true,
    //     isShowPrevYearOption: true,
    //     optionGenerator: async function (url, datasetId, splitDateAt) {
    //       return await getAvlDates(url, datasetId, splitDateAt);
    //     },
    //   },
    //   aToDate5: {
    //     showIfProperty: "compositeDateOptions",
    //     showIfVal: 5,
    //     displayName: "A-Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     selectedOption: "",
    //     isSetDefaultDate: true,
    //     isShowPrevYearOption: true,
    //     defaultSelectedOption: { lbl: "2024-03-07", val: "20240307" },
    //     optionGenerator: async function (url, datasetId, splitDateAt) {
    //       return await getAvlDates(url, datasetId, splitDateAt, [
    //         { fromDt: "01", toDt: "05", valToPush: "03" },
    //         { fromDt: "06", toDt: "10", valToPush: "08" },
    //         { fromDt: "11", toDt: "15", valToPush: "13" },
    //         { fromDt: "16", toDt: "20", valToPush: "18" },
    //         { fromDt: "21", toDt: "25", valToPush: "23" },
    //         { fromDt: "26", toDt: "31", valToPush: "28" },
    //       ]);
    //     },
    //   },
    //   aToDate10: {
    //     showIfProperty: "compositeDateOptions",
    //     showIfVal: 10,
    //     displayName: "A-Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     selectedOption: "",
    //     isSetDefaultDate: true,
    //     isShowPrevYearOption: true,
    //     defaultSelectedOption: { lbl: "2024-04-16", val: "20240416" },
    //     optionGenerator: async function (url, datasetId, splitDateAt) {
    //       return await getAvlDates(url, datasetId, splitDateAt, [
    //         { fromDt: "01", toDt: "10", valToPush: "05" },
    //         { fromDt: "11", toDt: "20", valToPush: "15" },
    //         { fromDt: "21", toDt: "31", valToPush: "25" },
    //       ]);
    //     },
    //   },
    //   aToDate15: {
    //     showIfProperty: "compositeDateOptions",
    //     showIfVal: 15,
    //     displayName: "A-Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     selectedOption: "",
    //     isSetDefaultDate: true,
    //     isShowPrevYearOption: true,
    //     defaultSelectedOption: { lbl: "2024-03-07", val: "20240307" },
    //     optionGenerator: async function (url, datasetId, splitDateAt) {
    //       return await getAvlDates(url, datasetId, splitDateAt, [
    //         { fromDt: "01", toDt: "15", valToPush: "08" },
    //         { fromDt: "16", toDt: "31", valToPush: "23" },
    //       ]);
    //     },
    //   },
    //   aToDate30: {
    //     showIfProperty: "compositeDateOptions",
    //     showIfVal: 30,
    //     displayName: "A-Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     selectedOption: "",
    //     isSetDefaultDate: true,
    //     isShowPrevYearOption: true,
    //     defaultSelectedOption: { lbl: "2024-04-16", val: "20240416" },
    //     optionGenerator: async function (url, datasetId, splitDateAt) {
    //       return await getAvlDates(url, datasetId, splitDateAt, [
    //         { fromDt: "01", toDt: "31", valToPush: "15" },
    //       ]);
    //     },
    //   },

    //   bToDate: {
    //     showIfProperty: "compositeDateOptions",
    //     showIfVal: 1,
    //     displayName: "B-Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     selectedOption: "",
    //     isShowPrevYearOption: true,
    //     defaultSelectedOption: { lbl: "yearBack", val: 1 },
    //     optionGenerator: async function (url, datasetId, splitDateAt) {
    //       return await getAvlDates(url, datasetId, splitDateAt);
    //     },
    //   },
    //   bToDate5: {
    //     showIfProperty: "compositeDateOptions",
    //     showIfVal: 5,
    //     displayName: "B-Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     selectedOption: "",
    //     isSetDefaultDate: true,
    //     isShowPrevYearOption: true,
    //     // defaultSelectedOption: { lbl: "yearBack", val: 1 },
    //     defaultSelectedOption: { lbl: "2023-03-03", val: "20230303" },
    //     optionGenerator: async function (url, datasetId, splitDateAt) {
    //       return await getAvlDates(url, datasetId, splitDateAt, [
    //         { fromDt: "01", toDt: "05", valToPush: "03" },
    //         { fromDt: "06", toDt: "10", valToPush: "08" },
    //         { fromDt: "11", toDt: "15", valToPush: "13" },
    //         { fromDt: "16", toDt: "20", valToPush: "18" },
    //         { fromDt: "21", toDt: "25", valToPush: "23" },
    //         { fromDt: "26", toDt: "31", valToPush: "28" },
    //       ]);
    //     },
    //   },
    //   bToDate10: {
    //     showIfProperty: "compositeDateOptions",
    //     showIfVal: 10,
    //     displayName: "B-Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     selectedOption: "",
    //     isSetDefaultDate: true,
    //     isShowPrevYearOption: true,
    //     // defaultSelectedOption: { lbl: "yearBack", val: 1 },
    //     defaultSelectedOption: { lbl: "2023-03-18", val: "20230318" },
    //     optionGenerator: async function (url, datasetId, splitDateAt) {
    //       return await getAvlDates(url, datasetId, splitDateAt, [
    //         { fromDt: "01", toDt: "10", valToPush: "05" },
    //         { fromDt: "11", toDt: "20", valToPush: "15" },
    //         { fromDt: "21", toDt: "31", valToPush: "25" },
    //       ]);
    //     },
    //   },

    //   bToDate15: {
    //     showIfProperty: "compositeDateOptions",
    //     showIfVal: 15,
    //     displayName: "B-Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     selectedOption: "",
    //     isSetDefaultDate: true,
    //     isShowPrevYearOption: true,
    //     // defaultSelectedOption: { lbl: "yearBack", val: 1 },
    //     defaultSelectedOption: { lbl: "2023-03-08", val: "20230308" },
    //     optionGenerator: async function (url, datasetId, splitDateAt) {
    //       return await getAvlDates(url, datasetId, splitDateAt, [
    //         { fromDt: "01", toDt: "15", valToPush: "08" },
    //         { fromDt: "16", toDt: "31", valToPush: "23" },
    //       ]);
    //     },
    //   },

    //   bToDate30: {
    //     showIfProperty: "compositeDateOptions",
    //     showIfVal: 30,
    //     displayName: "B-Date",
    //     type: "choice",
    //     typeOfData: "date",
    //     options: [],
    //     selectedOption: "",
    //     isSetDefaultDate: true,
    //     isShowPrevYearOption: true,
    //     // defaultSelectedOption: { lbl: "yearBack", val: 1 },
    //     defaultSelectedOption: { lbl: "2023-03-15", val: "20230315" },
    //     optionGenerator: async function (url, datasetId, splitDateAt) {
    //       return await getAvlDates(url, datasetId, splitDateAt, [
    //         { fromDt: "01", toDt: "31", valToPush: "15" },
    //       ]);
    //     },
    //   },
    //   pol: {
    //     displayName: "Threshold",
    //     type: "choice",
    //     options: s2_building,
    //     selectedOption: s2_building[2],
    //     displayNameStyle: {
    //       color: "black",
    //     },
    //   },
    // },

    parameters: {
      compositeDays: {
        displayName: "Composite Days",
        type: "choice",
        options: [
          { lbl: "1 Day", val: 1 },
          { lbl: "15 Days", val: 15 },
          { lbl: "30 Days", val: 30 },
        ],
        selectedOption: { lbl: "15 Days", val: 15 },
        displayNameStyle: {
          color: "black",
        },
      },

      atoDate: {
        displayName: "A-To Date",
        typeOfData: "date",
        type: "choice",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        isSetDefaultDate: true,
        defaultSelectedOption: { lbl: "2025-04-16", val: "20250416" },
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },

      // afromDate will be auto-calculated - no definition needed here

      btoDate: {
        displayName: "B-To Date",
        typeOfData: "date",
        type: "choice",
        options: [],
        selectedOption: "",
        isShowPrevYearOption: true,
        isSetDefaultDate: true,
        defaultSelectedOption: { lbl: "2024-04-16", val: "20240416" },
        optionGenerator: async function (
          url,
          datasetId,
          splitDateAt,
          addNumberOfdaysInLabel
        ) {
          return await getAvlDates(
            url,
            datasetId,
            splitDateAt,
            "",
            "",
            addNumberOfdaysInLabel
          );
        },
      },

      // bfromDate will be auto-calculated - no definition needed here

      pol: {
        displayName: "Threshold",
        type: "choice",
        options: s2_building,
        selectedOption: s2_building[2],
        displayNameStyle: {
          color: "black",
        },
      },
    },

    uiToFactoryParamsConvertor: uiToFactoryParamsConvertor,
    dateURL:
      "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
    datasetId: "T6S1P15",
    splitDateAt: 2,
    layerFactoryParams: {
      urlTemplate: "https://vedas.sac.gov.in/ridam_server3/wms",
      projection: "EPSG:4326",

      layerParams: {
        0.2: {
          name: "RDSGrdient",
          layers: "T0S0M2",
          PROJECTION: "EPSG:4326",
          ARGS: "merge_method1:max;merge_method2:max;dataset_id1:T6S1P15;from_time1:{{{afromDate}}};to_time1:{{{atoDate}}};dataset_id2:T6S1P15;from_time2:{{{bfromDate}}};to_time2:{{{btoDate}}}",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFA500FF:30:FF4500FF:40:DC143CFF:50:DC143CFF:60:8B0000FF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
        },

        0.3: {
          name: "RDSGrdient",
          layers: "T0S0M2",
          PROJECTION: "EPSG:4326",
          ARGS: "merge_method1:max;merge_method2:max;dataset_id1:T6S1P15;from_time1:{{{afromDate}}};to_time1:{{{atoDate}}};dataset_id2:T6S1P15;from_time2:{{{bfromDate}}};to_time2:{{{btoDate}}}",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFA500FF:40:FF4500FF:50:DC143CFF:60:DC143CFF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
        },

        0.4: {
          name: "RDSGrdient",
          layers: "T0S0M2",
          PROJECTION: "EPSG:4326",
          ARGS: "merge_method1:max;merge_method2:max;dataset_id1:T6S1P15;from_time1:{{{afromDate}}};to_time1:{{{atoDate}}};dataset_id2:T6S1P15;from_time2:{{{bfromDate}}};to_time2:{{{btoDate}}}",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFA500FF:50:FF4500FF:60:DC143CFF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
        },

        0.5: {
          name: "RDSGrdient",
          layers: "T0S0M2",
          PROJECTION: "EPSG:4326",
          ARGS: "merge_method1:max;merge_method2:max;dataset_id1:T6S1P15;from_time1:{{{afromDate}}};to_time1:{{{atoDate}}};dataset_id2:T6S1P15;from_time2:{{{bfromDate}}};to_time2:{{{btoDate}}}",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFA500FF:60:FF4500FF:70:DC143CFF:80:8B0000FF:90:8B0000FF];nodata:FFFFFF00",
        },

        0.6: {
          name: "RDSGrdient",
          layers: "T0S0M2",
          PROJECTION: "EPSG:4326",
          ARGS: "merge_method1:max;merge_method2:max;dataset_id1:T6S1P15;from_time1:{{{afromDate}}};to_time1:{{{atoDate}}};dataset_id2:T6S1P15;from_time2:{{{bfromDate}}};to_time2:{{{btoDate}}}",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFFFFF00:60:FFA500FF:70:FF4500FF:80:DC143CFF:90:8B0000FF];nodata:FFFFFF00",
        },

        0.7: {
          name: "RDSGrdient",
          layers: "T0S0M2",
          PROJECTION: "EPSG:4326",
          ARGS: "merge_method1:max;merge_method2:max;dataset_id1:T6S1P15;from_time1:{{{afromDate}}};to_time1:{{{atoDate}}};dataset_id2:T6S1P15;from_time2:{{{bfromDate}}};to_time2:{{{btoDate}}}",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFFFFF00:60:FFFFFF00:70:FFA500FF:80:DC143CFF:90:8B0000FF];nodata:FFFFFF00",
        },

        0.8: {
          name: "RDSGrdient",
          layers: "T0S0M2",
          PROJECTION: "EPSG:4326",
          ARGS: "merge_method1:max;merge_method2:max;dataset_id1:T6S1P15;from_time1:{{{afromDate}}};to_time1:{{{atoDate}}};dataset_id2:T6S1P15;from_time2:{{{bfromDate}}};to_time2:{{{btoDate}}}",
          STYLES:
            "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFFFFF00:60:FFFFFF00:70:FFFFFF00:80:FFA500FF:90:DC143CFF];nodata:FFFFFF00",
        },

        LEGEND_OPTIONS: "columnHeight:400;height:100",
      },
    },

    layer: "",
    zIndex: 0,
  },
};

export function uiToFactoryParamsConvertorSeason(params) {
  let replaceDictionary = {};

  let selectedYear = params["year"].selectedOption.val;
  selectedYear = selectedYear.substring(0, 4);

  let selectedSeason =
    params["compositeSeasonOptions" + selectedYear].selectedOption.val;

  replaceDictionary["operation"] = params["operation"].selectedOption.val;
  replaceDictionary["seasonFromDate"] =
    params[selectedSeason + "FromDate" + selectedYear].selectedOption.val;
  replaceDictionary["seasonToDate"] =
    params[selectedSeason + "ToDate" + selectedYear].selectedOption.val;

  //Below code is for seasonal difference
  if (params["compareYear"]) {
    replaceDictionary["compareYear"] = params["compareYear"].selectedOption.val;
    let [prevYearFromDate, prevYearToDate] = getSeasonalPreviousDates(
      selectedYear,
      replaceDictionary
    );
    replaceDictionary["compareSeasonFromDate"] = prevYearFromDate;
    replaceDictionary["compareSeasonToDate"] = prevYearToDate;
  }

  return replaceDictionary;
}

export async function getLayerConfig(layer_id) {
  let layerConfigObj = createLayerConfigObj(layer_id);

  // let sortDateArray = [];
  if (layerConfigObj.dateURL && layerConfigObj.isSeasonal) {
    let parameters = {};
    let processedData = await getData(
      layerConfigObj.dateURL,
      layerConfigObj.datasetId
    );
    let sortdDateArray = await sortDateArray(processedData);

    //Generate years from sorted date array
    /*1. Year
      2. Seasons
      3.dates*/

    //Get the unique year array
    let uniqueYearArray = [];

    //check if first date is greater than 1st June to add next year as a Agriculture year.
    let month = sortdDateArray[0].lbl.substring(5, 7);

    if (month >= "06") {
      let nextAgricultureYear = sortdDateArray[0].lbl.substring(0, 4);
      nextAgricultureYear = parseInt(nextAgricultureYear) + 1;
      nextAgricultureYear = String(nextAgricultureYear);
      uniqueYearArray.push(nextAgricultureYear);
    }

    sortdDateArray.forEach((x, index) => {
      let year = x.lbl.substring(0, 4);
      if (
        uniqueYearArray.indexOf(year) < 0 &&
        year !== "2020" &&
        year !== "2018"
      ) {
        uniqueYearArray.push(year);
      }
    });

    let yearOptionsNew = [];

    //dont want to consider 2018 as of today. as no data available
    for (let i = 1; i < uniqueYearArray.length - 1; i++) {
      yearOptionsNew.push({
        lbl: uniqueYearArray[i] + "-" + uniqueYearArray[i - 1],
        val: uniqueYearArray[i] + "-" + uniqueYearArray[i - 1],
        fromVal: uniqueYearArray[i],
        toVal:
          i == 1 && month >= "06" ? uniqueYearArray[i] : uniqueYearArray[i - 1], //
      });
    }

    parameters["year"] = {
      displayName: "Year",
      type: "choice",
      typeOfData: "date",
      options: yearOptionsNew,
      selectedOption: yearOptionsNew[0],
    };

    for (let i = 0; i < yearOptionsNew.length; i++) {
      let seasons = [
        {
          lbl: "Kharif",
          monthsOfSeason: ["06", "07", "08", "09", "10"],
          val: "kharif",
          defaultFromSelectedOption: { lbl: "YYYY-06-01", val: "YYYY0601" },
          defaultToSelectedOption: { lbl: "YYYY-10-31", val: "YYYY1031" },
        },
        {
          lbl: "Rabi",
          monthsOfSeason: ["11", "12", "01", "02", "03"],
          val: "rabi",
          defaultFromSelectedOption: { lbl: "YYYY-11-01", val: "YYYY1101" },
          defaultToSelectedOption: { lbl: "YYYY-03-31", val: "YYYY0331" },
        },
        {
          lbl: "Summer",
          monthsOfSeason: ["04", "05"],
          val: "summer",
          defaultFromSelectedOption: { lbl: "YYYY-04-01", val: "YYYY0401" },
          defaultToSelectedOption: { lbl: "YYYY-05-31", val: "YYYY0531" },
        },
      ];

      //New object for composite season for each year
      let compositeSeasonOptions = {
        showIfProperty: "year",
        showIfVal: yearOptionsNew[i].lbl,
        displayName: "Season",
        type: "choice",
        options: [],
        selectedOption: "",
      };

      //For current year don't include all season because current year might have not completed. Only show till date
      if (i == 0) {
        if (month >= "04" && month <= "05") {
          compositeSeasonOptions.options = seasons;
        } else if (
          month == "11" ||
          month == "12" ||
          month == "01" ||
          month == "02" ||
          month == "03"
        ) {
          compositeSeasonOptions.options.push(seasons[0]);
          compositeSeasonOptions.options.push(seasons[1]);
        } else {
          compositeSeasonOptions.options.push(seasons[0]);
        }
      } else {
        compositeSeasonOptions.options = seasons;
      }

      compositeSeasonOptions.selectedOption = compositeSeasonOptions.options[1];

      let newParameter = "compositeSeasonOptions" + yearOptionsNew[i].fromVal;
      parameters[newParameter] = compositeSeasonOptions;

      //For every season add new date parameter

      let options = compositeSeasonOptions.options;
      for (let j = 0; j < options.length; j++) {
        let fromDateParam = {
          showIfProperty: newParameter,
          showIfVal: options[j].val,
          showIfYearVal: yearOptionsNew[i].val,
          displayName: "From Date",
          type: "choice",
          typeOfData: "date",
          options: [],
          selectedOption: "",
          isSetDefaultDate: true,
        };

        let toDateParam = {
          showIfProperty: newParameter,
          showIfVal: options[j].val,
          showIfYearVal: yearOptionsNew[i].val,
          displayName: "To Date",
          type: "choice",
          typeOfData: "date",
          isSetDefaultDate: true,
          options: [],
          selectedOption: "",
        };
        let [dtArray, seasonFromYear, seasonToYear] = filterDatesInSeason(
          yearOptionsNew[i],
          options[j],
          sortdDateArray
        );
        fromDateParam.options = dtArray;
        fromDateParam.selectedOption = dtArray[dtArray.length - 1];
        toDateParam.options = dtArray;
        toDateParam.selectedOption = dtArray[0];

        //Set default date option

        let newSeasonFromParameter =
          options[j].lbl.toLowerCase() + "FromDate" + seasonFromYear; // kharifToDate2024
        let newSeasonToParameter =
          options[j].lbl.toLowerCase() + "ToDate" + seasonFromYear;

        parameters[newSeasonFromParameter] = fromDateParam;
        parameters[newSeasonToParameter] = toDateParam;
      }
    }

    let parameterKeys = Object.keys(parameters);
    for (let i = 0; i < parameterKeys.length; i++) {
      layerConfigObj.parameters[parameterKeys[i]] =
        parameters[parameterKeys[i]];
    }

    // layerConfigObj.parameters = JSON.parse(JSON.stringify(parameters));
  } else if (layerConfigObj.parameters) {
    for (let [param_key, param] of Object.entries(layerConfigObj.parameters)) {
      if (param.optionGenerator) {
        console.log(`Option gen`, layerConfigObj);
        if (layerConfigObj.isDatesFromGeoEntity) {
          console.log(`Enterd in geo dates`);
          param.options = await param.optionGenerator(
            layerConfigObj.dateURL,
            layerConfigObj.geoEntityConfig
          );
          console.log(`Geoentity params`, param.options);
        } else {
          param.options = await param.optionGenerator(
            layerConfigObj.dateURL,
            layerConfigObj.datasetId,
            layerConfigObj.splitDateAt,
            layerConfigObj.addNumberOfdaysInLabel
              ? layerConfigObj.addNumberOfdaysInLabel
              : 0
          );
          console.log(`Non Geoentity params`, param.options);
        }

        if (param.defaultSelectedOption) {
          if (param.isSetDefaultDate) {
            if (param.options[0].val >= param.defaultSelectedOption.val) {
              param.selectedOption = param.defaultSelectedOption;
            } else {
              param.selectedOption = param.options[0];
            }
          } else {
            let dateToSet = param.options[0];
            let [year, month, day] = getYearMonthDate(dateToSet.val);
            year = parseInt(year) - param.defaultSelectedOption.val;
            let dtObj = dateStringToDateObj(year, month, day);
            param.selectedOption = dtObj;
          }
        } else {
          param.selectedOption = param.options[0];
        }
      }
    }
  }

  return layerConfigObj;
}

function filterDatesInSeason(yearObj, seasonObj, sortdDateArray) {
  let seasonFromYear = yearObj.fromVal;
  let seasonToYear = yearObj.toVal;
  let seasonMonths = seasonObj.monthsOfSeason;

  let dateArraylength = sortdDateArray.length;
  let filteredDates = [];
  let season = seasonObj.lbl;

  for (let dt = 0; dt < dateArraylength - 1; dt++) {
    let [year, month, date] = getYearMonthDate(sortdDateArray[dt].val);
    //
    if (
      parseInt(year) < parseInt(seasonFromYear) &&
      parseInt(year) > parseInt(seasonToYear)
    ) {
      continue;
    }

    if (
      season == "Kharif" &&
      year == seasonFromYear &&
      seasonMonths.indexOf(month) >= 0
    ) {
      filteredDates.push(sortdDateArray[dt]);
    } else if (
      season == "Summer" &&
      year == seasonToYear &&
      seasonMonths.indexOf(month) >= 0
    ) {
      filteredDates.push(sortdDateArray[dt]);
    } else if (
      (season == "Rabi" &&
        year == seasonFromYear &&
        ["11", "12"].indexOf(month) >= 0) ||
      (season == "Rabi" &&
        parseInt(year) == parseInt(seasonToYear) &&
        ["01", "02", "03"].indexOf(month) >= 0)
    ) {
      filteredDates.push(sortdDateArray[dt]);
    }
  }

  return [filteredDates, seasonFromYear, seasonToYear];
}
export const createLayerConfigObj = (layer_id) => {
  let new_layer = deepCopyObj(layers[layer_id]);
  return new_layer;
};

export function uiToFactoryParamsConvertor(params) {
  // Helper function to calculate from date based on composite days
  function calculateFromDate(toDateVal, compositeDays) {
    if (!toDateVal) return "";
    
    const year = parseInt(toDateVal.substring(0, 4));
    const month = parseInt(toDateVal.substring(4, 6)) - 1;
    const day = parseInt(toDateVal.substring(6, 8));
    
    const date = new Date(year, month, day);
    date.setDate(date.getDate() - compositeDays);
    
    const fromYear = date.getFullYear();
    const fromMonth = String(date.getMonth() + 1).padStart(2, "0");
    const fromDay = String(date.getDate()).padStart(2, "0");
    
    return `${fromYear}${fromMonth}${fromDay}`;
  }

  // declare empty dictionary
  let replaceDictionary = {};
  
  Object.keys(params).forEach((key) => {
    switch (key) {
      // Handle composite days for automatic from date calculation
      case "compositeDays":
        replaceDictionary[key] = params[key].selectedOption.val;
        break;
        
      case "toDate":
        getReplaceDictValueFromUI(
          replaceDictionary,
          params,
          key,
          params[key],
          "fromDate",
          "toDate"
        );
        break;
      case "rToDate":
        getReplaceDictValueFromUI(
          replaceDictionary,
          params,
          key,
          params[key],
          "rFromDate",
          "rToDate"
        );
        break;
      case "gToDate":
        getReplaceDictValueFromUI(
          replaceDictionary,
          params,
          key,
          params[key],
          "gFromDate",
          "gToDate"
        );
        break;
      case "bToDate":
        getReplaceDictValueFromUI(
          replaceDictionary,
          params,
          key,
          params[key],
          "bFromDate",
          "bToDate"
        );
        break;
        
      // NEW: Handle atoDate with automatic afromDate calculation
      case "atoDate":
        const aToDateVal = params.atoDate?.selectedOption?.val;
        replaceDictionary["atoDate"] = aToDateVal || "";
        
        // Calculate afromDate automatically if compositeDays exists
        if (params.compositeDays && aToDateVal) {
          const compositeDays = params.compositeDays.selectedOption.val;
          replaceDictionary["afromDate"] = calculateFromDate(aToDateVal, compositeDays);
        }
        break;
        
      // NEW: Handle btoDate with automatic bfromDate calculation
      case "btoDate":
        const bToDateVal = params.btoDate?.selectedOption?.val;
        replaceDictionary["btoDate"] = bToDateVal || "";
        
        // Calculate bfromDate automatically if compositeDays exists
        if (params.compositeDays && bToDateVal) {
          const compositeDays = params.compositeDays.selectedOption.val;
          replaceDictionary["bfromDate"] = calculateFromDate(bToDateVal, compositeDays);
        }
        break;
        
      case "aToDate":
        getReplaceDictValueFromUI(
          replaceDictionary,
          params,
          key,
          params[key],
          "aFromDate",
          "aToDate"
        );
        break;
      case "min":
        replaceDictionary[key] = parseFloat(params.min.selectedOption.val) * 100;
        if (params.min.boundaryStep) {
          replaceDictionary["minColorB"] =
            parseFloat(params.min.selectedOption.val) * 100 +
            params.min.boundaryStep;
        }
        break;
      case "max":
        replaceDictionary[key] = parseFloat(params.max.selectedOption.val) * 100;
        if (params.max.boundaryStep) {
          replaceDictionary["maxColorB"] =
            parseFloat(params.max.selectedOption.val) * 100 +
            params.max.boundaryStep;
        }
        break;
      case "minColor":
        let splitArr = params.minColor.selectedOption.val.split("#");
        replaceDictionary[key] = splitArr[1] + "ff";
        break;
      case "maxColor":
        let splitArrMax = params.maxColor.selectedOption.val.split("#");
        replaceDictionary[key] = splitArrMax[1] + "ff";
        break;
      default:
        replaceDictionary[key] = params[key].selectedOption.val;
        break;
    }
  });
  
  return replaceDictionary;
}


function getSeasonalPreviousDates(selectedyear, replaceDictionary) {
  let curYear = parseInt(selectedyear);
  let compareYear1 = parseInt(replaceDictionary["compareYear"].substring(0, 4));

  let diff = curYear - compareYear1;

  let seasonFromDate = replaceDictionary["seasonFromDate"];
  let seasonToDate = replaceDictionary["seasonToDate"];

  let [curSeasonFromYear, curSeasonFromMonth, curSeasonFromDate] =
    getYearMonthDate(seasonFromDate);
  let [curSeasonToYear, curSeasonToMonth, curSeasonToDate] =
    getYearMonthDate(seasonToDate);

  let prevFromYear = curSeasonFromYear - diff;
  let prevToYear = curSeasonToYear - diff;

  let prevYearFromDate = prevFromYear + curSeasonFromMonth + curSeasonFromDate;
  let prevYearToDate = prevToYear + curSeasonToMonth + curSeasonToDate;

  return [prevYearFromDate, prevYearToDate];
}

export function uiToFactoryParamsConvertorInsat(params) {
  let replaceDictionary = {};
  let selectedDateVal = params.toDate.selectedOption.val;
  replaceDictionary["selectedDateVal"] = selectedDateVal;
  replaceDictionary["year"] = selectedDateVal.substring(5, 9);
  replaceDictionary["curDate"] = selectedDateVal.substring(0, 5);

  return replaceDictionary;
}

export async function getLegacyAvlDates(
  url,
  exprId,
  splitDateAt,
  allowedValues
) {
  let dateURL = url + exprId;
  let res = await getAsyncData(dateURL);
  let data = res[exprId];

  let processedDateArray = await formatDates(data, "_", splitDateAt);
  let uniqueArray = removeDupliactesFromArrayOfObject(processedDateArray);
  let sortdDateArray = await sortDateArray(uniqueArray);

  let filteredDates = filterDatesWithinRange(allowedValues, sortdDateArray);

  if (filteredDates.length > 0) {
    return filteredDates;
  } else return sortdDateArray;
}

export async function getData(
  url,
  datasetId,
  addNumberOfdaysInLabel,
  dateLabelFormat
) {
  if (datasetId instanceof Promise) {
    console.warn("datasetId was a Promise — resolving it");
    datasetId = await datasetId;
  }

  let date_url = datasetTimestampUrl + datasetId;
  // let date_url = `${datasetTimestampUrl}${encodeURIComponent(datasetId)}`;
  console.log("FINAL date_url:", date_url);

  let res = await getAsyncData(date_url);
  //Get date array from response dictionary
  res = res["result"][datasetId];

  let processedData = null;

  processedData = await formatDates(
    res,
    " ",
    0,
    addNumberOfdaysInLabel,
    dateLabelFormat
  );

  return processedData;
}

export async function getDatesFromGeoEntity(url, obj) {
  console.log(`Received data `, url, obj);
  let processedData = await getGeoEntityData(url, obj);
  let sortdDateArray = await sortDateArray(processedData);
  console.log(`Data is sorted`, sortdDateArray);
  // let filteredDates = filterDatesWithinRange(allowedValues, sortdDateArray);
  // if (filteredDates.length > 0) return filteredDates;
  // else return processedData;

  return sortdDateArray;
}

export async function getGeoEntityData(url, obj) {
  let date_url =
    url + obj.sourceId + "/params/timestamps?params=" + obj.paramId;
  let res = await getAsyncData(date_url);
  //Get date array from response dictionary
  res = res[obj.paramId];
  console.log(`Geo dates data is`, res);
  let processedData = await formatGeoEntityDates(res);
  return processedData;
}

//Fetch dates
export async function getAvlDates(
  url,
  datasetId,
  splitDateAt = null,
  allowedValues = null,
  toDateDiff = 2,
  addNumberOfdaysInLabel = null,
  dateLabelFormat = null
) {
  console.log(
    "getAvlDates:",
    url,
    datasetId,
    splitDateAt,
    allowedValues,
    toDateDiff,
    addNumberOfdaysInLabel,
    dateLabelFormat
  );
  let processedData = await getData(
    url,
    datasetId,
    addNumberOfdaysInLabel,
    dateLabelFormat
  );
  console.log("processedData", dateLabelFormat);
  let sortdDateArray = await sortDateArray(processedData);
  let filteredDates = filterDatesWithinRange(allowedValues, sortdDateArray);
  console.log("filtered dates:", filteredDates);
  if (filteredDates.length > 0) {
    return filteredDates;
  } else {
    return getUniqueObjectsByProperty(processedData, "lbl");
  }
}
function getUniqueObjectsByProperty(arr, property) {
  const seen = new Set();
  return arr.filter((item) => {
    const val = item[property];
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    return true;
  });
}

export async function getAvlSeasonDates(
  url,
  datasetId,
  splitDateAt,
  allowedValues
) {
  let processedData = await getData(url, datasetId);
  let sortdDateArray = await sortDateArray(processedData);
  let filteredDates = [];
  sortdDateArray.forEach((x) => {
    if (x.val >= allowedValues[0].fromDt && x.val <= allowedValues[0].toDt) {
      filteredDates.push(x);
    }
  });

  return filteredDates;
}



utils.js

function getYearMonthDate(dateString) {
  let year = dateString.substring(0, 4);
  let month = dateString.substring(4, 6);
  let day = dateString.substring(6, 8);
  return [year, month, day];
}

function getCompositeDate(dateString, toVal) {
  let year = dateString.substring(0, 4);
  let month = dateString.substring(4, 6);
  let day = dateString.substring(6, 8);
  let date = new Date(year, month - 1, day);

  let compositeDateVal1 = date.getTime() - toVal * 86400000;

  let compositeDate = new Date(compositeDateVal1);

  let toYear = String(compositeDate.getFullYear())
  let toMonth = String(compositeDate.getMonth() + 1);
  toMonth = toMonth.length == 1 ? "0" + toMonth : toMonth;
  let toDay = String(compositeDate.getDate());
  toDay = toDay.length == 1 ? "0" + toDay : toDay;

  let compositeDateVal = toYear + toMonth + toDay;

  return compositeDateVal;
}
function getStyleFormaxar(op) {
  let selected_style = '';
  console.log("selcted maxar op is",op)
  if (op === "Building"){
    selected_style = "[0:FFFFFF00:1:910D09FF:2:FFFFFF00:3:FFFFFF00:4:FFFFFF00];nodata:FFFFFF00"
  }
    else if (op === "Tree") {
  selected_style = "[0:FFFFFF00:1:FFFFFF00:2:32CD32FF:3:FFFFFF00:4:FFFFFF00];nodata:FFFFFF00"
  } else if (op === "Water"){
  selected_style ="[0:FFFFFF00:1:FFFFFF00:2:FFFFFF00:3:00ffffff:4:FFFFFF00];nodata:FFFFFF00"
  }
   else if (op === "Road"){
  selected_style = "[0:FFFFFF00:1:FFFFFF00:2:FFFFFF00:3:FFFFFF00:4:FFFF00ff];nodata:FFFFFF00"

  }else if (op === "All"){
  selected_style = "[0:FFFFFF00:1:910D09FF:2:32CD32FF:3:00ffffff:4:FFFF00ff];nodata:FFFFFF00"
  }


  return selected_style
}

function removeDupliactesFromArrayOfObject(arr) {
  //Removing duplicate dates from array
  const uniqueArray = Array.from(
    new Set(arr.map((el) => JSON.stringify(el)))
  ).map((el) => JSON.parse(el));
  return uniqueArray;
}

//Sort array in descending order
async function sortDateArray(arr) {
  return arr.sort((a, b) => {
    return parseInt(b.val) - parseInt(a.val);
  });
}

//Sort array in descending order
async function sortStringDateArray(arr) {
  return arr.sort((a, b) => {
    return b.val.localeCompare(a.val);
  });
}

function adjustingDate(data) {
  let newData = data.map((dateString) => {
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1;
    const day = parseInt(dateString.substring(6, 8));

    const date = new Date(year, month, day);

    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (isLeapYear && month === 1 && day > 18) {
      date.setDate(date.getDate() + 8);
    } else {
      date.setDate(date.getDate() + 7);
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  });
  return newData;
}

async function formatGeoEntityDates(timestamps) {
  return timestamps.map((ts) => {
    const date = new Date(ts * 1000); // Convert Unix timestamp to Date object
    const formattedLabel =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");
    const formattedDate =
      date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");
    return { lbl: formattedLabel, val: formattedDate };
  });
}

async function formatDates(
  data,
  splitOn,
  dateAtIndex,
  addNumberOfdaysInLabel,
  dateLabelFormat
) {
  //
  console.log("dateLabelFormat:",dateLabelFormat)
  let processedData = data.map((dtTime) => {
    //Spliting date to get only yyyymmdd format date
    splittedDt = dtTime.split(splitOn);
    //at 0 index date in yyyymmdd and at 1 index time
    

    let requiredData = splittedDt[parseInt(dateAtIndex)];
    
    

    //get Year, month, date from required data
    let year = requiredData.substring(0, 4);
    let month = requiredData.substring(4, 6);
    let dt = requiredData.substring(6, 8);

    requiredData = year + month + dt;
    let date = new Date(year, month - 1, parseInt(dt));
    let updateDateLabel = "";

    if (addNumberOfdaysInLabel) {
      if (typeof addNumberOfdaysInLabel === "number") {
        // Original logic when a single number is passed
        date.setDate(date.getDate() + addNumberOfdaysInLabel);

        updateDateLabel = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      } else if (typeof addNumberOfdaysInLabel === "object") {
        // New logic for range-based addition (month and day only)
        let daysToAdd = 0;

        const formattedDate = (inputDate) =>
          `${String(inputDate.getMonth() + 1).padStart(2, "0")}-${String(
            inputDate.getDate()
          ).padStart(2, "0")}`;

        const currentMonthDay = formattedDate(date);

        Object.entries(addNumberOfdaysInLabel).forEach(([key, range]) => {
          const fromMonthDay = formattedDate(
            new Date(`2000-${range.fromTime}`)
          );
          const toMonthDay = formattedDate(new Date(`2000-${range.toTime}`));

          if (
            currentMonthDay >= fromMonthDay &&
            currentMonthDay <= toMonthDay
          ) {
            daysToAdd = parseInt(key, 10); // Use the key as the number of days to add
          }
        });

        if (daysToAdd > 0) {
          date.setDate(date.getDate() + daysToAdd);

          updateDateLabel = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        } else {
        }
      }
    }
    

    let label;
    if (dateLabelFormat=="AY") {
      if(parseInt(month)>=6){
        label = "AY "+year+"-"+(parseInt(year)+1);
      }else{
        label = "AY "+(parseInt(year)-1) +"-"+year ;
      }
      
    } else if (updateDateLabel) {
      label = updateDateLabel;
    } else {
      label = year + "-" + month + "-" + dt;
    }
    //
    // console.log("label::",label,requiredData)
    return { lbl: label, val: requiredData };
  });

  let sortedData = await sortDateArray(processedData);
  //
  return sortedData;
}

function replaceParamsPlaceHolders(layerParams, replaceDictionary) {
  let obj = {};
  //Get UI to Factory params
  if (layerParams) {
    let params = layerParams;

    if (replaceDictionary.pol) {
      let selectedPol = replaceDictionary.pol;
      params = layerParams[selectedPol];
    }

    Object.keys(params).forEach((key) => {
      let val = "";
      if (params[key].includes("{{{")) {
        val = replaceUrlAndParamPlaceholders(params[key], replaceDictionary);
      } else {
        val = params[key];
      }
      obj[key] = val;
    });
  }

  return obj;
}

//Function to replace parameters in url with value.
function replaceUrlAndParamPlaceholders(obj, replacements) {
  return obj.replace(/\{\{\{([^}]+)\}\}\}/g, function (match, key) {
    return replacements[key]; // Replace with value from replacements object, or empty string if not found
  });
}

function getURLAndParams(layerConfig) {
  let url = layerConfig.layerFactoryParams.urlTemplate;
  let replaceDictionary = "";
  let parameters = layerConfig.parameters;

  if (layerConfig.uiToFactoryParamsConvertor) {
    replaceDictionary = layerConfig.uiToFactoryParamsConvertor(
      layerConfig.parameters
    );
  }

  if (parameters) {
    if (
      parameters.compositeDateOptions &&
      parameters.compositeDateOptions.selectedOption.val != 1
    ) {
      if (layerConfig.isRGB) {
        replaceDictionary = calculateToAndFromDate(
          parameters,
          "rFromDate",
          "rToDate",
          replaceDictionary
        );
        replaceDictionary = calculateToAndFromDate(
          parameters,
          "gFromDate",
          "gToDate",
          replaceDictionary
        );
        replaceDictionary = calculateToAndFromDate(
          parameters,
          "bFromDate",
          "bToDate",
          replaceDictionary
        );
      } else if (layerConfig.isDifference) {
        replaceDictionary = calculateToAndFromDate(
          parameters,
          "aFromDate",
          "aToDate",
          replaceDictionary
        );
        replaceDictionary = calculateToAndFromDate(
          parameters,
          "bFromDate",
          "bToDate",
          replaceDictionary
        );
      } else {
        replaceDictionary = calculateToAndFromDate(
          parameters,
          "fromDate",
          "toDate",
          replaceDictionary
        );
      }
    }
  }
  replaceDictionary["datasetId"] = layerConfig.datasetId;
  layerConfig["replaceDictionary"] = replaceDictionary;

  url = url.includes("{{{")
    ? replaceUrlAndParamPlaceholders(url, replaceDictionary)
    : url;

  let params = replaceParamsPlaceHolders(
    layerConfig.layerFactoryParams.layerParams,
    replaceDictionary
  );
  if (layerConfig.id.includes("maxar_tree_building_road_water")){
    // console.log("i got the fire ", layerConfig );
    params.STYLES = getStyleFormaxar(layerConfig?.replaceDictionary?.operation)
    // params.STYLES = 
  }

  return {
    url: url,
    params: params,
  };
}

function calculateToAndFromDate(
  parameters,
  fromDateToFetch,
  toDateToFetch,
  replaceDictionary
) {
  let compositeDateVal = parameters.compositeDateOptions.selectedOption.val;
  let [fromDate, toDate] = [
    replaceDictionary[fromDateToFetch],
    replaceDictionary[toDateToFetch],
  ];

  let obj = {
    dateVal: "",
    fromDateValDiff: "",
    toDateValDiff: "",
    lastDay: "",
  };

  switch (compositeDateVal) {
    case 5:
      let selectedMidDateVal =
        parameters[toDateToFetch + "5"].selectedOption.val;
      obj.dateVal = selectedMidDateVal;
      obj.fromDateValDiff = 2;
      obj.toDateValDiff = 2;
      obj.lastDay = 28;

      break;
    case 10:
      let selectedMidDate10Val =
        parameters[toDateToFetch + "10"].selectedOption.val;
      obj.dateVal = selectedMidDate10Val;
      obj.fromDateValDiff = 4;
      obj.toDateValDiff = 5;
      obj.lastDay = 25;

      break;
    case 15:
      let selectedMidDate15Val =
        parameters[toDateToFetch + "15"].selectedOption.val;
      obj.dateVal = selectedMidDate15Val;
      obj.fromDateValDiff = 7;
      obj.toDateValDiff = 7;
      obj.lastDay = 23;

      break;
    case 30:
      let selectedMidDate30Val =
        parameters[toDateToFetch + "30"].selectedOption.val;
      obj.dateVal = selectedMidDate30Val;
      obj.fromDateValDiff = 14;
      obj.toDateValDiff = 15;
      obj.lastDay = 15;

      break;
  }
  [fromDate, toDate] = getFromAndToDate(obj);

  replaceDictionary[fromDateToFetch] = fromDate;
  replaceDictionary[toDateToFetch] = toDate;
  return replaceDictionary;
}

function getFromAndToDate(obj) {
  let dt = obj.dateVal.substring(6, 8);
  let month = obj.dateVal.substring(4, 6);
  let year = obj.dateVal.substring(0, 4);

  dt = parseInt(dt);
  month = parseInt(month);
  lastDate = getLastDayOfMonth(year, month);

  let fromDate = dt - obj.fromDateValDiff;

  let toDate = dt == obj.lastDay ? lastDate : dt + obj.toDateValDiff;

  fromDate = String(fromDate);
  toDate = String(toDate);

  fromDate = fromDate.length == 1 ? "0" + fromDate : fromDate;
  toDate = toDate.length == 1 ? "0" + toDate : toDate;

  fromDate = obj.dateVal.substring(0, 6) + fromDate;
  toDate = obj.dateVal.substring(0, 6) + toDate;

  return [fromDate, toDate];
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function dateStringToDateObj(year, month, day) {
  return {
    lbl: year + "-" + month + "-" + day,
    val: year + month + day,
  };
}

function deepCopyObj(obj) {
  // Declare object which will store the output
  const result = {};

  // If the object isnt of type object or
  // object is null, undefined, is an Array
  // or a function then no need to iterate
  // over it and simply return it
  if (
    typeof obj !== "object" ||
    typeof obj === undefined ||
    obj === null ||
    Array.isArray(obj) ||
    typeof obj == "function"
  ) {
    return obj;
  }

  // Store the keys of the object
  const keys = Object.keys(obj);

  // Iterate through the keys of the
  // object retrieved above
  for (let key in keys) {
    // Recursively iterate through each of the key.
    result[keys[key]] = deepCopyObj(obj[keys[key]]);
  }
  return result;
}
//This function enables to filter data of dates with allowed values.

function filterDatesWithinRange(allowedValues, sortdDateArray) {
  let filteredDates = [];

  if (allowedValues) {
    let allowedValLength = allowedValues.length;
    let addedDates = [];

    sortdDateArray.forEach((x) => {
      let newDate = { lbl: "", val: "" };
      let dt = x.lbl.split("-")[2];
      for (var i = 0; i < allowedValLength; i++) {
        if (allowedValues[i].fromDt <= dt && allowedValues[i].toDt >= dt) {
          let [year, month, day] = getYearMonthDate(x.val);
          newDate.val = year + month + allowedValues[i].valToPush;
          if (!addedDates.includes(newDate.val)) {
            newDate.lbl = year + "-" + month + "-" + allowedValues[i].valToPush;
            filteredDates.push(newDate);
            addedDates.push(newDate.val);
          }
        }
      }
    });
  }

  return filteredDates;
}

function getReplaceDictValueFromUI(
  replaceDictionary,
  params,
  key,
  param,
  newDictionaryKey,
  useDictionaryKey
) {
  replaceDictionary[key] = param.selectedOption.val;
  if (params.compositeDateOptions) {
    let from_val = parseInt(params.compositeDateOptions.selectedOption.val);
    replaceDictionary[newDictionaryKey] = getCompositeDate(
      replaceDictionary[useDictionaryKey],
      from_val - 1
    );
  }
}

async function getAddress(lon, lat) {
  try{
  let response = await fetch(
    "https://apis.mapmyindia.com/advancedmaps/v1/nwsgvbqbbw5ejwj112vvisgoggiq4ov3/rev_geocode?lat=" +
      lat +
      "&lng=" +
      lon
  );
  let result = await response.json();
  result = result["results"];
  result = result[0];
  let locInfo = result["formatted_address"];
  if (locInfo.startsWith("Unnamed Road")) {
    locInfo = locInfo.substring(14, 200);
  }
  let address =
  "<span style='font-weight:bold;color: #0488d0;font-size:16px'>(Lat, Long):</span><span style='font-size:16px'> (" +
  lat.toFixed(5) +", " +lon.toFixed(5) +
  ") &nbsp;&nbsp;&nbsp;</span><span style='font-weight:bold;color: #0488d0;font-size:16px'>Location:</span><span style='font-size:16px'> " +
  locInfo+'</span>';
return address;
} catch{

    return  "<span style='font-weight:bold;color: #0488d0;font-size:16px'>(Lat, Long):</span><span style='font-size:16px'> (" +
    lat.toFixed(5) +", " +lon.toFixed(5) +
    ") &nbsp;&nbsp;&nbsp;</span><span style='font-weight:bold;color: #0488d0;font-size:16px'>Location:</span><span style='font-size:16px'> " +
    'Reverse Geocoding Failed'+'</span>';

}
}



index.html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description"
        content="UVA( Unified Viauslization And Analysis) is a unified portal to visualize and analyse data of different domains at single platform.">
    <meta name="keywords" content="UVA, Visualization, analysis, Unified">
    <!-- Importing vue lib -->
    <script src="js/TrustedPolicy.js"></script>

    <script src="js/utils.js"></script>


    <script src="js/config.js"></script>
    <script src="js/legacy_config.js"></script>
    <script src="js/lib/vue_2.7.14.js"></script>
    <script src="js/lib/moment.min.js"></script>
    <!-- importing open layer library and style. -->
    <link rel="stylesheet" href="css/lib/ol_6.5.0.css">
    <link rel="stylesheet" href="css/modal.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/newStyle.css">
    <link rel="stylesheet" href="css/story_modal.css">
    <link rel="stylesheet" href="css/switch.css">
    <link rel="stylesheet" href="css/material.css">
    <link rel="stylesheet" href="css/custom.css">
    <link href="assets/img/icons/favicon.ico" rel="icon">
    <!-- <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"rel="stylesheet"> -->
    <script src="js/lib/ol_6.5.0.js"></script>
    <!--add highcharts library from cdn -->
    <script src="js/lib/highcharts.js"></script>
    <script src="js/lib/exporting.js"></script>
    <script src="js/lib/export-data.js"></script>
    <script src="js/lib/accessibility.js"></script>
    <!-- add jsPDF library from cdn -->
    <script src="js/lib/jspdf.umd.min.js"></script>

    <!-- add autotable from cdn -->
    <script src="js/lib/jspdf.plugin.autotable.min.js"></script>

    <!-- import sheetjs from cdn -->
    <script lang="javascript" src="js/lib/xlsx.full.min.js"></script>

    <script type="module" src="js/referenceLayers.js"></script>
    <title>Vedas UVA</title>
</head>
<style>
    #map {
        height: 96%;
        width: auto
    }

    .ol-mouse-position {
        top: 75px;
        right: 18px;
        position: absolute;
        text-shadow: 1px 1px 12px black;
        /* color: var(--primary-background); */
        color: #03128d;
        font-size: 14px;
        z-index: 9999;
        right: 10px;
        background-color: white;
        z-index: 9999;
        padding: 2px 5px;
        border-radius: 5px;
    }

    /* .ol-scale-line {
        bottom: 5% !important;
    } */
</style>

<body>

    <div id="app">

        <div v-show="!hideBanner" class="header">

            <div class="header-left header-desktop" style="font-weight:normal; color: #f96f25;">
                <span v-show="appTitle=='Unified Visualization and Analysis'"
                    style="flex-grow: 0;">VEDAS&nbsp;&nbsp;</span>
                <span class="text-gradient">{{appTitle}}</span>
            </div>
            <div class="header-left header-mobile" style="font-weight:normal; color: #f96f25;">
                <span>&nbsp;&nbsp;</span><strong class="text-gradient">{{shortTitle}}</strong>
                <p class="text-gradient" style="font-size: x-small; font-weight: 700; margin-top: auto; margin-bottom: 0px; margin-left: 14px;">(Unified Visualization and Analysis)</p>
            </div>
            <div class="header-center"></div>
            <div class="header-right">
                <a href="https://www.sac.gov.in" target="_blank">
                    <img src="assets/img/logo/sac.png" alt="ISRO Logo" />
                </a>
                <a href="https://www.isro.gov.in" target="_blank">
                    <img src="assets/img/logo/ISRO_logo.png" alt="ISRO Logo" />
                </a>
            </div>
        </div>

        <!-- Buttons like compare/swipe, share and toggle laye controller box -->
        <div class="action-buttons">
            <!-- Toggle Button for Mobile -->
            <span @click="isMenuOpen = !isMenuOpen" class="material-symbols-outlined fab-action-button mobile-toggle">
                menu
            </span>
            <div class="layer-control-icons" :class="{ 'show-icons': isMenuOpen }">
                <span @click='isShowLayersPanel = !isShowLayersPanel' class="material-symbols-outlined fab-action-button-layer"
                    title="Toggle layer panel" :class="[isShowLayersPanel? 'layer-on':'layer-off' ]">layers</span>
                <span @click="prepareStoryId()" class="material-symbols-outlined fab-action-button" title="Share">share</span>
                <span v-if="!showSwipePanel" @click="openSwipe()" class="material-symbols-outlined fab-action-button"
                    title="Swipe">compare</span>
                <span v-if="showSwipePanel" @click="closeSwipe()" style="background-color:crimson; color:white;"
                    class="material-symbols-outlined fab-action-button" title="Swipe">compare</span>
                <span class="material-symbols-outlined fab-action-button" title="Help"
                    onclick="window.open('Satellite Data Visualization (NRT).pdf');">help</span>
                <span @click="toggleLocationSearch()" class="material-symbols-outlined fab-action-button"
                    :class="isLocationSearchVisible ? 'layer-on' : 'layer-off'" title="Find Location">location_on</span>
                <span @click="getLocationSearch" :class="isMyLocationVisible ? 'layer-on' : 'layer-off'"
                    class="material-symbols-outlined fab-action-button" title="My Location">my_location</span>
                <span @click="toggleLiveTracking()" :class="isLiveTrackingActive ? 'layer-on' : 'layer-off'"
                    class="material-symbols-outlined fab-action-button" title="Live Location Tracking">
                    <span class="material-symbols-outlined">
                        location_chip
                    </span>
                </span>
            </div>
        </div>

        <!-- On click compare/swipe panel opens a swipe panel where user can move layer from left to right for analysis. -->
        <div id="swipePanel" v-if="showSwipePanel">
            <div style="display:flex;">
                <span style="color:grey; flex-grow:0;">Swipe</span>&nbsp;&nbsp;
                <select v-model="swipeLayerConfigId" style="margin-right:20px;" @change="openSwipe()">
                    <option v-for="(layer,id) in selectedLayerConfigToShow" :value="id" v-if="layer.isShow" :key="id">
                        {{layer.displayName}}
                    </option>
                </select>
            </div>
            <div>
                <input @input="renderMap()" id="swipeInput" type="range" min="0" max="100" step="1"
                    style="width:100%; margin-right:20px;" />
            </div>
        </div>


        <!-- Container to show slope chart -->
        <!-- <div id='chart-modal' v-if="isShowChart">
        <span class="chart-close" @click="isShowChart = false">&times;</span>
        <div v-show="loadingChart" id="loading-chart">{{loadingChart}}</div>
        <div id="chart-container" class="chart-container"></div>
      </div>
 -->
        <div class="backdrop" v-show="loadChartMsg"></div>
        <div class="chart-modal" id="chartModal" v-show="loadChartMsg">
            <img src="assets/img/loading2.gif" style="height: 70px;">
            <p>{{loadChartMsg}}</p>
        </div>

        <div class="container-new" v-show="isShowToolOutput">
            <div id="chart-container" style="flex-grow: 1;"></div>
            <button @click='loadChartMsg="";isShowToolOutput=false;' class="chart-close-button">X</button>
        </div>


        <!-- <div class="chart-container-new" v-if="isShowToolOutput">
    <span><button @click='isShowToolOutput=false;'class="close-button">&times;</button></span>
    <div id="chart-container" class="chart" ></div>
    
  </div> -->

        <!-- <div class="chart" v-if="isShowToolOutput">
            <span class="chart-close" ><button @click='isShowToolOutput=false;'class="close-button">X</button></span>  
            <div id="chart-container" class="chart" ></div>
            
        </div> -->


        <div id='layer-controller' v-show="isShowLayersPanel">
            <div id="heading-row">
                <div class="heading-col layer-panel" @click="isShowLayersPanel=false" title="Toggle layer panel">
                    <svg height="34" viewBox="0 -960 960 960" width="24">
                        <path
                            d="M480-118 120-398l66-50 294 228 294-228 66 50-360 280Zm0-202L120-600l360-280 360 280-360 280Zm0-280Zm0 178 230-178-230-178-230 178 230 178Z" />
                    </svg>
                    <span class="heading-span">Layers</span>
                </div>
                <div class="heading-col"><button class="btn" @click="showThemeCatalogue=true"> + &nbsp;Add
                        Layer</button></div>
            </div>

            <div id="container">
                <div class="layer-row" v-for="(layer,id) in selectedLayerConfigToShow">
                    <div class="layer">
                        <div class="layer-name">{{layer.displayName}}</div>

                        <div style="min-width: 70px;">
                            <span v-if="layer && layer.tools"
                                class="material-symbols-outlined-arrow fab-action-arrow span-arrow gear-button"
                                :data-layer="layer.displayName"
                                title="Show tool box"
                                @click="toggleToolbox(layer);runToolAnalysis()">
                            settings
                            </span>
                            <span class=" material-symbols-outlined-arrow fab-action-arrow span-arrow"
                                title="Move layer up" @click="swapLayers('increase',id)">
                                arrow_upward
                            </span>
                            <span class="material-symbols-outlined-arrow fab-action-arrow span-arrow"
                                title="Move layer down" @click="swapLayers('decrease',id)">
                                arrow_downward
                            </span>
                        </div>
                        <label class="switch">
                            <input type="checkbox" :id="id" :key="id" v-model="layer.isShow" @change="toggleLayer(id)">
                            <span class="slider round"></span>
                        </label>
                        <span style='flex:0' @click="removeLayer(id)"
                            class="material-symbols-outlined-close fab-action-button-close" title="Close">close</span>
                    </div>

                    <div class="layer-submenu">

                        <div class='layer-param' v-for="(param,param_key) of layer.parameters "
                            v-show="!param.showIfVal || 
                            (param.showIfVal && param.showIfYearVal && param.showIfYearVal == layer.parameters.year.selectedOption.val && (layer.parameters[param.showIfProperty].selectedOption.val==param.showIfVal))
                            ||(!param.showIfYearVal && param.showIfVal && (layer.parameters[param.showIfProperty].selectedOption.val==param.showIfVal))">

                            <span class="lbl" :style="param.displayNameStyle">{{param.displayName}}</span>


                            <button class="button-style" v-show="param.isShowPrevYearOption"
                                @click="prevYearParamDate(param);updateLayerHelper(id,param_key)">
                                y&nbsp;&lt;
                            </button>

                            <button class="button-style" v-show="param.typeOfData == 'date'"
                                @click="prevParamDate(param,layer.parameters);updateLayerHelper(id,param_key)">
                                &lt;
                            </button>

                            <select @change='updateLayerHelper(id,param_key)' v-model="param.selectedOption"
                                v-if="param.type=='choice'" :style="param.style">
                                <option v-for="option in param.options" :value="option" :title="option.title"
                                    :style="option.style">
                                    {{option?option.lbl:''}}
                                </option>
                            </select>
                            <button class="button-style" v-show="param.typeOfData == 'date'"
                                @click="nextParamDate(param,layer.parameters);updateLayerHelper(id,param_key)">
                                &gt;
                            </button>
                            <button class="button-style" v-show="param.isShowPrevYearOption"
                                @click="nextYearParamDate(param);updateLayerHelper(id,param_key)">
                                &gt;&nbsp;y
                            </button>


                            <button class="button-style" @click="changeDate(param,'prev');updateLayerHelper(id)"
                                v-if="param.type=='calendar'">
                                &lt;
                            </button>
                            <input type="date" @change='updateLayerHelper(id)' v-model="param.selectedOption.val"
                                v-if="param.type=='calendar'">
                            <input type="color" @input='updateLayerHelper(id)' v-model="param.selectedOption.val"
                                v-if="param.type=='color'">
                            <input type="number" @input='updateLayerHelper(id)' @keydown='updateLayerHelper(id)'
                                :style="param.style" v-model="param.selectedOption.val" v-if="param.type=='number'"
                                :min="param.minVal" :max="param.maxVal" :step="param.step">

                            <button class="button-style" @click="changeDate(param,'next');updateLayerHelper(id)"
                                v-if="param.type=='calendar'">
                                &gt;
                            </button>

                        </div>
                        <div v-if="layer.legendUrl" :class="[layer.legendHeight?'legendHeight':'legend']">
                            <img :src='layer.legendUrl'>
                        </div>
                    </div>
                </div>
            </div>
        </div>


        <!-- On click of tool shows this modal -->
        <div id="toolModal" v-show="showToolModal"
        :class="[showToolModal? 'modal-display-block':'modal-display-none' ]">
        <div class="tool-modal-content">
            <div style="display: flex;"  >
                <span id = "tool-modal-title">{{toolLayerConfig.displayName}}</span>
                <span id = "tool-modal-close"
                @click='toggleToolbox(false);showToolModal=false;isShowToolOutput=false;removeAllInteractions();loadChartMsg="";toolLayerConfig = {};$nextTick(() => updateGearButtonStyles())'>&times;</span>
            </div>
            
            <div class="tool-content">
                <span class="tool-label">Tools:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                <select v-model="selectedTool" @change="isShowToolOutput=false;runToolAnalysis()">
                    <option v-for="tool in toolLayerConfig.tools" :value="tool">{{tool.displayName}}</option>
                </select>
                <!-- This shows options of selected tool -->
                <div class="tools-options" v-for="param of selectedTool.params">
                    <span class="tool-label" style="flex: none;">{{param.displayName}}: &nbsp;</span>
                    <select v-model="param.selectedOption" @click="runToolAnalysis();isShowToolOutput=false">
                        <option v-for="op in param.options" :value="op">{{op.displayName}}</option>
                    </select>

                </div>
            </div>
            <div class="tool-content">
                {{selectedTool.helpText}}
            </div>


            </div>
        </div>
        <div v-if="loading" class="loading-backdrop">
            <div class="loading-spinner"> 
                <img src="assets/img/loading2a.gif" alt="Loading..." />
            </div>
            </div>
        <!-- on click add layer, displays layer catalogue to add layer for analysis -->
        <div id="myModal" class="modal" v-show="showThemeCatalogue"
            :class="[showThemeCatalogue? 'modal-display-block':'modal-display-none' ]">
            <!-- Modal content -->
            <div class="modal-content">
                <div class="modal-header">
                    <span v-if="!isShowThemes && (!searchContent || searchContent.trim() === '')"
                    class="material-symbols-outlined fab-action-button" 
                    style="color: #0488d0;"
                    title="Back"
                        v-show="!isShowThemes" 
                        @click="isShowThemes=true">arrow_back</span>
                        <span v-else-if="searchContent && searchContent.trim() !== ''"
                        class="material-symbols-outlined fab-action-button" style="color: #0488d0;"
                        v-if="filteredList && filteredList.length> 0" 
                        title="Back" 
                        @click="clearSearch()">arrow_back </span>
                    <input type="text" v-model="searchContent" placeholder="Search.." class="search-text"
                        @keyup.enter="searchContent" autofocus>
                    <span class="close" style="color: #0488d0;" @click='showThemeCatalogue=false;isShowThemes=true'>&times;</span>
                </div>
                <!-- if searched for layer in serach box. Displays filtered layers -->
                <div class="sub-theme-menu" v-if="filteredList">
                    <div class="subtheme-layer" v-for='layer in filteredList'>
                        <span>{{layer.displayName}} </span>
                        <button class="btn" @click="pushLayer(layer.id)"> +
                            &nbsp;Add
                            </button>
                    </div>
                </div>
                <div class="themes" v-show="isShowThemes && !filteredList">
                    <div v-for="theme in layerThemes" class="new-sub-theme">
                        <div class="theme-name">
                            {{theme.name}}
                        </div>
                        <div class='subtheme-name' v-for="sub_theme in theme.subtheme"
                            @click='sub_theme.isShow_subtheme=true;isShowThemes=false;selectedSubTheme=sub_theme'>
                            {{sub_theme.displayName}}
                        </div>

                    </div>


                </div>

                <div class="sub-theme-menu" v-show="!isShowThemes">
                    <div class="subtheme-layer" v-for="layer in selectedSubTheme.layers">
                        <span>{{layer.displayName}} </span>
                        <button class="btn" @click="pushLayer(layer.id)"> + &nbsp; Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <!-- On share modal opens to with link to share and copy option -->
        <div class='story-modal' :class="[isShowStoryModal? 'modal-display-block':'modal-display-none' ]">
            <div class="story-modal-content">
                <div class="story-text">
                    <div style="flex:1"> Your shareable story link is : </div>
                    <div class="story-close" @click='isShowStoryModal=false;'>&times;</div>
                </div>
                <div style="border: 1px solid rgb(153, 153, 153);
                border-radius: 20px;
                display: flex;
                align-items: center;
                padding: 10px;">
                    <textarea id="auto_resize" ref="textarea" readonly>{{storyLink}}</textarea>
                    <span @click="navigator.clipboard.writeText(storyLink);"
                        class="material-symbols-outlined fab-action-button story-copy"
                        style="font-size: 30px;">content_copy</span>
                </div>
            </div>
        </div>

        <!-- onclick of tools button below tool box modal opens -->
        <!-- on click add layer, displays layer catalogue to add layer for analysis -->
        <!-- <div id="toolBoxModal" class="modal-display-block" v-if="showToolBox">
        Modal content 
        <div class="modal-content">
            <div class="modal-header">
               
                <select v-for="tool in toolLayerConfig.tools" >
                    <option>Select</option>
                    <option>{{tool.name}}</option>
                </select>
               
               
                <span class="close" @click='showToolBox=false;'>&times;</span>
            </div>
       
        </div>
    </div> -->



        <div id='map'>
            <!-- <a href="https://www.vedas.sac.gov.in" target="_blank"> -->
                <img class="vedas-logo" src="assets/img/logo/vedas_logo.png" alt="Vedas Logo">
            <!-- </a> -->
        </div>

        <div id="mouse-position"></div>
        <div class="search-area" id="search-area">


            <div v-if="isLocationSearchVisible" class="searchBox">
                <input type="text" style="border: transparent; width: 110px; padding: 3px 10px; font-size: 13px; border-radius: 3px;" placeholder='Longitude,Latitude'
                    v-model="lonLat" id='search-box' />
                <button @click="findLocation()" class="goButton">Go</button>
            </div>
            <div v-if="isLocationSearchVisible" class="searchBoxAddress">
                <input type="text" id="search-box-address" v-model="searchQuery" @input="fetchSuggestions"
                    @keydown="handleKeydown" placeholder="Enter address" style="border: transparent; width: 110px; padding: 3px 10px; font-size: 13px; border-radius: 3px; " />
                <button @click="findAddress" class="goButton">Go</button>


                <div v-if="suggestions.length" class="autocomplete-items">
                    <div v-for="(item, index) in suggestions" :key="index"
                        :class="{ 'autocomplete-active': index === currentFocus }" @click="selectAddress(item)">
                        <strong v-html="highlightMatch(item.placeAddress)"></strong>
                    </div>
                </div>
            </div>


        </div>
        <div v-if="isMyLocationVisible" class="location-box">
            <span @click="closeLocationBox" class="material-symbols-outlined-close fab-action-button-close" style="position: absolute; right: 3px;" title="Close">close</span>
            <p style="margin-bottom: 8px;"><strong>Latitude:</strong> {{ myLat }}</p>
            <p style="margin-top: 8px;"><strong>Longitude:</strong> {{ myLon }}</p>
          </div>
        <div v-show="!hideFooter" class="footer">
            Copyright © 2025 - All Rights Reserved - Official website of VEDAS, SAC, ISRO, Government of India
        </div>
        <!-- Popup Notification -->
    <div v-if="isPopupVisible" class="popup" :class="{ show: isPopupVisible }">
        {{ popupMessage }}
    </div>
    </div>
</body>
<script type="module" src="js/dateConfig.js"></script>
<script type='module' src="js/app.js"></script>
<!-- <script type="text/javascript" src="js/lib/google_analytics.js"></script> -->
<script type='module' src="js/chart.js"></script>
<script type="module" src="js/layers_config.js"></script>
<script type="module" src="js/themes_config.js"></script>


</html>

