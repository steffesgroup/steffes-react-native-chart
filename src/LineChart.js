import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  PanResponder,
  Dimensions
} from 'react-native';

import Svg, {
  Circle,
  Ellipse,
  G,
  Text as SText,
  TSpan,
  TextPath,
  Path,
  Polygon,
  Polyline,
  Line,
  Rect,
  Use,
  Image,
  Symbol,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  ClipPath,
  Pattern,
  Mask,
} from 'react-native-svg';

class LineChart extends Component {
  constructor(props){
    super(props);

    this.state = {
      showLine: false,
      currentIndex: -1,
      points: [],
      maxValue: Number.MIN_VALUE,
      maxValueIndex: -1
    }

    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        // The gesture has started. Show visual feedback so the user knows
        // what is happening!
        // gestureState.d{x,y} will be set to zero now
        let {height, width} = Dimensions.get('window');

        let position = Math.min(Math.round(gestureState.x0 / width * this.props.intervalStep) * (100 / this.props.intervalStep), 100) + '%';

        this.currentX = position;

        let index = Math.round(gestureState.x0 / width * this.props.intervalStep);

        this.setState({
          showLine: true,
          moving: true,
          currentIndex: index
        })
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
        let {height, width} = Dimensions.get('window');

        let position = Math.min(Math.round(gestureState.moveX / width * this.props.intervalStep) * (100 / this.props.intervalStep), 100) + '%';

        this.currentX = position;

        let index = Math.round(gestureState.moveX / width * this.props.intervalStep);

        this.setState({
          moving: true,
          currentIndex: index
        })
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded
        this.setState({
          showLine: false,
          currentIndex: -1
        })
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
        this.setState({
          showLine: false,
          currentIndex: -1
        })
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      },
    });

    this.currentX = 0;
  }

  renderLine = () => {
    return (
      <Polyline
        points={this.state.points}
        fill="none"
        stroke={this.props.style.chartColor}
        strokeWidth={this.props.style.chartStroke}
      />
    )
  }

  renderTableLine = (index, value) => {
    let {height, width} = Dimensions.get('window');
    const {backgroundStyle, chartHeight, intervalStep, backgroundLines} = this.props;

    let step = 100 / backgroundLines;

    let y = 0 + ((index + 1) * step);

    //Multiplying by .8 because we only use 80% of the chart height
    //Possibly need to increment the step i.e (20 - step)
    y = y * .8 + 12;

    let textY = y - 1  + '%';

    let key = `container-${index}`;

    return (
      <React.Fragment key={key}>
      <Line
        x1={0}
        y1={y + '%'}
        x2={width}
        y2={y + '%'}
        stroke={backgroundStyle.lineColor}
        strokeWidth={backgroundStyle.lineStroke}
      />
      <SText
        fill={backgroundStyle.labelColor}
        fontSize={backgroundStyle.labelFontSize}
        x='10'
        y={textY}
        textAnchor='start'
      >
        {value}
      </SText>
      </React.Fragment>
    )
  }

  renderLines = () => {
    const {maxValue} = this.state;
    const {backgroundLines} = this.props;

    const renderArray = [];

    let increment = maxValue / (backgroundLines);

    for(let i = 0; i < backgroundLines + 1; i++){

      let value = Math.round(maxValue - (increment * i));
      value = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      renderArray.push(this.renderTableLine(i, value));
    }

    return renderArray;
  }

  mapPoints = () => {
    let {height, width} = Dimensions.get('window');

    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    let maxIndex = -1;

    const {data, intervalStep, chartHeight} = this.props;

    data.map((item, index) => {
      if(item.value > max){
        max = item.value;
        maxIndex = index;
      }

      if(item.value < min){
        min = item.value;
      }
    })

    let newData = data.map((item, index) => {
      let value = item.value / max * (chartHeight * .80);
      value = chartHeight - value;
      let combinedValue = ((width / intervalStep) * index) + ',' + (value);
      return combinedValue;
    })

    this.setState({
      points: newData,
      maxValue: max,
      maxValueIndex: maxIndex
    })
  }

  calculateTextX = (label) => {
    let {height, width} = Dimensions.get('window');
    const {currentIndex} = this.state;
    const {intervalStep, style} = this.props;

    let xValue = width / intervalStep * currentIndex;

    if(xValue == 0 || xValue < 50){
      return label.length * (style.labelFontSize * .35)
    }

    if(xValue == width || xValue > width - 50){
      return width - label.length * (style.labelFontSize * .35);
    }

    return xValue;
  }

  componentDidMount(){
    this.mapPoints();
  }

  render(){
    let {height, width} = Dimensions.get('window');
    const {
      chartHeight,
      data,
      labelFontSize,
      style,
      containerStyle,
      valueLabel,
      valueDenote,
      maxValueDenote
    } = this.props;
    const {showLine, points, currentIndex, maxValueIndex} = this.state;
    return(
      <View style={[styles.parent, {marginTop: containerStyle.marginTop, marginBottom: containerStyle.marginBottom}]}>
        <View style={styles.header}>
          {
            showLine && data.length > 0 &&
            <Text style={[{color: style.valueColor, fontSize: style.valueFontSize, fontWeight: style.valueFontWeight}]}>{valueDenote}{String(data[currentIndex].value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {valueLabel}</Text>
          }
          {
            maxValueIndex > -1 && !showLine &&
            <Text style={[{color: style.valueColor, fontSize: style.valueFontSize, fontWeight: style.valueFontWeight}]}>{maxValueDenote} {valueLabel} {valueDenote}{String(data[maxValueIndex].value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
          }
        </View>
        <View style={[styles.chart], {height: chartHeight}} {...this._panResponder.panHandlers}>
          <Svg height="100%" width="100%">
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={style.backgroundColor}
            />
            <Line
              x1='0%'
              y1="100%"
              x2='100%'
              y2="100%"
              stroke={style.lineColor}
              strokeWidth={style.lineStroke}
            />
            {
              showLine && data.length > 0 &&
              <>
                <SText
                  fill={style.labelColor}
                  fontSize={style.labelFontSize}
                  fontWeight={style.labelFontWeight}
                  x={this.calculateTextX(data[currentIndex].label)}
                  y='10%'
                  textAnchor='middle'
                >
                  {data[currentIndex].label}
                </SText>
                <Line
                  x1={this.currentX}
                  y1="15%"
                  x2={this.currentX}
                  y2="100%"
                  stroke={style.lineColor}
                  strokeWidth={style.lineStroke}
                />
              </>
            }
            {
              points.length > 0 &&
              <>
                <this.renderLine/>
                <this.renderLines/>
              </>
            }
          </Svg>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  parent: {
    flexDirection: 'column'
  },
  header:{
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  chart: {
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex'
  }
});

LineChart.propTypes = {
  chartHeight: PropTypes.number,
  backgroundLines: PropTypes.number,
  intervalStep: PropTypes.number.isRequired,
  valueLabel: PropTypes.string,
  valueDenote: PropTypes.string,
  maxValueDenote: PropTypes.string,
  style: PropTypes.shape({
    labelFontSize: PropTypes.number,
    lineStroke: PropTypes.number,
    chartStroke: PropTypes.number,
    valueFontSize: PropTypes.number,
    valueFontWeight: PropTypes.string,
    backgroundColor: PropTypes.string,
    lineColor: PropTypes.string,
    labelColor: PropTypes.string,
    labelFontWeight: PropTypes.string,
    chartColor: PropTypes.string,
    valueColor: PropTypes.string,
  }),
  backgroundStyle: PropTypes.shape({
    labelFontSize: PropTypes.number,
    lineStroke: PropTypes.number,
    lineColor: PropTypes.string,
    labelColor: PropTypes.string,
  }),
  containerStyle: PropTypes.shape({
    marginTop: PropTypes.number,
    marginBottom: PropTypes.number
  }),
  data: PropTypes.array.isRequired,
}

LineChart.defaultProps = {
  chartHeight: 200,
  backgroundLines: 10,
  intervalStep: 13,
  valueLabel: '',
  valueDenote: '',
  maxValueDenote: '',
  style: {
    labelFontSize: 20,
    lineStroke: 2,
    chartStroke: 2,
    valueFontSize: 20,
    valueFontWeight: 'bold',
    backgroundColor: 'white',
    lineColor: 'gray',
    labelColor: 'gray',
    labelFontWeight: 'bold',
    chartColor: 'gray',
    valueColor: 'gray',
  },
  backgroundStyle: {
    labelFontSize: 10,
    lineStroke: .25,
    lineColor: 'gray',
    labelColor: 'gray'
  },
  containerStyle: {
    marginTop: 50,
    marginBottom: 0
  },
  data: [
    {label: 'Monday', value: 10},
    {label: 'Tuesday', value: 10},
    {label: 'Wednesday', value: 30},
    {label: 'Thursday', value: 40},
    {label: 'Friday', value: 70},
    {label: 'Saturday', value: 90},
    {label: 'Sunday', value: 100},
    {label: 'Monday', value: 10},
    {label: 'Tuesday', value: 10},
    {label: 'Wednesday', value: 30},
    {label: 'Thursday', value: 40},
    {label: 'Friday', value: 70},
    {label: 'Saturday', value: 90},
    {label: 'Sunday', value: 100},
  ]
}

export default LineChart;
