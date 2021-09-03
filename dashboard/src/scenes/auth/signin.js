import React, { useState, useContext } from 'react';
import { FormGroup } from 'reactstrap';
import { Formik, Field } from 'formik';
import validator from 'validator';
import { Link, useHistory } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import { version } from '../../../package.json';

import API from '../../services/api';
import AuthContext from '../../contexts/auth';
import ButtonCustom from '../../components/ButtonCustom';
import { theme } from '../../config';
import RefreshContext from '../../contexts/refresh';

const SignIn = () => {
  const { setAuth, setCurrentTeam, resetAuth, user } = useContext(AuthContext);
  const { refresh } = useContext(RefreshContext);
  const history = useHistory();
  const [showErrors, setShowErrors] = useState(false);
  const [showSelectTeam, setShowSelectTeam] = useState(false);
  const [showEncryption, setShowEncryption] = useState(false);

  if (showSelectTeam) {
    return (
      <AuthWrapper>
        <Title>Choisir son équipe pour commencer</Title>
        <TeamsContainer>
          {user.teams.map((team) => (
            <ButtonCustom
              key={team._id}
              title={team.name}
              onClick={() => {
                setCurrentTeam(team);
                refresh({ initialLoad: true, showFullScreen: true });
                history.push('/');
              }}
            />
          ))}
        </TeamsContainer>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <Title>Se connecter</Title>
      <Formik
        initialValues={{ email: '', password: '', orgEncryptionKey: '' }}
        onSubmit={async (values, actions) => {
          try {
            const body = {
              email: values.email,
              password: values.password,
            };
            API.toastr = toastr;
            const { user, token, ok } = await API.post({
              path: '/user/signin',
              skipEncryption: '/user/signin',
              body,
            });
            if (!ok) return actions.setSubmitting(false);
            API.init({ resetAuth, history, toastr });
            const { organisation } = user;
            if (!!organisation.encryptionEnabled && !showEncryption) {
              setShowEncryption(true);
              return actions.setSubmitting(false);
            }
            if (token) API.token = token;
            if (!!values.orgEncryptionKey) await API.setOrgEncryptionKey(values.orgEncryptionKey.trim());
            const teamResponse = await API.get({ path: '/team' });
            const teams = teamResponse.data;
            const usersResponse = await API.get({ path: '/user', query: { minimal: true } });
            const users = usersResponse.data;
            setAuth({ teams, users, user, organisation });
            actions.setSubmitting(false);
            if (['superadmin'].includes(user.role)) {
              history.push('/organisation');
            } else if (user.teams.length <= 1) {
              setCurrentTeam(user.teams[0]);
              history.push('/');
              refresh({ initialLoad: true, showFullScreen: true });
            } else if (!teams.length) {
              history.push('/team');
            } else {
              setShowSelectTeam(true);
            }
          } catch (signinError) {
            console.log('error signin', signinError);
            toastr.error('Mauvais identifiants', signinError.message);
          }
        }}>
        {({ values, errors, isSubmitting, handleChange, handleSubmit }) => {
          const handleChangeRequest = (args) => {
            setShowErrors(false);
            handleChange(args);
          };

          const handleSubmitRequest = (args) => {
            setShowErrors(true);
            handleSubmit(args);
          };

          return (
            <form onSubmit={handleSubmitRequest}>
              <StyledFormGroup>
                <div>
                  <InputField
                    validate={(v) => !validator.isEmail(v) && 'Adresse email invalide'}
                    name="email"
                    type="email"
                    id="email"
                    value={values.email}
                    onChange={handleChangeRequest}
                  />
                  <label htmlFor="email">Email </label>
                </div>
                {!!showErrors && <p style={{ fontSize: 12, color: 'rgb(253, 49, 49)' }}>{errors.email}</p>}
              </StyledFormGroup>
              <StyledFormGroup>
                <div>
                  <InputField
                    validate={(v) => validator.isEmpty(v) && 'Ce champ est obligatoire'}
                    name="password"
                    type="password"
                    id="password"
                    value={values.password}
                    onChange={handleChangeRequest}
                  />
                  <label htmlFor="password">Mot de passe</label>
                </div>
                {!!showErrors && <p style={{ fontSize: 12, color: 'rgb(253, 49, 49)' }}>{errors.password}</p>}
              </StyledFormGroup>
              <div style={{ textAlign: 'right', marginBottom: 20, marginTop: -20, fontSize: 12 }}>
                <Link to="/auth/forgot">Mot de passe oublié ?</Link>
              </div>
              {!!showEncryption && (
                <StyledFormGroup>
                  <div>
                    <InputField
                      validate={(v) => validator.isEmpty(v) && 'Ce champ est obligatoire'}
                      name="orgEncryptionKey"
                      type="search"
                      autoComplete="off"
                      id="orgEncryptionKey"
                      autoFocus
                      value={values.orgEncryptionKey}
                      onChange={handleChangeRequest}
                    />
                    <label htmlFor="orgEncryptionKey">Clé de chiffrement d'organisation</label>
                  </div>
                  {!!showErrors && <p style={{ fontSize: 12, color: 'rgb(253, 49, 49)' }}>{errors.password}</p>}
                </StyledFormGroup>
              )}
              <Submit loading={isSubmitting} type="submit" color="primary" title="Se connecter" />
              <p
                style={{
                  fontSize: 12,
                  margin: '20px auto 0',
                  display: 'block',
                  textAlign: 'center',
                }}>
                Version: {version}
              </p>
            </form>
          );
        }}
      </Formik>
    </AuthWrapper>
  );
};

const AuthWrapper = styled.div`
  max-width: 500px;
  width: calc(100% - 40px);
  padding: 40px 30px 30px;
  border-radius: 0.5em;
  background-color: #fff;
  font-family: Nista, Helvetica;
  color: #252b2f;
  margin: 5em auto;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-box-shadow: 0 0 1.25rem 0 rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 1.25rem 0 rgba(0, 0, 0, 0.2);
`;

const Title = styled.div`
  font-family: Helvetica;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 15px;
`;

const Submit = styled(ButtonCustom)`
  font-family: Helvetica;
  width: 220px;
  border-radius: 30px;
  margin: auto;
  font-size: 16px;
  min-height: 42px;
`;

const InputField = styled(Field)`
  background-color: transparent;
  outline: 0;
  display: block;
  width: 100%;
  padding: 0.625rem;
  margin-bottom: 0.375rem;
  border-radius: 4px;
  border: 1px solid #a7b0b7;
  color: #252b2f;
  -webkit-transition: border 0.2s ease;
  transition: border 0.2s ease;
  line-height: 1.2em;
  &:focus {
    outline: none;
    border: 1px solid ${theme.main}CC;
    & + label {
      color: ${theme.main}CC;
    }
  }

  &#orgEncryptionKey {
    font-family: password;
    font-size: 9px;
    line-height: 18px;
    letter-spacing: 1.2px;
  }
`;

const StyledFormGroup = styled(FormGroup)`
  margin-bottom: 25px;
  div {
    display: flex;
    flex-direction: column-reverse;
  }
`;

const TeamsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  > * {
    width: 100%;
    margin-top: 30px;
  }
`;

export default SignIn;