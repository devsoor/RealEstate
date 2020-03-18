from distutils.core import setup

setup(name='realpeek_search',
      version='1.0',
      description='RealPeek Search Module',
      author='Paradigm Sift, Inc.',
      author_email='david@paradigmsift.com',
      packages=['realpeek_search', 'realpeek_search.cma', 'realpeek_search.assumptions'],
      package_dir={'realpeek_search': 'src'},
)