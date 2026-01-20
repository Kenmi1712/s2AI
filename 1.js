// ADD THESE TWO NEW FUNCTIONS AT THE END OF dateConfig.js

export async function getAvlMonths(url, datasetId, splitDateAt) {
  try {
    const response = await fetch(url + datasetId);
    const data = await response.json();
    
    // Extract timestamps from the response
    const timestamps = data.result[datasetId];
    
    const monthGroups = {};
    
    timestamps.forEach(timestamp => {
      // timestamp format: "YYYYMMDD HH:MM:SS+0530"
      const dateStr = timestamp.substring(0, 8); // Get YYYYMMDD
      const yearMonth = dateStr.substring(0, 6); // Get YYYYMM
      
      if (!monthGroups[yearMonth]) {
        monthGroups[yearMonth] = [];
      }
      monthGroups[yearMonth].push(dateStr); // Store as YYYYMMDD
    });
    
    const monthOptions = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Sort by year-month in descending order (most recent first)
    Object.keys(monthGroups).sort().reverse().forEach(yearMonth => {
      const dates = monthGroups[yearMonth].sort();
      const year = yearMonth.substring(0, 4);
      const month = yearMonth.substring(4, 6);
      const monthName = monthNames[parseInt(month) - 1];
      
      // Get first and last date of the month from available dates
      const fromDate = dates[0];
      const toDate = dates[dates.length - 1];
      
      monthOptions.push({
        lbl: `${monthName} ${year}`,  // Display: "January 2026"
        val: yearMonth,                // Store: "202601"
        fromDate: fromDate,            // YYYYMMDD format
        toDate: toDate                 // YYYYMMDD format
      });
    });
    
    return monthOptions;
  } catch (error) {
    console.error('Error fetching monthly dates:', error);
    return [];
  }
}

export function uiToFactoryParamsConvertorMonthly(params) {
  let replaceDictionary = {};
  const selectedMonth = params.toDate.selectedOption;
  
  replaceDictionary['toDate'] = selectedMonth.toDate;
  replaceDictionary['fromDate'] = selectedMonth.fromDate;
  replaceDictionary['pol'] = params.pol.selectedOption.val;
  
  return replaceDictionary;
}


import { referenceLayers } from "./referenceLayers.js";
import {
  deepCopyObj,
  getInsatAvlDates,
  uiToFactoryParamsConvertor,
  uiToFactoryParamsConvertorInsat,
  getLegacyAvlDates,
  getAsyncData,
  getAvlDates,
  getAvlSeasonDates,
  getAvlMonths,                         // ADD THIS
  uiToFactoryParamsConvertorMonthly     // ADD THIS
} from './dateConfig.js';
import { get_geoentity_param_values } from "./gs-client-0.3.js";
import {
  getRidamAvlTimestamp,
} from "./dateConfig.js";

S2_AI_Building_Probability_Monthly: {
  id: "S2_AI_Building_Probability_Monthly",
  displayName: "S2 AI Building Probability (Monthly)",
  isShow: true,
  type: "tile",
  isDifference: true,
  autoActivateTool: true,

  parameters: {
    toDate: {
      displayName: "Month",
      type: "choice",
      typeOfData: "month",
      options: [],
      isShowPrevYearOption: false,
      selectedOption: "",
      optionGenerator: async function (
        url,
        datasetId,
        splitDateAt,
        addNumberOfdaysInLabel
      ) {
        return await getAvlMonths(
          url,
          datasetId,
          splitDateAt
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
  
  uiToFactoryParamsConvertor: uiToFactoryParamsConvertorMonthly,
  
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
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P15;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:10:FFFFFF00:20:FFA500FF:30:FF4500FF:40:DC143CFF:50:DC143CFF:60:8B0000FF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
      },
      0.3: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P15;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFA500FF:40:FF4500FF:50:DC143CFF:60:DC143CFF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
      },
      0.4: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P15;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFA500FF:50:FF4500FF:60:DC143CFF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
      },
      0.5: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P15;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFA500FF:60:FF4500FF:70:DC143CFF:80:8B0000FF:90:8B0000FF];nodata:FFFFFF00",
      },
      0.6: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P15;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFFFFF00:60:FFA500FF:70:FF4500FF:80:DC143CFF:90:8B0000FF];nodata:FFFFFF00",
      },
      0.7: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P15;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
        STYLES:
          "[0:FFFFFF00:10:FFFFFF00:20:FFFFFF00:30:FFFFFF00:40:FFFFFF00:50:FFFFFF00:60:FFFFFF00:70:FFA500FF:80:DC143CFF:90:8B0000FF];nodata:FFFFFF00",
      },
      0.8: {
        name: "RDSGrdient",
        layers: "T0S0M0",
        PROJECTION: "EPSG:4326",
        ARGS: "dataset_id:T6S1P15;from_time:{{{fromDate}}};to_time:{{{toDate}}};indexes:1",
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
