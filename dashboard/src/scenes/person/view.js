/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext } from 'react';
import { Container, FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import DatePicker from 'react-datepicker';

import TagTeam from '../../components/TagTeam';
import Header from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import BackButton from '../../components/backButton';
import CreateAction from '../action/CreateAction';
import Box from '../../components/Box';
import Comments from '../../components/Comments';
import ActionStatus from '../../components/ActionStatus';
import Table from '../../components/table';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import PersonsContext, {
  addressDetails,
  addressDetailsFixedFields,
  consumptionsOptions,
  employmentOptions,
  genderOptions,
  healthInsuranceOptions,
  nationalitySituationOptions,
  personalSituationOptions,
  reasonsOptions,
  ressourcesOptions,
  vulnerabilitiesOptions,
  yesNoOptions,
} from '../../contexts/persons';
import ActionsContext from '../../contexts/actions';
import UserName from '../../components/UserName';
import SelectCustom from '../../components/SelectCustom';
import SelectAsInput from '../../components/SelectAsInput';
import Places from '../../components/Places';
import { toFrenchDate } from '../../utils';

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const { persons, updatePerson, deletePerson } = useContext(PersonsContext);

  const person = persons.find((p) => p._id === id) || {};

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await deletePerson(id);
      if (res?.ok) {
        toastr.success('Suppression réussie');
        history.goBack();
      }
    }
  };

  return (
    <StyledContainer style={{ padding: '40px 0' }}>
      <Header title={<BackButton />} />
      <Title>
        {`Dossier de ${person?.name}`}
        <UserName id={person.user} wrapper={(name) => ` (créée par ${name})`} />
      </Title>
      <Box>
        <Formik
          initialValues={person}
          onSubmit={async (body) => {
            if (!body.createdAt) body.createdAt = person.createdAt;
            body.entityKey = person.entityKey;
            const res = await updatePerson(body);
            if (res.ok) {
              toastr.success('Mis à jour !');
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting, setFieldValue }) => {
            return (
              <React.Fragment>
                <Title>Résumé</Title>
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Nom prénom ou Pseudonyme</Label>
                      <Input name="name" value={values.name || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Autres pseudos</Label>
                      <Input name="otherNames" value={values.otherNames || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <Label>Genre</Label>
                    <SelectAsInput options={genderOptions} name="gender" value={values.gender || ''} onChange={handleChange} />
                  </Col>

                  <Col md={4}>
                    <FormGroup>
                      <Label>Date de naissance</Label>
                      <div>
                        <DatePicker
                          locale="fr"
                          className="form-control"
                          selected={values.birthdate ? new Date(values.birthdate) : null}
                          onChange={(date) => handleChange({ target: { value: date, name: 'birthdate' } })}
                          dateFormat="dd/MM/yyyy"
                        />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>En rue depuis le</Label>
                      <div>
                        <DatePicker
                          locale="fr"
                          className="form-control"
                          selected={values.wanderingAt ? new Date(values.wanderingAt) : null}
                          onChange={(date) => handleChange({ target: { value: date, name: 'wanderingAt' } })}
                          dateFormat="dd/MM/yyyy"
                        />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Suivi(e) depuis le / Créé le</Label>
                      <div>
                        <DatePicker
                          locale="fr"
                          className="form-control"
                          selected={values.createdAt ? new Date(values.createdAt) : null}
                          onChange={(date) => handleChange({ target: { value: date, name: 'createdAt' } })}
                          dateFormat="dd/MM/yyyy"
                        />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Équipe(s) en charge</Label>
                      <div>
                        <SelectTeamMultiple
                          onChange={(teams) => handleChange({ target: { value: teams || [], name: 'assignedTeams' } })}
                          value={values.assignedTeams}
                          colored
                        />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Personne très vulnérable</Label>
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                        <span>Personne très vulnérable, ou ayant besoin d'une attention particulière</span>
                        <Input type="checkbox" name="alertness" checked={values.alertness} onChange={handleChange} />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Téléphone</Label>
                      <Input name="phone" value={values.phone || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Description</Label>
                      <Input type="textarea" rows={5} name="description" value={values.description || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <hr />
                <Title>Dossier social</Title>
                <Row>
                  <Col md={4}>
                    <Label>Situation personnelle</Label>
                    <SelectAsInput
                      options={personalSituationOptions}
                      name="personalSituation"
                      value={values.personalSituation || ''}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Structure de suivi social</Label>
                      <Input name="structureSocial" value={values.structureSocial || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Avec animaux</Label>
                      <SelectAsInput options={yesNoOptions} name="hasAnimal" value={values.hasAnimal || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Hébergement</Label>
                      <SelectAsInput options={yesNoOptions} name="address" value={values.address || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>

                  <AddressDetails values={values} onChange={handleChange} />

                  <Col md={4}>
                    <FormGroup>
                      <Label>Nationalité</Label>
                      <SelectAsInput
                        options={nationalitySituationOptions}
                        name="nationalitySituation"
                        value={values.nationalitySituation || ''}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Emploi</Label>
                      <SelectAsInput options={employmentOptions} name="employment" value={values.employment || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>

                  <Col md={4}>
                    <Ressources value={values.resources} onChange={handleChange} />
                  </Col>

                  <Col md={4}>
                    <Reasons value={values.reasons} onChange={handleChange} />
                  </Col>
                </Row>
                <hr />
                <Title>Dossier médical</Title>
                <Row>
                  <Col md={4}>
                    <Label>Couverture médicale</Label>
                    <SelectAsInput
                      options={healthInsuranceOptions}
                      name="healthInsurance"
                      value={values.healthInsurance || ''}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Structure de suivi médical</Label>
                      <Input name="structureMedical" value={values.structureMedical} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <Vunerabilities value={values.vulnerabilities} onChange={handleChange} />
                  </Col>
                  <Col md={4}>
                    <Consommations value={values.consumptions} onChange={handleChange} />
                  </Col>
                </Row>
                <hr />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
                  <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </div>
              </React.Fragment>
            );
          }}
        </Formik>
      </Box>
      <Actions person={person} />
      <Comments personId={person?._id} />
      <Places personId={person?._id} />
    </StyledContainer>
  );
};

const Actions = ({ person }) => {
  const { actions } = useContext(ActionsContext);

  const data = actions.filter((a) => a.person === person._id);

  const history = useHistory();

  return (
    <React.Fragment>
      <div style={{ display: 'flex', margin: '30px 0 20px', alignItems: 'center' }}>
        <Title>Actions</Title>
        <CreateAction person={person._id} />
      </div>
      <StyledTable
        data={data}
        rowKey={'_id'}
        onRowClick={(action) => history.push(`/action/${action._id}`)}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'À faire le', dataKey: 'dueAt', render: (action) => toFrenchDate(action.dueAt) },
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
          { title: 'Status', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
          {
            title: 'Équipe',
            dataKey: 'team',
            render: (action) => <TagTeam key={action.team} teamId={action.team} />,
          },
        ]}
      />
    </React.Fragment>
  );
};

const StyledContainer = styled(Container)`
  div.row {
    padding: 10px 0;
  }
`;

const StyledTable = styled(Table)`
  table tr {
    height: 40px;
  }
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
  span {
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 400;
    font-style: italic;
    display: block;
  }
`;

const AddressDetails = ({ values, onChange }) => {
  const isFreeFieldAddressDetail = (addressDetail = '') => {
    if (!addressDetail) return false;
    return !addressDetailsFixedFields.includes(addressDetail);
  };

  const computeValue = (value = '') => {
    if (!value) return '';
    if (addressDetailsFixedFields.includes(value)) return value;
    return 'Autre';
  };

  const onChangeRequest = (event) => {
    event.target.value = event.target.value || 'Autre';
    onChange(event);
  };

  return (
    <>
      <Col md={4}>
        <FormGroup>
          <Label>Type d'hébergement</Label>
          <SelectAsInput
            isDisabled={values.address !== 'Oui'}
            name="addressDetail"
            value={computeValue(values.addressDetail)}
            options={addressDetails}
            onChange={onChange}
          />
        </FormGroup>{' '}
      </Col>
      <Col md={4}>
        {!!isFreeFieldAddressDetail(values.addressDetail) && (
          <FormGroup>
            <Label>Autre type d'hébergement</Label>
            <Input name="addressDetail" value={values.addressDetail === 'Autre' ? '' : values.addressDetail} onChange={onChangeRequest} />
          </FormGroup>
        )}
      </Col>
    </>
  );
};

const Reasons = ({ value, onChange }) => (
  <FormGroup>
    <Label>Motif de la situation en rue</Label>
    <SelectCustom
      options={reasonsOptions}
      name="reasons"
      onChange={(v) => onChange({ currentTarget: { value: v, name: 'reasons' } })}
      isClearable={false}
      isMulti
      value={value}
      placeholder={' -- Choisir -- '}
      getOptionValue={(i) => i}
      getOptionLabel={(i) => i}
    />
  </FormGroup>
);

const Vunerabilities = ({ value, onChange }) => (
  <FormGroup>
    <Label>Vulnérabilités</Label>
    <SelectCustom
      options={vulnerabilitiesOptions}
      name="vulnerabilities"
      onChange={(v) => onChange({ currentTarget: { value: v, name: 'vulnerabilities' } })}
      isClearable={false}
      isMulti
      value={value}
      placeholder={' -- Choisir -- '}
      getOptionValue={(i) => i}
      getOptionLabel={(i) => i}
    />
  </FormGroup>
);

const Ressources = ({ value, onChange }) => (
  <FormGroup>
    <Label>Ressources</Label>
    <SelectCustom
      options={ressourcesOptions}
      name="resources"
      onChange={(v) => onChange({ currentTarget: { value: v, name: 'resources' } })}
      isClearable={false}
      isMulti
      value={value}
      placeholder={' -- Choisir -- '}
      getOptionValue={(i) => i}
      getOptionLabel={(i) => i}
    />
  </FormGroup>
);

const Consommations = ({ value, onChange }) => (
  <FormGroup>
    <Label>Consommations</Label>
    <SelectCustom
      options={consumptionsOptions}
      name="consumptions"
      onChange={(v) => onChange({ currentTarget: { value: v, name: 'consumptions' } })}
      isClearable={false}
      isMulti
      value={value}
      placeholder={' -- Choisir -- '}
      getOptionValue={(i) => i}
      getOptionLabel={(i) => i}
    />
  </FormGroup>
);

export default View;