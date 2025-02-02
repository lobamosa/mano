import React, { useState } from 'react';
import { Collapse } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { SmallerHeaderWithBackButton } from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import { theme } from '../../config';
import styled from 'styled-components';
import { formatDateWithFullMonth, getDaysOfMonth, getMonths, isAfterToday, isOnSameDay } from '../../services/date';
import { currentTeamState } from '../../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { refreshTriggerState, loadingState } from '../../components/Loader';
import useApi from '../../services/api';
import dayjs from 'dayjs';
import { currentTeamReportsSelector } from '../../recoil/selectors';

const List = () => {
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const loading = useRecoilValue(loadingState);
  const currentTeam = useRecoilValue(currentTeamState);

  return (
    <>
      <SmallerHeaderWithBackButton
        title={`Comptes rendus de l'équipe ${currentTeam?.nightSession ? 'de nuit ' : ''}${currentTeam?.name || ''}`}
        onRefresh={() => {
          setRefreshTrigger({
            status: true,
            options: { initialLoad: false, showFullScreen: false },
          });
        }}
        loading={!!loading}
      />
      {getMonths().map((date, index) => (
        <HitMonth debug={index === 0} date={date} key={date} />
      ))}
    </>
  );
};

const HitMonth = ({ date, debug }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const reports = useRecoilValue(currentTeamReportsSelector);
  const [isOpen, setIsOpen] = useState(true);
  const [submiting, setSubmiting] = useState(false);
  const API = useApi();
  const setReports = useSetRecoilState(reportsState);

  const history = useHistory();

  const createReport = async (date) => {
    if (submiting) return;
    setSubmiting(true);
    const existingReport = reports.find((r) => r.date === date && r.team === currentTeam._id);
    if (!!existingReport) return history.push(`/report/${existingReport._id}`);
    const res = await API.post({ path: '/report', body: prepareReportForEncryption({ team: currentTeam._id, date }) });
    if (!res.ok) return;
    setReports((reports) => [res.decryptedData, ...reports].sort((r1, r2) => (dayjs(r1.date).isBefore(dayjs(r2.date), 'day') ? 1 : -1)));
    history.push(`/report/${res.data._id}`);
  };

  const days = getDaysOfMonth(date).filter((day) => !isAfterToday(day));

  return (
    <div style={{ width: '100%' }}>
      <MonthButton onClick={() => setIsOpen(!isOpen)} title={`${date.format('MMMM YYYY')}`} />
      <Collapse
        isOpen={isOpen}
        style={{
          marginBottom: '20px',
          justifyContent: 'center',
          display: isOpen ? 'flex' : 'none',
          flexWrap: 'wrap',
          width: '100%',
        }}>
        {days.map((day) => {
          const report = reports.find((rep) => isOnSameDay(rep.date, day));
          if (report) {
            return <FullButton onClick={() => history.push(`/report/${report._id}`)} key={day} title={`${formatDateWithFullMonth(day.toDate())}`} />;
          }
          return <EmptyButton onClick={() => createReport(day)} key={day} title={`${formatDateWithFullMonth(day.toDate())}`} />;
        })}
      </Collapse>
    </div>
  );
};

const EmptyButton = styled(ButtonCustom)`
  display: inline-flex;
  border: 1px solid ${theme.main25};
  color: ${theme.main};
  margin-right: 5px;
  margin-bottom: 5px;
  background-color: #fff;
  flex-basis: 160px;
  font-size: 13px;
`;

const FullButton = styled(EmptyButton)`
  border: 1px solid ${theme.main25};
  background-color: ${theme.main};
  color: #fff;
`;

const MonthButton = styled(EmptyButton)`
  border: 1px solid ${theme.main75};
  text-transform: capitalize;
  width: 100%;
  max-width: 100%;
  color: ${theme.main};
  background-color: #fff;
  font-size: 13px;
  margin: 0px;
  margin-bottom: 20px;
`;

export default List;
