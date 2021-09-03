import React from 'react';
import { Button as LinkButton } from 'reactstrap';
import styled from 'styled-components';
import { theme } from '../../config';

const Header = ({ title, onRefresh, loading, style = {}, titleStyle = {} }) => {
  return (
    <HeaderStyled style={style}>
      <Title style={titleStyle}>{title}</Title>
      {!!onRefresh && (
        <LinkButton onClick={onRefresh} disabled={loading} color="link" style={{ marginRight: 10 }}>
          Rafraichir
        </LinkButton>
      )}
    </HeaderStyled>
  );
};

const HeaderStyled = styled.div`
  padding: 48px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  color: ${theme.black};
  font-weight: bold;
  font-size: 24px;
  line-height: 32px;
`;

export default Header;