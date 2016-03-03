from ASCIIVoxelGrid import ASCIIVoxelGrid
import sys, os, re, gdal, gdalconst, ogr, osr, numpy, psycopg2

VOXEL_DIR = '/var/data/geodata/geotop/voxels/'
RASTER_DIR = '/var/data/geodata/geotop/rasters/'
NODATA_VALUE = -1.0
GDAL_DATATYPE = gdalconst.GDT_Float32
GDAL_OPTIONS = ["COMPRESS=LZW"]

kaartbladen = []
voxelGrid = None
rasters = {}
progress = -1
cur = None

def raster_array(z):
    global voxelGrid

    if rasters.has_key(z):
        return rasters[z]
        
    ncols = voxelGrid.meta['nx']
    nrows = voxelGrid.meta['ny']
    nbands = len(voxelGrid.meta['column_types'])
    rasters[z] = numpy.ndarray(shape=(nrows, ncols, nbands), dtype=numpy.float32)
    rasters[z].fill(NODATA_VALUE)
    return rasters[z]
    
def make_rasters():
    global voxelGrid
    driver = gdal.GetDriverByName('GTiff')
    print "Making rasters...",
    sys.stdout.flush()
    z_values = sorted(rasters.keys())
    for z in z_values:
        filename = RASTER_DIR + voxelGrid.name + ("_%.2f.tiff" % z)
        ncols = voxelGrid.meta['nx']
        nrows = voxelGrid.meta['ny']
        nbands = len(voxelGrid.meta['column_types'])
        xllcorner = voxelGrid.meta['xllcorner']
        yllcorner = voxelGrid.meta['yllcorner']
        cellsize = voxelGrid.meta['dx']
        yulcorner = yllcorner + nrows * cellsize

        ds = driver.Create(filename, ncols, nrows, nbands, GDAL_DATATYPE, options=GDAL_OPTIONS)
        ds.SetGeoTransform( [ xllcorner, cellsize, 0, yulcorner, 0, -cellsize ] )
        srs = osr.SpatialReference()
        srs.ImportFromEPSG(28992)
        ds.SetProjection(srs.ExportToWkt())
    
        rastarray = rasters[z]
        for band in range(nbands):
            band_array = rastarray[:,:,band]
            reversed_arr = band_array[::-1]
            ds.GetRasterBand(band+1).SetNoDataValue(NODATA_VALUE)
            ds.GetRasterBand(band+1).WriteArray(reversed_arr)
            
        ds = None
        tiff = open(filename, 'rb').read()
        cur.execute("INSERT INTO geotop.rasters (rast, kaartblad, z) values (ST_FromGDALRaster(%s, 28992), %s, %s)", 
                    (psycopg2.Binary(tiff), voxelGrid.name, z))
            
    print "done."
    sys.stdout.flush()
    
def set_voxel(voxelGrid, x, y, z, col, row, values):
    global progress
    
    rastarray = raster_array(z)
    for band in range(len(voxelGrid.meta['column_types'])):
        rastarray[row, col, band] = values[band]

    if voxelGrid.progress > progress:
        progress = voxelGrid.progress
        print ("\rConverting %s: " % voxelGrid.name) + str(progress) + "%",
        sys.stdout.flush()


try:
    conn = psycopg2.connect("dbname='research' user='postgres' password=''")
except:
    print "Unable to connect to the database"
    exit()

cur = conn.cursor()
        
p = re.compile("voxels_(\w+)\.csv")
for file in os.listdir(VOXEL_DIR):
    m = p.search(file)
    if m:
        kaartbladen.append(m.group(1))
        
for kaartblad in kaartbladen:
    progress = -1
    file = "%s/voxels_%s.csv" % (VOXEL_DIR, kaartblad)
    voxelGrid = ASCIIVoxelGrid(kaartblad, file)
    voxelGrid.ParseData(set_voxel)
    print "\rConverting %s: " % voxelGrid.name + "100%"
    make_rasters()
    conn.commit()
    rasters = None
    rasters = {}
    voxelGrid = None
    
conn.close()
