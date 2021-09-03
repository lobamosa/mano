/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import { Col, Container, Row } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';

import Header from '../../components/header';
import Page from '../../components/pagination';
import SelectStatus from '../../components/SelectStatus';
import Loading from '../../components/loading';
import CreateAction from './CreateAction';
import Table from '../../components/table';
import ActionStatus from '../../components/ActionStatus';

import DateBloc from '../../components/DateBloc';

import { toFrenchDate } from '../../utils';
import AuthContext from '../../contexts/auth';
import PaginationContext from '../../contexts/pagination';
import Search from '../../components/search';
import SelectTeam from '../../components/SelectTeam';
import { filterBySearch } from '../search/utils';
import SelectorsContext from '../../contexts/selectors';
import ActionsCalendar from '../../components/ActionsCalendar';
import SelectCustom from '../../components/SelectCustom';

const filterActions = (actions, { page, limit, status, currentTeam, search }) => {
  if (status) actions = actions.filter((a) => a.status === status);
  if (search?.length) actions = actions.filter(filterBySearch(search));
  actions = actions.filter((a) => a.team === currentTeam._id);
  return actions;
};

const paginateActions = (actions, { page, limit }) => {
  const data = actions.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  return { data, total: actions.length };
};

const showAsOptions = ['Calendrier', 'Liste'];

const List = () => {
  const { actionsFullPopulated } = useContext(SelectorsContext);
  const { user, teams, currentTeam, setCurrentTeam } = useContext(AuthContext);

  const { search, setSearch, status, setStatus, page, setPage } = useContext(PaginationContext);
  const history = useHistory();
  const location = useLocation();

  const [showAs, setShowAs] = useState(new URLSearchParams(location.search)?.get('showAs') || showAsOptions[0]); // calendar, list

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('showAs', showAs);
    history.push({ pathname: location.pathname, search: searchParams.toString() });
  }, [showAs]);

  const limit = 20;

  if (!actionsFullPopulated) return <Loading />;

  const filteredActions = filterActions(actionsFullPopulated, { status, currentTeam, search });
  const { data, total } = paginateActions(filteredActions, { page, limit });

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={`Actions de l'équipe ${currentTeam?.name || ''}`} />
      <Row style={{ marginBottom: 40, justifyContent: 'center' }}>
        <Col>
          <CreateAction disabled={!currentTeam} isMulti refreshable />
        </Col>
      </Row>
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Recherche: </span>
          <Search placeholder="Par mot clé, présent dans le nom, la catégorie, un commentaire, ..." value={search} onChange={setSearch} />
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Filtrer par équipe en charge:</span>
          <div style={{ width: 300 }}>
            <SelectTeam onChange={setCurrentTeam} teamId={currentTeam?._id} teams={user.role === 'admin' ? teams : user.teams} />
          </div>
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Filtrer par status: </span>
          <div style={{ width: 300 }}>
            <SelectStatus noTitle onChange={(event) => setStatus(event.target.value)} value={status} />
          </div>
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Afficher par: </span>
          <div style={{ width: 300 }}>
            <SelectCustom
              onChange={setShowAs}
              value={[showAs]}
              options={showAsOptions}
              isClearable={false}
              isMulti={false}
              getOptionValue={(i) => i}
              getOptionLabel={(i) => i}
            />
          </div>
        </Col>
      </Row>
      {showAs === showAsOptions[0] && (
        <div style={{ minHeight: '100vh' }}>
          <ActionsCalendar actions={filteredActions} />
        </div>
      )}
      {showAs === showAsOptions[1] && (
        <>
          <Table
            data={data}
            rowKey={'_id'}
            onRowClick={(action) => history.push(`/action/${action._id}`)}
            columns={[
              {
                title: 'À faire le',
                dataKey: 'dueAt' || '_id',
                render: (action) => {
                  return <DateBloc date={action.dueAt} withTime={action.withTime} />;
                },
              },
              {
                title: 'Heure',
                dataKey: '_id',
                render: (action) => {
                  if (!action.dueAt || !action.withTime) return null;
                  return new Date(action.dueAt).toLocaleString('fr', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                },
              },
              { title: 'Nom', dataKey: 'name' },
              {
                title: 'Personne suivie',
                dataKey: 'personName',
              },
              { title: 'Créée le', dataKey: 'createdAt', render: (action) => toFrenchDate(action.createdAt || '') },
              { title: 'Status', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
            ]}
          />
          <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
        </>
      )}
    </Container>
  );
};

export default List;