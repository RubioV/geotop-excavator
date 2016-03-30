<?php

$geomJSON = $_REQUEST['geom'];
$upperZ = $_REQUEST['upperZ'];
$lowerZ = $_REQUEST['lowerZ'];

header('Content-type: application/json');
$conn = pg_pconnect("host=titania dbname=research user=postgres");
if (!$conn) {
  echo "Unable to connect to the database\n";
  exit;
}
$query = '
WITH input_shape AS (
 SELECT ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1), 3857), 28992) geom
),
input_area AS (
 SELECT ST_Area(geom) total_area FROM input_shape
),
refraster AS (
 -- Reference raster
 SELECT rast FROM geotop.rasters LIMIT 1
),
shape_outline_rast AS (
 -- Create raster of all cells which touch or are inside nzlijn polygon
 SELECT ST_AsRaster(geom, rast, \'8BUI\', 1, -1, true) rast FROM input_shape, refraster
),
shape_outline_pixels AS (
 -- Convert above raster to polygon
 SELECT ST_Polygon(rast) geom 
 FROM shape_outline_rast
),
pixels AS (
 -- Make geometries of all pixels
 SELECT (ST_PixelAsPolygons(rast)).*
 FROM shape_outline_rast
),
pixels_intersect AS (
 -- Determine intersections of all pixel geometries with the input shape
 SELECT ST_Intersection(pix.geom, pol.geom) geom, pix.x, pix.y
 FROM pixels pix, input_shape pol
),
geotop_raster AS (
 -- Make Geotop raster of all pixels which touch or are inside nzlijn polygon
 SELECT ST_Union(ST_Clip(rast, ST_SetSRID(a.geom, 28992))) rast, z
 FROM geotop.rasters, shape_outline_pixels a, input_shape b
 WHERE ST_Intersects(rast, b.geom) AND z BETWEEN $3 AND $2
 GROUP BY z
),
geotop_values AS (
 SELECT (ST_DumpValues(rast)).*, z
 FROM geotop_raster
),
geotop_vol_prob AS (
 -- calculate probability for all lithoclasses except 0 (antropogeen)
 SELECT z, (CASE WHEN nband < 6 THEN nband - 2 ELSE nband - 1 END) lithoklasse,
        0 volume, valarray[p.y][p.x] * ST_Area(geom) probability
 FROM pixels_intersect p, geotop_values v
 WHERE nband > 2 AND valarray[p.y][p.x] > 0
 UNION ALL
 -- if band 2 = 0 (antropogeen) probability is 1.0 * area
 SELECT z, 0 lithoklasse, 0 volume, 1.0 * ST_Area(geom) probability
 FROM pixels_intersect p, geotop_values v
 WHERE nband = 2 AND valarray[p.y][p.x] = 0
 UNION ALL
 -- calculate volumes for all lithoclasses
 SELECT z, valarray[p.y][p.x] lithoklasse, ST_Area(geom) * 0.5 volume, 0 probability
 FROM pixels_intersect p, geotop_values v
 WHERE nband = 2 AND valarray[p.y][p.x] IS NOT NULL
)

SELECT z, lithoklasse, SUM(volume) volume, SUM(probability) / total_area probability
FROM geotop_vol_prob, input_area
GROUP BY z, lithoklasse, total_area 
ORDER BY z DESC, lithoklasse ASC;
';

$result = pg_query_params($conn, $query, array($geomJSON, $upperZ, $lowerZ));
if (!$result) {
  echo "Error executing database query: " . pg_last_error() . "\n";
  exit;
}

$res_string = "";
while ($row = pg_fetch_row($result)) {
	if($res_string)
		$res_string .= ',';
	$res_string .= '[' . implode(',',$row) . ']';
}
if($res_string)
	$res_string = '[' . $res_string . ']';
ob_start("ob_gzhandler");
echo $res_string;
ob_end_flush();

?>
