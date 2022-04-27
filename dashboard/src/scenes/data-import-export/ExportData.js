import React, { useState } from 'react';
import XLSX from 'xlsx';

import ButtonCustom from '../../components/ButtonCustom';
import { personsState } from '../../recoil/persons';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import { organisationState, teamsState, usersState, userState } from '../../recoil/auth';
import { commentsState } from '../../recoil/comments';
import { actionsState } from '../../recoil/actions';
import { placesState } from '../../recoil/places';
import { reportsState } from '../../recoil/reports';
import { territoriesState } from '../../recoil/territory';
import { useRecoilValue } from 'recoil';
import { passagesState } from '../../recoil/passages';

const createSheet = (data) => {
  /*
  [
    [the, first, array, is, the, header],
    [then, its, the, data],
  ]
   */

  const encryptionFields = ['encryptedEntityKey', 'entityKey'];

  const header = [
    ...data
      .reduce((columns, item) => {
        for (let key of Object.keys(item)) {
          if (!columns.find((col) => col === key)) columns.push(key);
        }
        return columns;
      }, [])
      .filter((column) => !encryptionFields.includes(column)),
    ...encryptionFields,
  ];

  const sheet = data.reduce(
    (xlsxData, item, index) => {
      const row = [];
      for (let column of header) {
        const value = item[column];
        if (!value) {
          row.push(null);
          continue;
        }
        if (typeof value === 'string') {
          row.push(value);
          continue;
        }
        if (typeof value[0] === 'string') {
          row.push(value.join(', '));
          continue;
        }
        row.push(JSON.stringify(value));
      }
      return [...xlsxData, row];
    },
    [header]
  );
  return XLSX.utils.aoa_to_sheet(sheet);
};

const ExportData = () => {
  const [isExporting, setIsExporting] = useState(false);
  const teams = useRecoilValue(teamsState);
  const users = useRecoilValue(usersState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);

  const allPersons = useRecoilValue(personsState);
  const allActions = useRecoilValue(actionsState);
  const comments = useRecoilValue(commentsState);
  const allReports = useRecoilValue(reportsState);
  const territories = useRecoilValue(territoriesState);
  const allObservations = useRecoilValue(territoryObservationsState);
  const places = useRecoilValue(placesState);
  const allPassages = useRecoilValue(passagesState);

  const onExportToCSV = async () => {
    setIsExporting(true);
    // just to trigger the loading state, sorry Raph :)
    await new Promise((res) => setTimeout(res));
    const workbook = XLSX.utils.book_new();

    const persons = allPersons.map((p) => ({ ...p, followedSince: p.followedSince || p.createdAt }));
    const reports = allReports.map((r) => {
      const report = {};
      for (const key of Object.keys(r)) {
        if (key === 'services') continue;
        report[key] = r[key];
      }
      const reportServices = JSON.parse(r.services || '{}');
      for (const service of organisation.services || []) {
        report[service] = reportServices[service];
      }
      return report;
    });
    // actions
    XLSX.utils.book_append_sheet(workbook, createSheet(allActions), 'actions');
    XLSX.utils.book_append_sheet(workbook, createSheet(persons), 'personnes suivies');
    XLSX.utils.book_append_sheet(workbook, createSheet(comments), 'comments');
    XLSX.utils.book_append_sheet(workbook, createSheet(territories), 'territoires');
    XLSX.utils.book_append_sheet(workbook, createSheet(allObservations), 'observations de territoires');
    XLSX.utils.book_append_sheet(workbook, createSheet(places), 'lieux fréquentés');
    XLSX.utils.book_append_sheet(workbook, createSheet(teams), 'équipes');
    XLSX.utils.book_append_sheet(workbook, createSheet(users), 'utilisateurs');
    XLSX.utils.book_append_sheet(workbook, createSheet(reports), 'comptes rendus');
    XLSX.utils.book_append_sheet(workbook, createSheet(allPassages), 'passages');
    XLSX.writeFile(workbook, 'data.xlsx');
    setIsExporting(false);
  };

  if (!['admin'].includes(user.role)) return null;

  return (
    <ButtonCustom
      color="primary"
      onClick={onExportToCSV}
      title="Exporter les données en .xlsx"
      padding="12px 24px"
      loading={isExporting}
      disabled={isExporting}
    />
  );
};

export default ExportData;
