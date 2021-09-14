import React, { useState } from 'react';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import styled from 'styled-components';
import 'react-datepicker/dist/react-datepicker.css';

import { theme } from '../config';

const NightSessionModale = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <QuestionMarkButton onClick={() => setOpen(true)}>?</QuestionMarkButton>
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Maraude de nuit</ModalHeader>
        <ModalBody>
          <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
            Si vous choisissez le mode "Maraude de nuit" pour cette équipe, le rapport pour une journée affichera les
            commentaires/actions/observations qui auront été créées entre midi de ce jour et midi du jour suivant. <br />
            Par exemple, le rapport du 10 septembre affichera les commentaires/actions/observations entre le 10 septembre midi et le 11 septembre
            midi.
            <br />
            <br />
            Si vous ne choisissez PAS le mode "Maraude de nuit" pour cette équipe, le rapport pour une journée affichera les
            commentaires/actions/observations qui auront été créées entre ce jour là entre minuit et minuit.
          </span>
        </ModalBody>
      </Modal>
    </>
  );
};

const QuestionMarkButton = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 20px;
  margin-left: 10px;
  box-shadow: none;
  border: 1px solid ${theme.main};
  color: ${theme.main};
  font-size: 14px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
`;

export default NightSessionModale;