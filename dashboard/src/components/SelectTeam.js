/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import SelectCustom from './SelectCustom';

const SelectTeam = ({ onChange = () => null, teamId = null, teams = null }) => {
  if (!teams) return <div />;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderRadius: '5px',
      }}>
      <SelectCustom
        options={teams.map(({ _id }) => _id)}
        value={[teamId]}
        onChange={(id) => onChange(teams.find((team) => team._id === id))}
        getOptionValue={(id) => id}
        getOptionLabel={(id) => teams.find((team) => team._id === id)?.name}
        placeholder={' -- Choisir -- '}
        isClearable={false}
      />
    </div>
  );
};

export default SelectTeam;