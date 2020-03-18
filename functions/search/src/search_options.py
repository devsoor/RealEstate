import datetime
mpStyleNameDir = {
		1:'Single Family Residence',
		2:'Town House',
		3:'Condo',
		7:'Multi-Family',
		# 4:'Manufactured Home',
		# 5:'Mobile Home Park',
		#6:'Farm & Ranch',
		# 8:'Apartments',
		# 9:'Floating Home',
		10:'Co-Op',
		# 11:'Commercial',
		# 12:'Recreational'
        # 13:'Land'
}

class SearchOptions:
    def __init__(self):
        self.prices = self.generate_prices()
        self.styles = self.generate_styles()
        self.built_after = self.generate_years()
        self.sqft = self.generate_sqft()
        self.lot_size = self.generate_lot_sizes()
        self.hoa = self.generate_hoas()
        
    def generate_prices(self):
        prices = list(range(50, 425, 25)) + list(range(450, 1000, 50))
        p = [{'name': '${p}k'.format(p=price), 'value':price*1000} for price in prices]
        return p
    
    def generate_styles(self):
        s = [{'name': v, 'value': k} for k, v in mpStyleNameDir.items()]
        return s
    
    def generate_years(self):
        c_year = int(datetime.datetime.now().year)
        # for recent dates provide every year, then every 5 years, then every 10 years
        years = list(range(c_year, 2009, -1)) + list(range(2005, 1995, -5)) + list(range(1990, 1900, -10))
        return years
    
    def generate_sqft(self):
        sqft_range = list(range(500, 3000, 250)) + list(range(3000, 10000, 500)) 
        sqft = [{'name': '{s} sqft'.format(s=s), 'value': s} for s in sqft_range]
        return sqft
    
    def generate_lot_sizes(self):
        sqft_range = [1000] + list(range(2000, 12000, 2000)) 
        acre_range = [.25, .5, 1, 2] + list(range(5, 30, 5)) + [50, 75, 100]
        sqft = [{'name': '{s} sqft'.format(s=s), 'value': s} for s in sqft_range]

        # we want to display acres, but the value still needs to be in sqft - so convert acre value to sqft
        acre = [{'name': '{s} Acres'.format(s=s), 'value': s*43560} for s in acre_range]
        return sqft + acre
    
    def generate_hoas(self):
        hoas = list(range(100, 1100, 100))+ [1500]
        p = [{'name': '${p} /mo'.format(p=hoa), 'value':hoa} for hoa in hoas]
        return p
