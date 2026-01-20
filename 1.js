s2AIBuildingMonthlyMax: {
  id: "s2AIBuildingMonthlyMax",
  displayName: "S2 AI Building Monthly Max",
  isShow: true,
  type: "tile",
  autoActivateTool: false,

  dateURL: "https://vedas.sac.gov.in/ridamserver3/metadata?settimestamp?prefix",
  datasetId: "T6S1P15",
  splitDateAt: 2,
  
  // ✅ FIXED: Custom convertor for monthly dates
  uiToFactoryParamsConvertor: function(parameters) {
    let replaceDictionary = {};
    
    // Get selected month value (e.g., "20260115" for January 2026)
    let monthVal = parameters.month?.selectedOption?.val || '';
    
    if (monthVal) {
      let year = monthVal.substring(0, 4);
      let month = monthVal.substring(4, 6);
      
      // Generate first and last day of the month
      replaceDictionary.fromDate = year + month + '01';
      
      // Get last day of month (28-31 depending on month/year)
      let lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      replaceDictionary.toDate = year + month + String(lastDay).padStart(2, '0');
    }
    
    // Threshold parameter
    replaceDictionary.threshold = parameters.pol?.selectedOption?.val || '0.4';
    
    console.log('Monthly Building params:', replaceDictionary);
    return replaceDictionary;
  },

  legendUrl: "https://vedas.sac.gov.in/ridamserverwms?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Buildings910D09FF&LEGENDOPTIONS=columnHeight:500;height:40;width:300",

  parameters: {
    month: {
      displayName: "Month",
      type: "choice",
      typeOfData: "date",
      options: [],
      selectedOption: {},
      isShowPrevYearOption: true,
      isSetDefaultDate: true,
      defaultSelectedOption: null,
      // ✅ FIXED: Correct getAvlDates parameters
      optionGenerator: async function (url, datasetId, splitDateAt) {
        // Parameters: url, datasetId, splitDateAt, allowedDatesArray, addNumberOfdaysInLabel, toDateDiff, filterData, dateLabelFormat
        return await getAvlDates(
          url, 
          datasetId, 
          splitDateAt, 
          null,  // allowedDatesArray
          { "15": [{fromDt: "01", toDt: "31", valToPush: "15"}] },  // addNumberOfdaysInLabel - full month to 15th
          null,  // toDateDiff
          null,  // filterData
          "monthYear"  // ✅ FIXED: Use "monthYear" (not "monthName")
        );
      }
    },

    pol: {
      displayName: "Threshold",
      type: "choice",
      options: s2building,
      selectedOption: s2building[2],
      displayNameStyle: { color: "black" }
    }
  },

  layerFactoryParams: {
    urlTemplate: "https://vedas.sac.gov.in/ridamserver3/wms",
    projection: "EPSG4326",
    layerParams: {
      name: "RDSGrdient",
      layers: "T0S1M0",
      PROJECTION: "EPSG4326",
      // ✅ FIXED: Add semicolons between parameters
      ARGS: "mergemethod=max;datasetid=T6S1P15;fromtime={{fromDate}};totime={{toDate}};threshold={{threshold}}",
      STYLES: "0.00E0EFFFF0.1254040FFFF0.2540A8FFFF0.37540FFFFFF0.5A8FFA8FF0.625FFFF40FF0.75FFA800FF0.875FF4000FF1.0FF0000FFnodataFFFFFFFF",
      LEGENDOPTIONS: "columnHeight:400;height:100"
    }
  },

  layer: null,
  zIndex: 0,
  tools: []
},



// Inside formatDates function, add this condition:
else if (dateLabelFormat === "monthYear") {
  const monthNames = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
  label = `${monthNames[parseInt(month) - 1]}${year}`;
}
