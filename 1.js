s2AIBuildingMonthlyMax: {
  id: "s2AIBuildingMonthlyMax",
  displayName: "S2 AI Building Monthly Max",
  isShow: true,
  type: "tile",
  autoActivateTool: false,
  
  dateURL: "https://vedas.sac.gov.in/ridamserver3/metadata?settimestamp?prefix",
  datasetId: "T6S1P15",
  splitDateAt: 2,
  
  // ✅ SELF-CONTAINED custom convertor - doesn't use global uiToFactoryParamsConvertor
  uiToFactoryParamsConvertor: function(parameters) {
    let dict = {};
    
    // Handle month date
    if (parameters.month && parameters.month.selectedOption && parameters.month.selectedOption.val) {
      let monthVal = parameters.month.selectedOption.val;
      let year = monthVal.substring(0, 4);
      let month = monthVal.substring(4, 6);
      
      dict.fromDate = year + month + '01';
      let lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      dict.toDate = year + month + String(lastDay).padStart(2, '0');
    } else {
      dict.fromDate = '20260101';
      dict.toDate = '20260131';
    }
    
    // Handle threshold
    if (parameters.pol && parameters.pol.selectedOption && parameters.pol.selectedOption.val) {
      dict.threshold = parameters.pol.selectedOption.val;
    } else {
      dict.threshold = '0.4';
    }
    
    console.log('Monthly Building Dict:', dict);
    return dict;
  },

  legendUrl: "https://vedas.sac.gov.in/ridamserverwms?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&TRANSPARENT=true&STYLES=Buildings910D09FF&LEGENDOPTIONS=columnHeight:500;height:40;width:300",

  parameters: {
    month: {
      displayName: "Month",
      type: "choice",
      typeOfData: "date",
      options: [],
      selectedOption: {lbl: "January2026", val: "20260115"},  // ✅ Default value to prevent undefined
      isShowPrevYearOption: true,
      optionGenerator: async function (url, datasetId, splitDateAt) {
        try {
          return await getAvlDates(
            url, 
            datasetId, 
            splitDateAt, 
            null,
            {"15": [{fromDt: "01", toDt: "31", valToPush: "15"}]},
            null,
            null,
            "monthYear"
          );
        } catch(e) {
          console.error('Month options error:', e);
          return [{lbl: "January2026", val: "20260115"}];
        }
      }
    },

    pol: {
      displayName: "Threshold",
      type: "choice",
      options: s2building,
      selectedOption: s2building[2]
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
      STYLES: "0.00E0EFFFF0.1254040FFFF0.2540A8FFFF0.37540FFFFFF0.5A8FFA8FF0.625FFFF40FF0.75FFA800FF0.875FF4000FF1.0FF0000FFnodataFFFFFFFF"
    }
  },

  layer: null,
  zIndex: 0,
  tools: []
},




let label;
if (dateLabelFormat === "AY") {
  if (parseInt(month) >= 6) {
    label = "AY " + (parseInt(year) + 1);
  } else {
    label = "AY " + parseInt(year) + "-" + (parseInt(year) + 1);
  }
} 
// ✅ ADD ONLY THIS NEW BLOCK - Nothing else changes
else if (dateLabelFormat === "monthYear") {
  const monthNames = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
  label = `${monthNames[parseInt(month) - 1]}${year}`;
}
// ✅ END OF NEW BLOCK
else if (updateDateLabel) {
  label = updateDateLabel;
} else {
  label = year + "-" + month + "-" + dt;
}
