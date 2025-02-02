import React from 'react';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import { teamsState } from '../recoil/auth';

const TagTeam = ({ teamId }) => {
  const teams = useRecoilValue(teamsState);
  const teamIndex = teams?.findIndex((t) => t._id === teamId);
  const team = teams?.find((t) => t._id === teamId);
  if (!team) return null;
  return (
    <Team key={team?._id} teamIndex={teamIndex}>
      {team?.name}
    </Team>
  );
};

const teamsColors = ['#255c99', '#74776bff', '#00c6a5ff', '#ff4b64ff', '#ef798aff'];

const Team = styled.span`
  background-color: ${({ teamIndex }) => teamsColors[teamIndex % teamsColors?.length]};
  margin-right: 10px;
  margin-bottom: 5px;
  padding: 2px 10px;
  border-radius: 5px;
  color: #fff;
`;

export default TagTeam;
