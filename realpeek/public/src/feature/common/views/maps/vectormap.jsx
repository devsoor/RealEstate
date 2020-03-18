// react plugin for creating vector maps
import React from 'react';
import { VectorMap } from 'react-jvectormap';
import './vectormap.css';
import {
  Card,
  CardBody
} from 'reactstrap';
const mapData = {
  'AU': 360,
  'FR': 540,
  'GB': 690,
  'GE': 200,
  'IN': 400,
  'RO': 600,
  'RU': 300,
  'US': 2920
};
class Vectormap extends React.Component {
  render() {
    return <div>
      <h5 className="mb-4">Vectormap Page</h5>
      <Card>
        <CardBody>
          <h5 className="mb-4">World Map</h5>
          <VectorMap
            map={'world_mill'}
            backgroundColor="transparent"
            zoomOnScroll={false}
            containerStyle={{
              'height': '450px',
              'width': '100%'
            }}
            containerClassName="map"
            regionStyle={{
              'initial': {
                'fill': '#d5e4e4',
                'fill-opacity': 0.9,
                'stroke': '1',
                'stroke-opacity': 0.5,
                'stroke-width': 1
              }
            }}
            series={{
              'regions': [
                {
                  'scale': [
                    '#2e66ff',
                    '#2962ff'
                  ],
                  'values': mapData
                }
              ]
            }}
          />
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <h5 className="mb-4">USA Map</h5>

          <VectorMap map={'us_aea'}
            backgroundColor="transparent"
            ref={c => {
              this.map = c;
            }}
            containerStyle={{
              'height': '300px',
              'width': '100%'
            }}
            regionStyle={{
              'initial': {
                'fill': '#b8e9f1',
                'fill-opacity': 0.9,
                'stroke': '1',
                'stroke-opacity': 0.5,
                'stroke-width': 1
              }
            }}
            containerClassName="map"
          />

        </CardBody>
      </Card>
    </div>;
  }
}

export default Vectormap;
