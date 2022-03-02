import React, { useContext, useState } from 'react';
import { Col, FormGroup, Input, Modal, ModalBody, ModalHeader, Row, Button as LinkButton } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import Header from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import Loading from '../../components/loading';
import CreateWrapper from '../../components/createWrapper';
import Table from '../../components/table';
import Search from '../../components/search';
import PaginationContext from '../../contexts/pagination';
import Page from '../../components/pagination';
import { filterBySearch } from '../search/utils';
import { currentTeamState, organisationState } from '../../recoil/auth';
import { usePersons } from '../../recoil/persons';
import { useRelsPerson } from '../../recoil/relPersonPlace';
import { usePlaces } from '../../recoil/places';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { formatDateWithFullMonth } from '../../services/date';
import { loadingState, refreshTriggerState } from '../../components/Loader';

const filterPlaces = (places, { page, limit, search }) => {
  if (search?.length) places = filterBySearch(search, places);

  const data = places.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  return { data, total: places.length };
};

const List = () => {
  const { places } = usePlaces();
  const { relsPersonPlace } = useRelsPerson();
  const { persons } = usePersons();
  const organisation = useRecoilValue(organisationState);
  const history = useHistory();

  const { search, setSearch, page, setPage } = useContext(PaginationContext);

  const limit = 20;

  if (!places) return <Loading />;

  const { data, total } = filterPlaces(places, { page, limit, search });

  return (
    <>
      <Header
        titleStyle={{ fontWeight: 400 }}
        title={
          <>
            Lieux fréquentés de l'organisation <b>{organisation.name}</b>
          </>
        }
      />
      <Row style={{ marginBottom: 40 }}>
        <Col>
          <Create />
        </Col>
      </Row>
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Recherche : </span>
          <Search placeholder="Par nom du lieu" value={search} onChange={setSearch} />
        </Col>
      </Row>
      <Table
        data={data}
        rowKey={'_id'}
        onRowClick={(place) => history.push(`/place/${place._id}`)}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          {
            title: 'Personnes suivies',
            dataKey: 'persons',
            render: (place) => (
              <span
                dangerouslySetInnerHTML={{
                  __html: relsPersonPlace
                    .filter((rel) => rel.place === place._id)
                    .map((rel) => persons.find((p) => p._id === rel.person)?.name)
                    .join('<br/>'),
                }}
              />
            ),
          },
          { title: 'Créée le', dataKey: 'createdAt', render: (place) => formatDateWithFullMonth(place.createdAt) },
        ]}
      />
      <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
    </>
  );
};

const Create = () => {
  const [open, setOpen] = useState(false);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const currentTeam = useRecoilValue(currentTeamState);
  const loading = useRecoilValue(loadingState);
  const { addPlace } = usePlaces();

  return (
    <CreateWrapper style={{ marginBottom: 0 }}>
      <LinkButton
        disabled={!!loading}
        onClick={() => {
          setRefreshTrigger({
            status: true,
            options: { initialLoad: false, showFullScreen: false },
          });
        }}
        color="link"
        style={{ marginRight: 10 }}>
        Rafraichir
      </LinkButton>
      <ButtonCustom
        disabled={!currentTeam}
        onClick={() => setOpen(true)}
        color="primary"
        title="Créer un nouveau lieu fréquenté"
        padding="12px 24px"
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer un nouveau lieu frequenté</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '', organisation: '' }}
            onSubmit={async (body, actions) => {
              const response = await addPlace(body);
              actions.setSubmitting(false);
              if (response.ok) {
                toastr.success('Création réussie !');
              } else {
                toastr.error('Erreur!', response.error);
              }
              setOpen(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <div>Nom</div>
                      <Input name="name" id="create-place-name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom id="create-place-button" loading={isSubmitting} color="info" onClick={handleSubmit} title="Créer" />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </CreateWrapper>
  );
};

export default List;
