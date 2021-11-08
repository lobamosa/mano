/* eslint-disable max-len */
import React from 'react';
import styled from 'styled-components';

const SvgStyled = styled.svg`
  color: rgb(255, 255, 255);
  position: absolute;
  top: -0.2em;
  left: -0.2em;
`;

const PieChart = ({ color = 'rgb(255, 255, 255)', size = 15 }) => (
  <SvgStyled width={size} height={size} viewBox="0 0 489.902 489.902">
    <path
      d="M349.2 178.251l113.6-45.9c-37.7-72.7-110.1-124-195.6-131.8v122.5c34.6 6.6 63.7 26.8 82 55.2zM121.3 244.751c0-60.7 43.6-110.8 101.1-121.3V.551C98 11.851 0 116.851 0 244.751c0 54.8 17.9 105.4 48.2 146.2l91.4-81.7c-11.3-19-18.3-41.2-18.3-64.5zM479.5 173.551l-113.6 45.9c1.6 8.2 2.7 16.3 2.7 24.9 0 68.1-55.2 123.7-123.7 123.7-28.4 0-54.8-9.7-75.4-26.1l-91.4 81.7c43.9 40.8 102.3 65.7 166.8 65.7 135.3 0 245-109.7 245-245 .1-24.5-3.8-48.2-10.4-70.8z"
      fill={color}
    />
  </SvgStyled>
);

export default PieChart;
