import React, { Fragment, useContext, useState } from 'react';
import { Col, FormGroup, Input, Modal, ModalBody, ModalHeader, Row, Button as LinkButton } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import { SmallerHeaderWithBackButton } from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import Loading from '../../components/loading';
import CreateWrapper from '../../components/createWrapper';
import Table from '../../components/table';
import Search from '../../components/search';
import PaginationContext from '../../contexts/pagination';
import Page from '../../components/pagination';
import { filterBySearch } from '../search/utils';
import { currentTeamState, organisationState } from '../../recoil/auth';
import { personsState } from '../../recoil/persons';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { placesState, preparePlaceForEncryption } from '../../recoil/places';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { formatDateWithFullMonth } from '../../services/date';
import { loadingState, refreshTriggerState } from '../../components/Loader';
import useApi from '../../services/api';

const filterPlaces = (places, { page, limit, search }) => {
  if (search?.length) places = filterBySearch(search, places);

  const data = places.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  return { data, total: places.length };
};

const List = () => {
  const places = useRecoilValue(placesState);
  const relsPersonPlace = useRecoilValue(relsPersonPlaceState);
  const organisation = useRecoilValue(organisationState);
  const persons = useRecoilValue(personsState);
  const history = useHistory();

  const { search, setSearch, page, setPage } = useContext(PaginationContext);

  const limit = 20;

  if (!places) return <Loading />;

  const { data, total } = filterPlaces(places, { page, limit, search });

  return (
    <>
      <SmallerHeaderWithBackButton
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
              <p style={{ marginBottom: 0 }}>
                {relsPersonPlace
                  .filter((rel) => rel.place === place._id)
                  .map((rel) => persons.find((p) => p._id === rel.person))
                  .map(({ _id, name }, index, arr) => (
                    <Fragment key={_id}>
                      {name}
                      {index < arr.length - 1 && <br />}
                    </Fragment>
                  ))}
              </p>
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
  const setPlaces = useSetRecoilState(placesState);
  const API = useApi();

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
              const response = await API.post({ path: '/place', body: preparePlaceForEncryption(body) });
              if (response.ok) {
                setPlaces((places) => [response.decryptedData, ...places].sort((p1, p2) => p1.name.localeCompare(p2.name)));
                toastr.success('Création réussie !');
              } else {
                toastr.error('Erreur!', response.error);
              }
              actions.setSubmitting(false);
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
