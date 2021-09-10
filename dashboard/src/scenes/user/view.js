/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import { Container, FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import API from '../../services/api';

import Header from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import BackButton from '../../components/backButton';
import Box from '../../components/Box';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import AuthContext from '../../contexts/auth';
import SelectCustom from '../../components/SelectCustom';

const View = () => {
  const [user, setUser] = useState(null);
  const { id } = useParams();
  const history = useHistory();
  const { setAuth, ...auth } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      const { data } = await API.get({ path: `/user/${id}` });
      setUser(data);
    })();
  }, []);

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await API.delete({ path: `/user/${id}` });
      if (!res.ok) return;
      toastr.success('Suppression réussie');
      history.goBack();
    }
  };

  if (!user) return <Loading />;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={<BackButton />} />
      <Box>
        <Formik
          initialValues={user}
          onSubmit={async (body, actions) => {
            try {
              body.organisation = auth.organisation._id;
              const res = await API.put({ path: `/user/${id}`, body });
              if (!res.ok) return actions.setSubmitting(false);
              if (auth.user._id === id) {
                const { data } = await API.get({ path: `/user/${id}` });
                setAuth({ user: data });
              }
              actions.setSubmitting(false);
              toastr.success('Mis à jour !');
            } catch (errorUpdatingUser) {
              console.log('error in updating user', errorUpdatingUser);
              toastr.error('Erreur!', errorUpdatingUser.message);
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
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
                    <Label>Email</Label>
                    <Input name="email" value={values.email} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Équipes</Label>
                    <div>
                      <SelectTeamMultiple
                        onChange={(team) => handleChange({ target: { value: team || [], name: 'team' } })}
                        organisation={auth.organisation._id}
                        value={values.team || []}
                        colored
                      />
                    </div>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Role</Label>
                    <SelectCustom
                      options={['normal', 'admin'].map((role) => ({ value: role, label: role }))}
                      onChange={({ value }) => handleChange({ target: { value, name: 'role' } })}
                      value={{ value: values.role, label: values.role }}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
                <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
              </div>
            </React.Fragment>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default View;
