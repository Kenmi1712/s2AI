function replaceUrlAndParamPlaceholders(obj, replacements) {
  if (typeof obj !== 'string') return obj;
  return obj.replace(/\{\{(\w+)\}\}/g, function(match, key) {
    return replacements[key] !== undefined ? replacements[key] : match;
  });
}



<!-- CHANGE FROM: -->
{{ layerConfig.parameters.month.params }}

<!-- TO: -->
{{ layerConfig.parameters.month?.selectedOption?.val }}




s2AIBuildingMonthlyMax: {
  id: "s2AIBuildingMonthlyMax",
  displayName: "S2 AI Building Monthly Max",
  isShow: true,
  type: "tile",
  
  dateURL: "https://vedas.sac.gov.in/ridamserver3/metadata?settimestamp?prefix",
  datasetId: "T6S1P15",
  splitDateAt: 2,
  
  uiToFactoryParamsConvertor: function(parameters) {
    let dict = {datasetId: 'T6S1P15'};
    
    if (parameters.month?.selectedOption?.val) {
      let monthVal = parameters.month.selectedOption.val;
      let year = monthVal.substring(0, 4);
      let month = monthVal.substring(4, 6);
      dict.fromDate = year + month + '01';
      let lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      dict.toDate = year + month + String(lastDay).padStart(2, '0');
    }
    
    dict.threshold = parameters.pol?.selectedOption?.val || 0.4;
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
      selectedOption: {},
      isShowPrevYearOption: true,
      optionGenerator: async function (url, datasetId, splitDateAt) {
        return await getAvlDates(url, datasetId, splitDateAt, null,
          {"15": [{fromDt: "01", toDt: "31", valToPush: "15"}]},
          null, null, "monthYear");
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
      ARGS: "mergemethod=max;datasetid={{datasetId}};fromtime={{fromDate}};totime={{toDate}};threshold={{threshold}}",
      STYLES: "0.00E0EFFFF0.1254040FFFF0.2540A8FFFF0.37540FFFFFF0.5A8FFA8FF0.625FFFF40FF0.75FFA800FF0.875FF4000FF1.0FF0000FFnodataFFFFFFFF"
    }
  },

  layer: null,
  zIndex: 0,
  tools: []
},
