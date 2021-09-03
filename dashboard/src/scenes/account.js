import React, { useContext, useState } from 'react';
import { Container, FormGroup, Input, Label, Row, Col, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import API from '../services/api';
import Header from '../components/header';
import Loading from '../components/loading';
import ButtonCustom from '../components/ButtonCustom';
import AuthContext from '../contexts/auth';
import ChangePassword from '../components/ChangePassword';

const Account = () => {
  const { user, setAuth } = useContext(AuthContext);

  if (!user) return <Loading />;

  return (
    <div>
      <Header title={user.name} />
      <Container style={{ padding: '40px 0' }}>
        <Formik
          initialValues={user}
          onSubmit={async (body) => {
            try {
              const response = await API.put({ path: '/user', body });
              if (response.ok) {
                toastr.success('Mis à jour !');
                const { user } = await API.get({ path: '/user/me' });
                setAuth({ user });
              }
            } catch (userUpdateError) {
              console.log('error in user update', userUpdateError);
              toastr.error('Erreur!', userUpdateError.message);
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
                {/* <Col md={6} /> */}
                <Col md={6}>
                  <FormGroup>
                    <Label>Email</Label>
                    <Input disabled name="email" value={values.email} onChange={handleChange} />
                  </FormGroup>
                </Col>
                {/* <Col md={6} /> */}
              </Row>
              <hr />
              <Row style={{ display: 'flex', justifyContent: 'center' }}>
                <LinkToChangePassword />
                <ButtonCustom width="250" title="Mettre à jour" loading={isSubmitting} color="info" onClick={handleSubmit} />
              </Row>
            </React.Fragment>
          )}
        </Formik>
      </Container>
    </div>
  );
};

const LinkToChangePassword = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ButtonCustom
        width="250"
        title="Modifier son mot de passe"
        type="button"
        style={{ marginRight: 25 }}
        color="secondary"
        onClick={() => setOpen(true)}
      />

      <Modal isOpen={open} toggle={() => setOpen(false)} className="change-password">
        <ModalHeader>Modifier son mot de passe</ModalHeader>
        <ModalBody>
          <ChangePassword
            onSubmit={(body) => API.post({ path: `/user/reset_password`, skipEncryption: '/user/reset_password', body })}
            onFinished={() => setOpen(false)}
            withCurrentPassword
          />
        </ModalBody>
      </Modal>
    </>
  );
};

export default Account;