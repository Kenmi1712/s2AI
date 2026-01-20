s2AIBuildingMonthlyMax: {
  id: "s2AIBuildingMonthlyMax",
  displayName: "S2 AI Building Monthly Max",
  isShow: true,
  type: "tile",
  autoActivateTool: false,
  
  dateURL: "https://vedas.sac.gov.in/ridamserver3/metadata?settimestamp?prefix",
  datasetId: "T6S1P15",
  splitDateAt: 2,
  
  // ✅ CUSTOM CONVERTOR - Handles monthly date conversion
  uiToFactoryParamsConvertor: function(parameters) {
    let replaceDictionary = {};
    
    // Safe check for month parameter
    if (parameters && parameters.month && parameters.month.selectedOption) {
      let monthVal = parameters.month.selectedOption.val;
      
      if (monthVal && monthVal.length === 8) {
        let year = monthVal.substring(0, 4);
        let month = monthVal.substring(4, 6);
        
        // Generate full month range
        replaceDictionary.fromDate = year + month + '01';
        let lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        replaceDictionary.toDate = year + month + String(lastDay).padStart(2, '0');
      }
    }
    
    // Safe check for threshold
    if (parameters && parameters.pol && parameters.pol.selectedOption) {
      replaceDictionary.threshold = parameters.pol.selectedOption.val;
    } else {
      replaceDictionary.threshold = '0.4'; // Default
    }
    
    console.log('Monthly Building replaceDictionary:', replaceDictionary);
    return replaceDictionary;
  },

  legendUrl: "https://vedas.sac.gov.in/ridamserverwms?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFA500FF:40:FF4500FF:50:DC143CFF:60:DC143CFF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00&LEGEND_OPTIONS=columnHeight:400;height:100",

  parameters: {
    month: {
      displayName: "Month",
      type: "choice",
      typeOfData: "date",
      options: [],
      selectedOption: {},
      isShowPrevYearOption: true,
      isSetDefaultDate: false, // ✅ Don't set default to avoid undefined errors
      optionGenerator: async function (url, datasetId, splitDateAt) {
        return await getAvlDates(
          url, 
          datasetId, 
          splitDateAt, 
          null,  // allowedDatesArray
          {"15": [{fromDt: "01", toDt: "31", valToPush: "15"}]},  // Full month → 15th
          null,  // toDateDiff
          null,  // filterData
          "monthYear"  // Label format
        );
      }
    },

    pol: {
      displayName: "Threshold",
      type: "choice",
      options: s2building,
      selectedOption: s2building[2] || {lbl: "0.4", val: "0.4"}
    }
  },

  layerFactoryParams: {
    urlTemplate: "https://vedas.sac.gov.in/ridamserver3/wms",
    projection: "EPSG4326",
    layerParams: {
      name: "RDSGrdient",
      layers: "T0S1M0",
      PROJECTION: "EPSG4326",
      ARGS: "mergemethod=max;datasetid=T6S1P15;fromtime={{fromDate}};totime={{toDate}};threshold={{threshold}}",
      STYLES: "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFA500FF:40:FF4500FF:50:DC143CFF:60:DC143CFF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
      LEGENDOPTIONS: "columnHeight:400;height:100"
    }
  },

  layer: null,
  zIndex: 0,
  tools: []
},


function replaceUrlAndParamPlaceholders(str, replacements) {
  if (typeof str !== 'string') return str;
  // ✅ FIXED REGEX: Match {{key}} pattern correctly
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return replacements[key] !== undefined ? replacements[key] : match;
  });
}


// Inside formatDates function, add this condition:
else if (dateLabelFormat === "monthYear") {
  const monthNames = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
  label = `${monthNames[parseInt(month) - 1]}${year}`;
}




