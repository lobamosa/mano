/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useContext } from 'react';
import styled from 'styled-components';
import { Col, Container, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap';
import XLSX from 'xlsx';
import moment from 'moment';

import Header from '../../components/header';

import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import AuthContext from '../../contexts/auth';
import PersonsContext, {
  consumptionsOptions,
  healthInsuranceOptions,
  nationalitySituationOptions,
  personalSituationOptions,
  reasonsOptions,
  ressourcesOptions,
  vulnerabilitiesOptions,
  filterPersonsBase,
} from '../../contexts/persons';
import ActionsContext from '../../contexts/actions';
import CommentsContext from '../../contexts/comments';
import TerritoryContext from '../../contexts/territory';
import TerritoryObservationsContext from '../../contexts/territoryObservations';
import PlacesContext from '../../contexts/places';
import DateRangePickerWithPresets from '../../components/DateRangePickerWithPresets';
import { CustomResponsiveBar, CustomResponsivePie } from '../../components/charts';
import Filters, { filterData } from '../../components/Filters';
import ReportsContext from '../../contexts/reports';
import RefreshContext from '../../contexts/refresh';
import Card from '../../components/Card';
moment.locale('fr');

const getDataForPeriod = (data, { startDate, endDate }, filters = []) => {
  if (!!filters?.filter((f) => Boolean(f?.value)).length) data = filterData(data, filters);
  if (!startDate || !endDate) {
    return data;
  }
  return data.filter((item) => moment(item.createdAt).isBefore(endDate) && moment(item.createdAt).isAfter(startDate));
};

const createSheet = (data) => {
  /*
  [
    [the, first, array, is, the, header],
    [then, its, the, data],
  ]
   */

  const header = data.reduce((columns, item) => {
    for (let key of Object.keys(item)) {
      if (!columns.find((col) => col === key)) columns.push(key);
    }
    return columns;
  }, []);
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

const Stats = () => {
  const { teams, organisation, user, currentTeam } = useContext(AuthContext);
  const { persons: allPersons, loading: personsLoading } = useContext(PersonsContext);
  const { refresh } = useContext(RefreshContext);
  const { actions: allActions, loading: actionsLoading } = useContext(ActionsContext);
  const { comments } = useContext(CommentsContext);
  const { reports } = useContext(ReportsContext);
  const { territories } = useContext(TerritoryContext);
  const { territoryObservations: allObservations } = useContext(TerritoryObservationsContext);
  const { places } = useContext(PlacesContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filterPersons, setFilterPersons] = useState([]);

  const [period, setPeriod] = useState({ startDate: null, endDate: null });

  useEffect(() => {
    if (loading) refresh();
  }, [loading]);

  useEffect(() => {
    if (!personsLoading && !actionsLoading) setLoading(false);
  }, [personsLoading, actionsLoading]);

  if (loading) return <Loading />;

  const persons = getDataForPeriod(allPersons, period, filterPersons);
  const actions = getDataForPeriod(allActions, period);
  const observations = getDataForPeriod(allObservations, period);

  const onExportToCSV = () => {
    const workbook = XLSX.utils.book_new();
    // actions
    XLSX.utils.book_append_sheet(workbook, createSheet(allActions), 'actions');
    XLSX.utils.book_append_sheet(workbook, createSheet(allPersons), 'personnes suivies');
    XLSX.utils.book_append_sheet(workbook, createSheet(comments), 'comments');
    XLSX.utils.book_append_sheet(workbook, createSheet(territories), 'territoires');
    XLSX.utils.book_append_sheet(workbook, createSheet(allObservations), 'observations de territoires');
    XLSX.utils.book_append_sheet(workbook, createSheet(places), 'lieux fréquentés');
    XLSX.utils.book_append_sheet(workbook, createSheet(teams), 'équipes');
    XLSX.utils.book_append_sheet(workbook, createSheet(reports), 'comptes rendus');
    XLSX.writeFile(workbook, 'data.xlsx');
  };

  return (
    <Container>
      <Header title="Statistiques" onRefresh={() => setLoading(true)} />
      <Row className="date-picker-container" style={{ marginBottom: '20px', alignItems: 'center' }}>
        <Col md={8} style={{ display: 'flex' }}>
          <span style={{ marginRight: 10, display: 'inline-flex', alignItems: 'center' }}>Choisissez une période :</span>
          <DateRangePickerWithPresets period={period} setPeriod={setPeriod} />
        </Col>
        {['admin'].includes(user.role) && (
          <Col md={4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ButtonCustom color="primary" onClick={onExportToCSV} title="Exporter les données en .xlsx" padding="12px 24px" />
          </Col>
        )}
      </Row>
      <Nav tabs style={{ marginBottom: 20 }}>
        {['Général', 'Actions', 'Personnes suivies', 'Observations', 'Comptes-rendus'].map((tabCaption, index) => (
          <NavItem key={index} style={{ cursor: 'pointer' }}>
            <NavLink key={index} className={`${activeTab === index && 'active'}`} onClick={() => setActiveTab(index)}>
              {tabCaption}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId={0}>
          <Title>Statistiques de l'organisation</Title>
          <Row style={{ marginBottom: '20px' }}>
            <Col md={2} />
            <Block data={persons} title="Nombre de personnes suivies" />
            <Block data={actions} title="Nombre d'actions" />
            <Col md={2} />
          </Row>
          <Title>Nombre de personnes suivies assignées par équipe</Title>
          <Row style={{ marginBottom: '20px' }}>
            {teams.map((team) => (
              <Block key={team._id} title={team.name} data={persons.filter((p) => p.assignedTeams?.includes(team._id))} />
            ))}
          </Row>
          <Title>Nombre d'actions par équipe</Title>
          <Row style={{ marginBottom: '20px' }}>
            {teams.map((team) => (
              <Block key={team._id} title={team.name} data={actions.filter((a) => a.team === team._id)} />
            ))}
          </Row>
        </TabPane>
        <TabPane tabId={1}>
          <Title>Statistiques des actions</Title>
          <CustomResponsivePie
            title="Répartition des actions par catégorie"
            data={getPieData(
              actions
                .filter((a) => a.team === currentTeam._id)
                .reduce((actionsSplitsByCategories, action) => {
                  if (!!action.categories?.length) {
                    for (const category of action.categories) {
                      actionsSplitsByCategories.push({ ...action, category });
                    }
                  } else {
                    actionsSplitsByCategories.push(action);
                  }
                  return actionsSplitsByCategories;
                }, []),
              'category',
              { options: organisation.categories }
            )}
          />
        </TabPane>
        <TabPane tabId={2}>
          <Title>Statistiques des personnes suivies</Title>
          <Filters base={filterPersonsBase} filters={filterPersons} onChange={setFilterPersons} />
          <Row>
            <Block data={persons} title="Nombre de personnes suivies" />
            <BlockCreatedAt persons={persons} />
            <BlockWanderingAt persons={persons} />
          </Row>
          <Row>
            <CustomResponsivePie title="Nationalité" data={getPieData(persons, 'nationalitySituation', { options: nationalitySituationOptions })} />
            <CustomResponsivePie
              title="Situation personnelle"
              data={getPieData(persons, 'personalSituation', { options: personalSituationOptions })}
            />
          </Row>
          <Row>
            <CustomResponsivePie title="Motif de la situation de rue" data={getPieData(persons, 'reasons', { options: reasonsOptions })} />
            <CustomResponsivePie title="Ressources des personnes suivies" data={getPieData(persons, 'resources', { options: ressourcesOptions })} />
          </Row>
          <Row>
            <AgeRangeBar persons={persons} />
            <StatsCreatedAtRangeBar persons={persons} />
            <CustomResponsivePie title="Type d'hébergement" data={getAdressPieData(persons)} />
            <CustomResponsivePie title="Consommations" data={getPieData(persons, 'consumptions', { options: consumptionsOptions })} />
            <CustomResponsivePie title="Type de vulnérabilité" data={getPieData(persons, 'vulnerabilities', { options: vulnerabilitiesOptions })} />
            <CustomResponsivePie
              title="Couverture médicale des personnes"
              data={getPieData(persons, 'healthInsurance', { options: healthInsuranceOptions })}
            />
            <CustomResponsivePie title="Avec animaux" data={getPieData(persons, 'hasAnimal')} />
            <CustomResponsivePie title="Personnes très vulnérables" data={getPieData(persons, 'alertness', { isBoolean: true })} />
          </Row>
        </TabPane>
        <TabPane tabId={3}>
          <Title>Statistiques des observations de territoire</Title>
          <Row>
            <Col md={3} style={{ marginBottom: '20px' }}>
              <BlockTotal title="Hommes non connus rencontrés" unit="hommes" data={observations} field="personsMale" debug />
            </Col>
            <Col md={3} style={{ marginBottom: '20px' }}>
              <BlockTotal title="Femmes non connues rencontrées" unit="femmes" data={observations} field="personsFemale" />
            </Col>
            <Col md={3} style={{ marginBottom: '20px' }}>
              <BlockTotal title="Matériel ramassé" unit="pièces" data={observations} field="material" />
            </Col>
            <Col md={3} style={{ marginBottom: '20px' }}>
              <BlockTotal title="Nombre de médiations" unit="médiations" data={observations} field="mediation" />
            </Col>
            <CustomResponsivePie title="Présence policière" data={getPieData(observations, 'police')} />
            <CustomResponsivePie title="Ambiance" data={getPieData(observations, 'atmosphere', { options: ['Violences', 'Tensions', 'RAS'] })} />
          </Row>
        </TabPane>
        <TabPane tabId={4}>
          <Title>Statistiques des comptes-rendus</Title>
          <CustomResponsivePie
            title="Répartition des comptes-rendus par collaboration"
            data={getPieData(
              reports.filter((r) => r.team === currentTeam._id),
              'collaboration',
              { options: organisation.collaborations }
            )}
          />
        </TabPane>
      </TabContent>
    </Container>
  );
};

const getPieData = (source, key, { options = null, isBoolean = false } = {}) => {
  const data = source.reduce(
    (newData, person) => {
      if (isBoolean) {
        newData[Boolean(person[key]) ? 'Oui' : 'Non']++;
        return newData;
      }
      if (!person[key] || !person[key].length) {
        newData['Non renseigné']++;
        return newData;
      }
      if (options) {
        for (let option of [...options, 'Uniquement']) {
          if (typeof person[key] === 'string' ? person[key] === option : person[key].includes(option)) {
            if (!newData[option]) newData[option] = 0;
            newData[option]++;
          }
        }
        return newData;
      }
      if (!newData[person[key]]) newData[person[key]] = 0;
      newData[person[key]]++;
      return newData;
    },
    { 'Non renseigné': 0, Oui: 0, Non: 0 }
  );
  return Object.keys(data)
    .map((key) => ({ id: key, label: key, value: data[key] }))
    .filter((d) => d.value > 0);
};

const getAdressPieData = (data) => {
  data = data.reduce(
    (newData, person) => {
      if (!person.address) {
        newData['Non renseigné']++;
        return newData;
      }
      if (person.address === 'Non') {
        newData.Non++;
        return newData;
      }
      if (!person.addressDetail) {
        newData['Oui (Autre)']++;
        return newData;
      }
      if (!newData[person.addressDetail]) newData[person.addressDetail] = 0;
      newData[person.addressDetail]++;
      return newData;
    },
    { 'Oui (Autre)': 0, Non: 0, 'Non renseigné': 0 }
  );
  return Object.keys(data).map((key) => ({ id: key, label: key, value: data[key] }));
};

const AgeRangeBar = ({ persons }) => {
  const categories = ['0 - 2', '3 - 17', '18 - 24', '25 - 44', '45 - 59', '60+'];

  let data = persons.reduce((newData, person) => {
    if (!person.birthdate || !person.birthdate.length) {
      newData['Non renseigné']++;
      return newData;
    }
    const parsedDate = Date.parse(person.birthdate);
    const fromNowInYear = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / 365.25;
    if (fromNowInYear < 2) {
      newData['0 - 2']++;
      return newData;
    }
    if (fromNowInYear < 18) {
      newData['3 - 17']++;
      return newData;
    }
    if (fromNowInYear < 25) {
      newData['18 - 24']++;
      return newData;
    }
    if (fromNowInYear < 45) {
      newData['25 - 44']++;
      return newData;
    }
    if (fromNowInYear < 60) {
      newData['45 - 59']++;
      return newData;
    }
    newData['60+']++;
    return newData;
  }, initCategories(categories));

  data = Object.keys(data)
    .filter((key) => data[key] > 0)
    .map((key) => ({ name: key, [key]: data[key] }));

  return (
    <CustomResponsiveBar title="Tranche d'âges" categories={categories} data={data} axisTitleX="Tranche d'âge" axisTitleY="Nombre de personnes" />
  );
};

const initCategories = (categories) => {
  const objCategories = {};
  for (const cat of categories) {
    objCategories[cat] = 0;
  }
  return objCategories;
};

const StatsCreatedAtRangeBar = ({ persons }) => {
  const categories = ['0-6 mois', '6-12 mois', '1-2 ans', '2-5 ans', '+ 5 ans'];

  let data = persons.reduce((newData, person) => {
    if (!person.createdAt || !person.createdAt.length) {
      return newData;
      // newData["Non renseigné"]++;
    }
    const parsedDate = Date.parse(person.createdAt);
    const fromNowInMonths = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / (365.25 / 12);
    if (fromNowInMonths < 6) {
      newData['0-6 mois']++;
      return newData;
    }
    if (fromNowInMonths < 12) {
      newData['6-12 mois']++;
      return newData;
    }
    if (fromNowInMonths < 24) {
      newData['1-2 ans']++;
      return newData;
    }
    if (fromNowInMonths < 60) {
      newData['2-5 ans']++;
      return newData;
    }
    newData['+ 5 ans']++;
    return newData;
  }, initCategories(categories));

  data = Object.keys(data)
    .filter((key) => data[key] > 0)
    .map((key) => ({ name: key, [key]: data[key] }));

  return (
    <CustomResponsiveBar
      title="Temps de suivi (par tranche)"
      categories={categories}
      data={data}
      axisTitleX="Temps de suivi"
      axisTitleY="Nombre de personnes"
    />
  );
};

const Block = ({ data, title = 'Nombre de personnes suivies' }) => (
  <Col md={4} style={{ marginBottom: 20 }}>
    <Card title={title} count={data.length} />
  </Col>
);

const getDuration = (timestampFromNow) => {
  const inDays = Math.round(timestampFromNow / 1000 / 60 / 60 / 24);
  if (inDays < 90) return [inDays, 'jours'];
  const inMonths = inDays / (365 / 12);
  if (inMonths < 24) return [Math.round(inMonths), 'mois'];
  const inYears = inDays / 365.25;
  return [Math.round(inYears), 'années'];
};

const BlockCreatedAt = ({ persons }) => {
  const averageCreatedAt = persons.reduce((total, person) => total + Date.parse(person.createdAt), 0) / (persons.length || 1);
  const durationFromNowToAverage = Date.now() - averageCreatedAt;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return (
    <Col md={4} style={{ marginBottom: 20 }}>
      <Card title="Temps de suivi moyen" unit={unit} count={count} />
    </Col>
  );
};

const BlockWanderingAt = ({ persons }) => {
  persons = persons.filter((p) => Boolean(p.wanderingAt));
  if (!persons.length) {
    return <Card title="Temps d'errance des personnes<br/>en moyenne" unit={'N/A'} count={0} />;
  }
  const averageWanderingAt = persons.reduce((total, person) => total + Date.parse(person.wanderingAt), 0) / (persons.length || 1);
  const durationFromNowToAverage = Date.now() - averageWanderingAt;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return (
    <Col md={4} style={{ marginBottom: 20 }}>
      <Card title="Temps d'errance des personnes<br/>en moyenne" unit={unit} count={count} />
    </Col>
  );
};

const BlockTotal = ({ title, unit, data, field }) => {
  try {
    data = data.filter((item) => Boolean(item[field]));
    if (!data.length) {
      return <Card title={title} unit={unit} count={0} />;
    }
    const total = data.reduce((total, item) => total + Number(item[field]), 0);
    return <Card title={title} unit={unit} count={total} />;
  } catch (errorBlockTotal) {
    console.log('error block total', errorBlockTotal, { title, unit, data, field });
  }
  return null;
};

const Title = styled.h3`
  margin-top: 20px;
  margin-bottom: 20px;
  font-size: 20px;
`;

export default Stats;
