import sys
import os

class ASCIIVoxelGrid:
    def __init__(self, name, file):
        self.name = name
        self.file = file
        
        # ESRI ASCII Grid metadata
        self.meta = {}
        self.meta['nx'] = 0
        self.meta['ny'] = 0
        self.meta['nz'] = 0
        self.meta['dx'] = 1.0
        self.meta['dy'] = 1.0
        self.meta['dz'] = 1.0
        self.meta['xllcenter'] = 0
        self.meta['yllcenter'] = 0
        self.meta['zllcenter'] = 0
        self.meta['xllcorner'] = 0
        self.meta['yllcorner'] = 0
        self.meta['zllcorner'] = 0
        self.meta['nodata_value'] = -9999.000000
        self.meta['column_names'] = []
        self.meta['column_types'] = []
        self.progress = 0
        self.ReadMetaData()

    def ReadMetaData (self):
        llcorner = False
        with open(self.file) as f:
            for i in range(14):
                line = f.readline().rstrip('\n')
                if i == 12:
                    names = line.split(',')
                    if len(names) < 9:
                        raise ValueError(self.file + ".csv contains fewer than 9 column names, aborting")
                    self.meta['column_names'] = names[0:9]
                    continue
                elif i == 13:
                    types = line.split(',')
                    if len(types) < 9:
                        raise ValueError(self.file + ".csv contains fewer than 9 column types, aborting")
                    self.meta['column_types'] = types[0:9]
                    continue
                    
                splitlist = line.split()
                if len(splitlist) != 2: continue
                (key, val) = splitlist
                key = key.lower()
                if key in ('nx', 'ny', 'nz'):
                    self.meta[key] = int(val)
                if key in ('dx', 'dy', 'dz', 'nodata_value', 'xllcenter', 'yllcenter', 'zllcenter', 'xllcorner', 'yllcorner', 'zllcorner'):
                    self.meta[key] = float(val)
                    if key in ('xllcorner', 'yllcorner', 'zllcorner'):
                        llcorner = True
            if llcorner: # Compute llcenter of voxel grid
                self.meta['xllcenter'] = self.meta['xllcorner'] + (self.meta['dx'] / 2)
                self.meta['yllcenter'] = self.meta['yllcorner'] + (self.meta['dy'] / 2)
                self.meta['zllcenter'] = self.meta['zllcorner'] + (self.meta['dz'] / 2)
            else:
                self.meta['xllcorner'] = self.meta['xllcenter'] - (self.meta['dx'] / 2)
                self.meta['yllcorner'] = self.meta['yllcenter'] - (self.meta['dy'] / 2)
                self.meta['zllcorner'] = self.meta['zllcenter'] - (self.meta['dz'] / 2)

    def ParseData (self, func):
        with open(self.file) as f:
            for i in range(14):
                f.readline() # throw away header lines
            for col in range(self.meta['nx']):
                x = self.meta['xllcenter'] + col * self.meta['dx']
                for row in range(self.meta['ny']):
                    y = self.meta['yllcenter'] + row * self.meta['dy']
                    for z_index in range(self.meta['nz']):
                        z = self.meta['zllcenter'] + z_index * self.meta['dz']
                        
                        line = f.readline()
                        if line == '':
                            print "Unexpected end of file"
                            return
                        
                        line = line.rstrip('\n')
                        values = line.split(',')[0:9]
                        if float(values[0]) == self.meta['nodata_value']: continue
                        for i in range(len(values)):
                            if self.meta['column_types'][i] == 'int':
                                values[i] = int(values[i])
                            else:
                                values[i] = float(values[i])
                        
                        func(self, x, y, z, col, row, values)

                self.progress = int(round(float(col+1) / float(self.meta['nx']) * 100))    
                #if self.progress > 15: return

if __name__ == '__main__': 
    print 'not to be run as standalone'