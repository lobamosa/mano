/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext } from 'react';
import { Container, Row, Col, FormGroup, Input, Label } from 'reactstrap';
import { useParams, useHistory } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import { Formik } from 'formik';

import 'react-datepicker/dist/react-datepicker.css';

import Header from '../../components/header';
import Loading from '../../components/loading';
import BackButton from '../../components/backButton';
import Box from '../../components/Box';
import ButtonCustom from '../../components/ButtonCustom';

import Observations from '../territory-observations/list';
import TerritoryContext, { territoryTypes } from '../../contexts/territory';
import SelectCustom from '../../components/SelectCustom';

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const { territories, deleteTerritory, updateTerritory } = useContext(TerritoryContext);
  const territory = territories.find((t) => t._id === id);

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await deleteTerritory(id);
      if (!res.ok) return;
      toastr.success('Suppression réussie');
      history.goBack();
    }
  };

  if (!territory) return <Loading />;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={<BackButton />} />
      <Box>
        <Formik
          initialValues={territory}
          onSubmit={async (body) => {
            const res = await updateTerritory(body);
            if (res.ok) {
              toastr.success('Mis à jour !');
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => {
            return (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom</Label>
                      <Input name="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>Types</Label>
                      <SelectCustom
                        options={territoryTypes}
                        name="types"
                        onChange={(v) => handleChange({ currentTarget: { value: v, name: 'types' } })}
                        isClearable={false}
                        isMulti
                        value={values.types}
                        placeholder={' -- Choisir -- '}
                        getOptionValue={(i) => i}
                        getOptionLabel={(i) => i}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>Périmètre</Label>
                      <Input name="perimeter" value={values.perimeter} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
                  <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </div>
              </React.Fragment>
            );
          }}
        </Formik>
      </Box>
      <Observations territory={territory || { _id: id }} />
    </Container>
  );
};

export default View;