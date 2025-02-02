import React, { useState } from 'react';
import styled from 'styled-components';
import { Document, Page } from 'react-pdf';
import { useRecoilState } from 'recoil';
import ButtonCustom from '../../components/ButtonCustom';
import charte from '../../assets/charte.pdf';
import { userState } from '../../recoil/auth';
import useApi from '../../services/api';
import { AppSentry } from '../../services/sentry';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker;

const Charte = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useRecoilState(userState);
  const API = useApi();

  const onSigninValidated = async () => {
    setLoading(true);
    const termsAccepted = Date.now();
    const response = await API.put({ path: '/user', body: { termsAccepted } });
    if (!response.ok) return;
    setUser({ ...user, termsAccepted });
    AppSentry.setUser({ ...user, termsAccepted });
  };

  return (
    <Wrapper>
      <Title>Charte des Utilisateurs de Mano</Title>
      <Subtitle>Veuillez lire et accepter la Charte des Utilisateurs de Mano avant de continuer</Subtitle>
      <Document file={charte}>
        <Page pageNumber={1} />
        <Page pageNumber={2} />
        <Page pageNumber={3} />
        <Page pageNumber={4} />
      </Document>
      <Submit loading={loading} type="submit" color="primary" title="Accepter et continuer" onClick={onSigninValidated} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  max-width: 650px;
  width: calc(100% - 40px);
  padding: 40px 30px 30px;
  border-radius: 0.5em;
  background-color: #fff;
  font-family: Nista, Helvetica;
  color: #252b2f;
  margin: 5em auto;
  overflow-x: hidden;
  overflow-y: auto;
`;

const Title = styled.div`
  font-family: Helvetica;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 15px;
`;

const Subtitle = styled.span`
  display: block;
  font-family: Helvetica;
  text-align: center;
  font-size: 20px;
  font-weight: 500;
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

export default Charte;
