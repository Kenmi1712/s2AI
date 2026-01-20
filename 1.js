/**
 * Generate monthly options from available dates
 */
async function getAvlMonths(url, datasetId, splitDateAt) {
  try {
    const response = await fetch(url + datasetId);
    const data = await response.json();
    
    // Group dates by year-month
    const monthGroups = {};
    
    data.forEach(timestamp => {
      const dateStr = timestamp.split('T')[0];
      const yearMonth = dateStr.substring(0, 7); // YYYY-MM
      
      if (!monthGroups[yearMonth]) {
        monthGroups[yearMonth] = [];
      }
      monthGroups[yearMonth].push(dateStr.replace(/-/g, ''));
    });
    
    // Convert to month options
    const monthOptions = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    Object.keys(monthGroups).sort().reverse().forEach(yearMonth => {
      const dates = monthGroups[yearMonth].sort();
      const [year, month] = yearMonth.split('-');
      const monthName = monthNames[parseInt(month) - 1];
      
      monthOptions.push({
        lbl: `${monthName} ${year}`,
        val: yearMonth,
        fromDate: dates[0],
        toDate: dates[dates.length - 1]
      });
    });
    
    return monthOptions;
  } catch (error) {
    console.error('Error fetching monthly dates:', error);
    return [];
  }
}

function uiToFactoryParamsConvertorMonthly(params) {
  let replaceDictionary = {};
  const selectedMonth = params.toDate.selectedOption;
  
  replaceDictionary['toDate'] = selectedMonth.toDate;
  replaceDictionary['fromDate'] = selectedMonth.fromDate;
  replaceDictionary['pol'] = params.pol.selectedOption.val;
  
  return replaceDictionary;
}

export { getAvlMonths, uiToFactoryParamsConvertorMonthly };




import {
  getAvlMonths,
  uiToFactoryParamsConvertorMonthly
} from './utils.js';


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
      optionGenerator: async function (url, datasetId, splitDateAt) {
        return await getAvlMonths(url, datasetId, splitDateAt);
      },
    },

    pol: {
      displayName: "Threshold",
      type: "choice",
      options: s2_building,
      selectedOption: s2_building[2],
      displayNameStyle: { color: "black" },
    },
  },
  
  uiToFactoryParamsConvertor: uiToFactoryParamsConvertorMonthly,
  
  dateURL: "https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=",
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
        STYLES: "[0:FFFFFF00:10:FFFFFF00:20:FFA500FF:30:FF4500FF:40:DC143CFF:50:DC143CFF:60:8B0000FF:70:8B0000FF:80:8B0000FF];nodata:FFFFFF00",
      },
      // ... (copy all other threshold configurations 0.3 to 0.8)
      LEGEND_OPTIONS: "columnHeight:400;height:100",
    },
    layer: "",
    zIndex: 0,
    extent: [69, 20, 72, 25],
  },
},
