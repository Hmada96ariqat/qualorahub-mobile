// Jest setup file for shared test bootstrap hooks.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
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

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  function MockDateTimePicker(props: {
    onChange?: (event: { type: 'set'; nativeEvent: { timestamp: number; utcOffset: number } }, date?: Date) => void;
    testID?: string;
    value: Date;
  }) {
    return React.createElement(
      View,
      { testID: props.testID ?? 'mock-date-time-picker' },
      React.createElement(
        Pressable,
        {
          testID: props.testID ? `${props.testID}.set-date` : 'mock-date-time-picker.set-date',
          onPress: () =>
            props.onChange?.(
              {
                type: 'set',
                nativeEvent: {
                  timestamp: new Date(2026, 2, 5).getTime(),
                  utcOffset: 0,
                },
              },
              new Date(2026, 2, 5),
            ),
        },
        React.createElement(Text, null, 'Set mock date'),
      ),
    );
  }

  return {
    __esModule: true,
    default: MockDateTimePicker,
    DateTimePickerAndroid: {
      open: jest.fn(),
    },
  };
});
