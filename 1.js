S2AIBuildingMonthlyMax: {
  id: "S2AIBuildingMonthlyMax",
  displayName: "🏠 S2 AI Building Monthly Max (T6S1P15)",
  isShow: true,
  type: "tile",
  datasetId: "T6S1P15",  // ✅ CORRECTED
  dateURL: "httpsvedas.sac.gov.inridamserver3metadatasettimestamp?prefix",
  splitDateAt: 2,
  parameters: {
    monthDate: {  // ✅ Renamed from generic 'date'
      displayName: "Month",
      type: "choice",
      typeOfData: "date",
      options: [],
      selectedOption: {},
      isShowPrevYearOption: true,
      optionGenerator: async function(url, datasetId, splitDateAt) {
        return await getAvlDates(url, datasetId, splitDateAt, null, {
          "15": [{fromDt: "01", toDt: "31", valToPush: "15"}]  // Full month → 15th
        }, null, null, "monthYear");
      }
    },
    pol: {
      displayName: "Threshold",
      type: "choice",
      options: s2building,
      selectedOption: s2building[2] || {lbl: "0.4", val: "0.4"}
    }
  },
  // ✅ CUSTOM CONVERTOR for monthly dates
  uiToFactoryParamsConvertor: function(parameters) {
    let replaceDictionary = {};
    
    // Extract monthDate value (20251215 format)
    let monthDateVal = parameters.monthDate?.selectedOption?.val || '';
    if (monthDateVal) {
      // Generate full month range: 20251215 → from=20251201, to=20251231
      let year = monthDateVal.substring(0, 4);
      let month = monthDateVal.substring(4, 6);
      replaceDictionary.fromDate = year + month + '01';  // First day
      replaceDictionary.toDate = year + month + '31';    // Last day (server handles)
    }
    
    // Threshold
    replaceDictionary.pol = parameters.pol?.selectedOption?.val || '0.4';
    
    console.log('Monthly Building replaceDictionary:', replaceDictionary);
    return replaceDictionary;
  },
  legendUrl: "httpsvedas.sac.gov.inridamserverwms?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=-3100000000-200E0EFF00-100E0EFFFF04040FFFF1040A8FFFF2040FFFFFF30A8FFA8FF40FFFF40FF50FFA800FF60FF4000FFnodataFFFFFFFF&LEGEND_OPTIONS=columnHeight:400;height:100;",
  layerFactoryParams: {
    urlTemplate: "httpsvedas.sac.gov.inridamserver3wms",
    projection: "EPSG:4326",
    layerParams: {
      name: "RDSGrdient",
      layers: "T0S0M0",
      PROJECTION: "EPSG:4326",
      ARGS: "mergemethod:max;datasetid:T6S1P15;fromtime:{{fromDate}};totime:{{toDate}};indexes:1;pol:{{pol}}",
      STYLES: "-3100000000-200E0EFF00-100E0EFFFF04040FFFF1040A8FFFF2040FFFFFF30A8FFA8FF40FFFF40FF50FFA800FF60FF4000FFnodataFFFFFFFF"
    }
  },
  layer: null,
  zIndex: 0
},




// ADD THIS INSIDE your existing formatDates function:
else if (dateLabelFormat === "monthYear") {
  const monthNames = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
  label = `${monthNames[parseInt(month) - 1]}${year}`;
}
