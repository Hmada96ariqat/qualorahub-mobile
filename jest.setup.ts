// Jest setup file for shared test bootstrap hooks.
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockMapView = ({ children, ...props }: { children?: unknown }) =>
    React.createElement(View, props, children);
  const MockMarker = (props: Record<string, unknown>) => React.createElement(View, props);
  const MockPolygon = (props: Record<string, unknown>) => React.createElement(View, props);

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polygon: MockPolygon,
    PROVIDER_GOOGLE: 'google',
  };
});
