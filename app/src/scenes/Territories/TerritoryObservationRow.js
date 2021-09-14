import React from 'react';
import styled from 'styled-components';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Alert } from 'react-native';
import { MyText } from '../../components/MyText';
import colors from '../../utils/colors';
import { compose } from 'recompose';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import TerritoryObservationsContext from '../../contexts/territoryObservations';
import UserName from '../../components/UserName';

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const TerritoryObservationRow = ({ onUpdate, observation, context, showActionSheetWithOptions, id }) => {
  const onPressRequest = async () => {
    const options = ['Supprimer', 'Annuler'];
    if (onUpdate && observation.user._id === context.user._id) options.unshift('Modifier');
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: 1,
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Modifier') onUpdate(observation);
        if (options[buttonIndex] === 'Supprimer') onObservationDeleteRequest();
      }
    );
  };

  const onObservationDeleteRequest = () => {
    Alert.alert('Voulez-vous supprimer cette observation ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => onObservationDelete(),
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onObservationDelete = async () => {
    const response = await context.deleteTerritoryObs(observation._id);
    if (!response.ok) {
      return Alert.alert(response.error);
    }
  };

  const { user, createdAt, personsMale, personsFemale, police, material, atmosphere, mediation, comment } = observation;

  return (
    <Container>
      <CaptionsContainer>
        <CommentStyled filledUp={!!personsMale}>Nombre de personnes non connues hommes rencontrées: {personsMale}</CommentStyled>
        <CommentStyled filledUp={!!personsFemale}>Nombre de personnes non connues femmes rencontrées: {personsFemale}</CommentStyled>
        <CommentStyled filledUp={!!police}>Présence policière: {police}</CommentStyled>
        <CommentStyled filledUp={!!material}>Nombre de matériel ramassé: {material}</CommentStyled>
        <CommentStyled filledUp={!!atmosphere}>Ambiance: {atmosphere}</CommentStyled>
        <CommentStyled filledUp={!!mediation}>Nombre de médiations avec les riverains / les structures: {mediation}</CommentStyled>
        <CommentStyled filledUp={!!comment}>Commentaire: {comment?.split('\\n')?.join('\u000A')}</CommentStyled>
        <CreationDate>
          {!!user && <UserName caption="Observation faite par" id={user?._id || user} />}
          {'\u000A'}
          {new Date(createdAt).getLocaleDateAndTime('fr')}
        </CreationDate>
      </CaptionsContainer>
      <OnMoreContainer hitSlop={hitSlop} onPress={onPressRequest}>
        <Dot />
        <Dot />
        <Dot />
      </OnMoreContainer>
    </Container>
  );
};

const Container = styled.View`
  background-color: #f4f5f8;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  margin-horizontal: 30px;
  margin-vertical: 8px;
`;

const CaptionsContainer = styled.View`
  padding-top: 25px;
  padding-bottom: 5px;
  padding-horizontal: 15px;
  flex-grow: 1;
  /* flex-basis: 100%; */
  align-items: flex-start;
`;

const CommentStyled = styled(MyText)`
  font-size: 17px;
  margin-bottom: 10px;
  color: rgba(30, 36, 55, 0.75);
  ${(props) => !props.filledUp && 'opacity: 0.25;'}
`;

const CreationDate = styled(MyText)`
  font-style: italic;
  margin-left: auto;
  margin-top: 10px;
  margin-bottom: 10px;
  margin-right: 25px;
  color: ${colors.app.color};
  text-align: right;
`;

const OnMoreContainer = styled.TouchableOpacity`
  flex-direction: row;
  position: absolute;
  top: 16px;
  right: 8px;
`;

const Dot = styled.View`
  width: 3px;
  height: 3px;
  border-radius: 3px;
  background-color: rgba(30, 36, 55, 0.5);
  margin-right: 3px;
`;

export default compose(connectActionSheet, withContext(TerritoryObservationsContext), withContext(AuthContext))(TerritoryObservationRow);