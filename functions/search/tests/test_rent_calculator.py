import unittest
import sys
sys.path.append('src')
sys.path.append('vendor')
from cma.rent_calculator import Rentometer
from cma.rent_realty_mole import RealtyMole

class TestRentometer(unittest.TestCase):
    def test_rent(self):
        r = Rentometer()
        result = r.get_rent_estimate(zipcode=98021, bedrooms=5)
        print(result)

class TestRealtyMole(unittest.TestCase):
    def test_rent(self):
        r = RealtyMole()
        result = r.get_rent_estimate('21810 42nd Ave SE Bothell, WA', 4, 3, 2400, 'Single Family', 90, 5)
        print(result['price'])
        result = r.get_rent_estimate('1003 156th Ave NE Belleve, WA', 2, 2, 950, 'Condo', 30, 5, force=True)
        print(result['price'])

if __name__ == '__main__':
    unittest.main()
