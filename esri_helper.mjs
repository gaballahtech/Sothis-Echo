/**
 * Returns the Esri World Imagery export URL for a given bbox in lon/lat.
 * bbox format: [west, south, east, north] decimal degrees.
 * Size 760×500 matches the CompareSlider frame aspect ratio.
 */
function esriOpticalURL(bbox) {
  const [w, s, e, n] = bbox;
  return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${w},${s},${e},${n}&bboxSR=4326&imageSR=4326&size=760,500&format=png&f=image`;
}
